import type { Server, Socket } from 'socket.io';
import {
  ALPHABETS,
  countDistinctPlateLetters,
  isValidManualLetters,
  scoreWord,
  type Language,
  type MatchSettings,
  type SubmitResult,
} from '@plate-game/shared';
import { dictionaryService } from './dictionaryService.js';
import { COUNTDOWN_MS, SessionStore, type GameSession } from './sessionStore.js';

interface ClientContext {
  playerId: string;
  passcode: string;
}

const clientContexts = new Map<string, ClientContext>();

function randomLetters(language: Language): string[] {
  const alphabet = ALPHABETS[language];
  const letters: string[] = [];
  for (let i = 0; i < 4; i++) {
    letters.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }
  return letters;
}

function emitState(io: Server, session: GameSession, store: SessionStore): void {
  const snapshot = store.toSnapshot(session);
  io.to(session.passcode).emit('session:state', snapshot);
}

function emitToPlayer(
  io: Server,
  session: GameSession,
  playerId: string,
  event: string,
  data: unknown,
): void {
  const player = session.players.get(playerId);
  if (player?.socketId) {
    io.to(player.socketId).emit(event, data);
  }
}

function validateWord(
  word: string,
  plateLetters: string[],
  language: Language,
): SubmitResult {
  const trimmed = word.trim();
  if (!trimmed) {
    return { valid: false, reason: 'Enter a word' };
  }

  if (!dictionaryService.has(trimmed, language)) {
    return { valid: false, reason: 'Not in dictionary' };
  }

  const matchCount = countDistinctPlateLetters(trimmed, plateLetters);
  if (matchCount === 0) {
    return { valid: false, reason: 'Must contain a plate letter' };
  }

  return { valid: true };
}

function allConnectedGaveUp(session: GameSession, store: SessionStore): boolean {
  const connected = store.getConnectedPlayers(session);
  return connected.length > 0 && connected.every((p) => p.gaveUp);
}

function endRound(io: Server, session: GameSession, store: SessionStore): void {
  if (session.phase !== 'roundActive') return;

  store.clearTimers(session);
  session.phase = 'roundSummary';
  const result = store.finalizeRound(session);

  io.to(session.passcode).emit('round:end', {
    result,
    snapshot: store.toSnapshot(session),
  });
}

function startCountdown(io: Server, session: GameSession, store: SessionStore): void {
  session.phase = 'countdown';
  session.countdownEndsAt = Date.now() + COUNTDOWN_MS;

  io.to(session.passcode).emit('round:countdown', {
    endsAt: session.countdownEndsAt,
    letters: session.letters,
  });

  session.countdownTimer = setTimeout(() => {
    startRound(io, session, store);
  }, COUNTDOWN_MS);
}

function startRound(io: Server, session: GameSession, store: SessionStore): void {
  session.phase = 'roundActive';
  session.roundStartedAt = Date.now();
  store.resetRoundPlayerState(session);

  io.to(session.passcode).emit('round:start', {
    letters: session.letters,
    startedAt: session.roundStartedAt,
    durationMs: session.roundDurationMs,
  });

  session.roundTimer = setInterval(() => {
    if (!session.roundStartedAt) return;
    const elapsed = Date.now() - session.roundStartedAt;
    const remaining = Math.max(0, session.roundDurationMs - elapsed);
    io.to(session.passcode).emit('round:tick', { remainingMs: remaining });

    if (remaining <= 0) {
      endRound(io, session, store);
    }
  }, 1000);

  session.roundEndTimer = setTimeout(() => {
    endRound(io, session, store);
  }, session.roundDurationMs);
}

