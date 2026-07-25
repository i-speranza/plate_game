import { io, Socket } from 'socket.io-client';
import type { MatchSettings, SessionSnapshot, SubmitResult } from '@plate-game/shared';

export type GameSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export interface ClientToServerEvents {
  'session:create': (data: { nickname: string }) => void;
  'session:join': (data: { passcode: string; nickname: string }) => void;
  'session:leave': () => void;
  'lobby:updateSettings': (settings: Partial<MatchSettings>) => void;
  'match:start': () => void;
  'round:setLetters': (data: { mode: 'random' | 'manual'; letters?: string }) => void;
  'round:submit': (data: { word: string }) => void;
  'round:giveUp': () => void;
  'round:next': () => void;
  'match:end': () => void;
  'match:playAgain': () => void;
}

export interface ServerToClientEvents {
  'session:state': (snapshot: SessionSnapshot) => void;
  'round:countdown': (data: { endsAt: number; durationMs: number; letters: string[] }) => void;
  'round:start': (data: { letters: string[]; startedAt: number; durationMs: number }) => void;
  'round:tick': (data: { remainingMs: number }) => void;
  'round:submitResult': (result: SubmitResult) => void;
  'round:playerGaveUp': (data: { playerId: string }) => void;
  'round:end': (data: { result: unknown; snapshot: SessionSnapshot }) => void;
  error: (data: { code: string; message: string }) => void;
}

let socket: GameSocket | null = null;

export function getSocket(): GameSocket {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
