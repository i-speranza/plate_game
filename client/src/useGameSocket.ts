import { useCallback, useEffect, useState } from 'react';
import type { SessionSnapshot, SubmitResult } from '@plate-game/shared';
import { getSocket } from './socket';

export function useGameSocket() {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [countdownEndsAt, setCountdownEndsAt] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onState = (state: SessionSnapshot) => {
      setSnapshot(state);
      setError(null);
      const storedId = sessionStorage.getItem('plateGamePlayerId');
      const storedNick = sessionStorage.getItem('plateGameNickname');
      if (storedId && state.players.some((p) => p.id === storedId)) {
        setPlayerId(storedId);
      } else if (storedNick) {
        const me = state.players.find(
          (p) => p.nickname.toLowerCase() === storedNick.toLowerCase(),
        );
        if (me) {
          setPlayerId(me.id);
          sessionStorage.setItem('plateGamePlayerId', me.id);
        }
      }
    };
    const onCountdown = (data: { endsAt: number; letters: string[] }) => {
      setCountdownEndsAt(data.endsAt);
      setSnapshot((prev) => (prev ? { ...prev, letters: data.letters, phase: 'countdown' } : prev));
    };
    const onRoundStart = (data: { startedAt: number; durationMs: number; letters: string[] }) => {
      setRemainingMs(data.durationMs);
      setCountdownEndsAt(null);
      setSubmitResult(null);
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              phase: 'roundActive',
              letters: data.letters,
              roundStartedAt: data.startedAt,
              roundDurationMs: data.durationMs,
              players: prev.players.map((p) => ({
                ...p,
                gaveUp: false,
                bestSubmission: null,
              })),
            }
          : prev,
      );
    };
    const onPlayerGaveUp = (data: { playerId: string }) => {
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              players: prev.players.map((p) =>
                p.id === data.playerId ? { ...p, gaveUp: true } : p,
              ),
            }
          : prev,
      );
    };
    const onTick = (data: { remainingMs: number }) => setRemainingMs(data.remainingMs);
    const onSubmitResult = (result: SubmitResult) => setSubmitResult(result);
    const onRoundEnd = (data: { snapshot: SessionSnapshot }) => {
      setSnapshot(data.snapshot);
      setRemainingMs(null);
    };
    const onError = (data: { code: string; message: string }) => setError(data.code);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('session:state', onState);
    socket.on('round:countdown', onCountdown);
    socket.on('round:start', onRoundStart);
    socket.on('round:playerGaveUp', onPlayerGaveUp);
    socket.on('round:tick', onTick);
    socket.on('round:submitResult', onSubmitResult);
    socket.on('round:end', onRoundEnd);
    socket.on('error', onError);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('session:state', onState);
      socket.off('round:countdown', onCountdown);
      socket.off('round:start', onRoundStart);
      socket.off('round:playerGaveUp', onPlayerGaveUp);
      socket.off('round:tick', onTick);
      socket.off('round:submitResult', onSubmitResult);
      socket.off('round:end', onRoundEnd);
      socket.off('error', onError);
    };
  }, []);

  const createSession = useCallback((nickname: string) => {
    const socket = getSocket();
    socket.emit('session:create', { nickname });
    socket.once('session:state', (state) => {
      const me = state.players.find((p) => p.isHost);
      if (me) {
        setPlayerId(me.id);
        sessionStorage.setItem('plateGamePlayerId', me.id);
        sessionStorage.setItem('plateGamePasscode', state.passcode);
        sessionStorage.setItem('plateGameNickname', me.nickname);
      }
    });
  }, []);

  const joinSession = useCallback((passcode: string, nickname: string) => {
    const socket = getSocket();
    socket.emit('session:join', { passcode, nickname });
    socket.once('session:state', (state) => {
      const me = state.players.find(
        (p) => p.nickname.toLowerCase() === nickname.toLowerCase(),
      ) ?? state.players[state.players.length - 1];
      if (me) {
        setPlayerId(me.id);
        sessionStorage.setItem('plateGamePlayerId', me.id);
        sessionStorage.setItem('plateGamePasscode', state.passcode);
        sessionStorage.setItem('plateGameNickname', me.nickname);
      }
    });
  }, []);

  const leaveSession = useCallback(() => {
    getSocket().emit('session:leave');
    setSnapshot(null);
    setPlayerId(null);
    setError(null);
    setRemainingMs(null);
    setCountdownEndsAt(null);
    setSubmitResult(null);
    sessionStorage.removeItem('plateGamePlayerId');
    sessionStorage.removeItem('plateGamePasscode');
    sessionStorage.removeItem('plateGameNickname');
    const url = new URL(window.location.href);
    if (url.searchParams.has('code')) {
      url.searchParams.delete('code');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  }, []);

  const clearSubmitResult = useCallback(() => setSubmitResult(null), []);

  return {
    snapshot,
    playerId,
    error,
    remainingMs,
    countdownEndsAt,
    submitResult,
    connected,
    createSession,
    joinSession,
    leaveSession,
    clearSubmitResult,
    socket: getSocket(),
  };
}