export function registerSocketHandlers(io: Server, store: SessionStore): void {
  io.on('connection', (socket: Socket) => {
    socket.on('session:create', ({ nickname }: { nickname: string }) => {
      if (!nickname?.trim()) {
        socket.emit('error', { code: 'INVALID_NICKNAME', message: 'Nickname required' });
        return;
      }

      const session = store.createSession(nickname, socket.id);
      const player = session.players.get(session.hostId)!;
      clientContexts.set(socket.id, { playerId: player.id, passcode: session.passcode });
      socket.join(session.passcode);
      socket.emit('session:state', store.toSnapshot(session));
    });

    socket.on('session:join', ({ passcode, nickname }: { passcode: string; nickname: string }) => {
      if (!nickname?.trim()) {
        socket.emit('error', { code: 'INVALID_NICKNAME', message: 'Nickname required' });
        return;
      }
      if (!passcode?.trim()) {
        socket.emit('error', { code: 'INVALID_PASSCODE', message: 'Passcode required' });
        return;
      }

      const result = store.joinSession(passcode, nickname, socket.id);
      if ('error' in result) {
        socket.emit('error', { code: 'SESSION_NOT_FOUND', message: result.error });
        return;
      }

      const { session, player } = result;
      clientContexts.set(socket.id, { playerId: player.id, passcode: session.passcode });
      socket.join(session.passcode);
      emitState(io, session, store);
    });

    socket.on('lobby:updateSettings', (settings: Partial<MatchSettings>) => {
      const ctx = clientContexts.get(socket.id);
      if (!ctx) return;
      const session = store.getSession(ctx.passcode);
      if (!session || session.hostId !== ctx.playerId) return;

      store.updateSettings(session, settings);
      emitState(io, session, store);
    });

    socket.on('match:start', () => {
      const ctx = clientContexts.get(socket.id);
      if (!ctx) return;
      const session = store.getSession(ctx.passcode);
      if (!session || session.hostId !== ctx.playerId || session.phase !== 'lobby') return;

      session.currentRound = 1;
      session.phase = 'letterPick';
      session.roundDurationMs = session.settings.durationSec * 1000;
      emitState(io, session, store);
    });

    socket.on(
      'round:setLetters',
      ({ mode, letters }: { mode: 'random' | 'manual'; letters?: string }) => {
        const ctx = clientContexts.get(socket.id);
        if (!ctx) return;
        const session = store.getSession(ctx.passcode);
        if (!session || session.hostId !== ctx.playerId || session.phase !== 'letterPick') return;

        if (mode === 'random') {
          session.letters = randomLetters(session.settings.language);
        } else {
          if (!letters || !isValidManualLetters(letters, session.settings.language)) {
            socket.emit('error', {
              code: 'INVALID_LETTERS',
              message: 'Enter exactly 4 valid letters',
            });
            return;
          }
          session.letters = [...letters.toUpperCase()];
        }

        startCountdown(io, session, store);
      },
    );

    socket.on('round:submit', ({ word }: { word: string }) => {
      const ctx = clientContexts.get(socket.id);
      if (!ctx) return;
      const session = store.getSession(ctx.passcode);
      if (!session || session.phase !== 'roundActive') return;

      const player = session.players.get(ctx.playerId);
      if (!player || player.gaveUp) return;

      const validation = validateWord(word, session.letters, session.settings.language);
      if (!validation.valid) {
        emitToPlayer(io, session, ctx.playerId, 'round:submitResult', validation);
        return;
      }

      const elapsedMs = session.roundStartedAt
        ? Date.now() - session.roundStartedAt
        : session.roundDurationMs;
      const { tier, score } = scoreWord(
        word,
        session.letters,
        elapsedMs,
        session.roundDurationMs,
      );

      const submission = { word: word.trim(), score, tier, elapsedMs };
      store.recordSubmission(session, ctx.playerId, submission);

      emitToPlayer(io, session, ctx.playerId, 'round:submitResult', {
        valid: true,
        score,
        tier,
      });
    });

    socket.on('round:giveUp', () => {
      const ctx = clientContexts.get(socket.id);
      if (!ctx) return;
      const session = store.getSession(ctx.passcode);
      if (!session || session.phase !== 'roundActive') return;

      const player = session.players.get(ctx.playerId);
      if (!player) return;

      player.gaveUp = true;
      io.to(session.passcode).emit('round:playerGaveUp', { playerId: ctx.playerId });

      if (allConnectedGaveUp(session, store)) {
        endRound(io, session, store);
      }
    });

    socket.on('round:next', () => {
      const ctx = clientContexts.get(socket.id);
      if (!ctx) return;
      const session = store.getSession(ctx.passcode);
      if (!session || session.hostId !== ctx.playerId || session.phase !== 'roundSummary') return;

      if (session.currentRound >= session.settings.rounds) {
        session.phase = 'finalResults';
        emitState(io, session, store);
        return;
      }

      session.currentRound += 1;
      session.phase = 'letterPick';
      session.letters = [];
      emitState(io, session, store);
    });

    socket.on('match:end', () => {
      const ctx = clientContexts.get(socket.id);
      if (!ctx) return;
      const session = store.getSession(ctx.passcode);
      if (!session || session.hostId !== ctx.playerId) return;

      if (session.phase === 'roundSummary' || session.phase === 'roundActive') {
        if (session.phase === 'roundActive') {
          endRound(io, session, store);
        }
        session.phase = 'finalResults';
        emitState(io, session, store);
      }
    });

    socket.on('match:playAgain', () => {
      const ctx = clientContexts.get(socket.id);
      if (!ctx) return;
      const session = store.getSession(ctx.passcode);
      if (!session || session.hostId !== ctx.playerId || session.phase !== 'finalResults') return;

      store.resetForPlayAgain(session);
      emitState(io, session, store);
    });

    socket.on('session:leave', () => {
      const ctx = clientContexts.get(socket.id);
      if (!ctx) return;

      const session = store.disconnectPlayer(ctx.playerId);
      clientContexts.delete(socket.id);
      socket.leave(ctx.passcode);

      if (session) {
        emitState(io, session, store);
      }
    });

    socket.on('disconnect', () => {
      const ctx = clientContexts.get(socket.id);
      if (!ctx) return;

      const session = store.disconnectPlayer(ctx.playerId);
      clientContexts.delete(socket.id);

      if (session) {
        emitState(io, session, store);

        if (session.phase === 'roundActive' && allConnectedGaveUp(session, store)) {
          endRound(io, session, store);
        }
      }
    });
  });
}
