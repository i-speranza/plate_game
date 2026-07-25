import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { setUiLanguage } from './i18n';
import { translateError } from './translateError';
import { useGameSocket } from './useGameSocket';
import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { CountdownScreen, LetterPickScreen } from './screens/LetterPickScreen';
import { RoundScreen } from './screens/RoundScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { FinalScreen } from './screens/FinalScreen';

export default function App() {
  const { t } = useTranslation();
  const {
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
    socket,
  } = useGameSocket();

  useEffect(() => {
    const passcode = sessionStorage.getItem('plateGamePasscode');
    const nickname = sessionStorage.getItem('plateGameNickname');
    if (passcode && nickname && !snapshot && connected) {
      joinSession(passcode, nickname);
    }
  }, [connected, snapshot, joinSession]);

  useEffect(() => {
    if (snapshot?.settings.language) {
      setUiLanguage(snapshot.settings.language);
    }
  }, [snapshot?.settings.language]);

  useEffect(() => {
    document.title = t('appTitle');
  }, [t]);

  const isHost = snapshot ? snapshot.hostId === playerId : false;
  const me = snapshot?.players.find((p) => p.id === playerId);
  const errorMessage = error ? translateError(t, error) : null;

  if (!snapshot) {
    return (
      <div className="app">
        <HomeScreen
          onCreate={createSession}
          onJoin={joinSession}
          error={error}
          connected={connected}
        />
      </div>
    );
  }

  let content;

  switch (snapshot.phase) {
    case 'lobby':
      content = (
        <LobbyScreen
          snapshot={snapshot}
          isHost={isHost}
          onUpdateSettings={(s) => socket.emit('lobby:updateSettings', s)}
          onStart={() => socket.emit('match:start')}
        />
      );
      break;
    case 'letterPick':
      content = (
        <LetterPickScreen
          isHost={isHost}
          roundNumber={snapshot.currentRound}
          totalRounds={snapshot.totalRounds}
          onSetLetters={(mode, letters) => socket.emit('round:setLetters', { mode, letters })}
        />
      );
      break;
    case 'countdown':
      content = (
        <CountdownScreen letters={snapshot.letters} endsAt={countdownEndsAt ?? snapshot.countdownEndsAt} />
      );
      break;
    case 'roundActive':
      content = (
        <RoundScreen
          letters={snapshot.letters}
          roundNumber={snapshot.currentRound}
          totalRounds={snapshot.totalRounds}
          durationMs={snapshot.roundDurationMs}
          remainingMs={remainingMs}
          gaveUp={me?.gaveUp ?? false}
          submitResult={submitResult}
          onSubmit={(word) => socket.emit('round:submit', { word })}
          onGiveUp={() => socket.emit('round:giveUp')}
          onClearFeedback={clearSubmitResult}
        />
      );
      break;
    case 'roundSummary':
      content = (
        <SummaryScreen
          snapshot={snapshot}
          isHost={isHost}
          playerId={playerId}
          onNext={() => socket.emit('round:next')}
          onEnd={() => socket.emit('match:end')}
        />
      );
      break;
    case 'finalResults':
      content = (
        <FinalScreen
          snapshot={snapshot}
          isHost={isHost}
          playerId={playerId}
          onPlayAgain={() => socket.emit('match:playAgain')}
          onLeave={leaveSession}
        />
      );
      break;
    default:
      content = null;
  }

  return (
    <div className="app">
      {errorMessage && <div className="error-banner">{errorMessage}</div>}
      {content}
    </div>
  );
}
