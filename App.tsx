
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Difficulty, TossChoice, PlayerRole, PlayerStats, LeaderboardEntry } from './types';
import { GameServer } from './services/gameServer';
import { StorageService } from './services/storageService';
import Scoreboard from './components/Scoreboard';
import HandIcon from './components/HandIcon';

const App: React.FC = () => {
  const [playerName, setPlayerName] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [game, setGame] = useState<GameServer | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setLeaderboard(StorageService.getLeaderboard());
    setStats(StorageService.getStats());
  }, []);

  const startGame = () => {
    if (!playerName.trim()) return;
    const newGame = new GameServer(playerName, difficulty);
    setGame(newGame);
    setGameState({ ...newGame.getState(), phase: 'Toss' });
  };

  const handleToss = async (choice: TossChoice) => {
    if (!game) return;
    setIsProcessing(true);
    const newState = await game.performToss(choice);
    setGameState(newState);
    setIsProcessing(false);
  };

  const handleTossDecision = async (role: PlayerRole) => {
    if (!game) return;
    const newState = await game.setRole(role);
    setGameState(newState);
  };

  const handlePlayTurn = async (num: number) => {
    if (!game || isProcessing) return;
    setIsProcessing(true);
    
    // Artificial delay for tension
    setTimeout(async () => {
      const newState = await game.playTurn(num);
      setGameState(newState);
      setIsProcessing(false);

      if (newState.phase === 'GameOver') {
        saveMatchResult(newState);
      }
    }, 400);
  };

  const handleNextInnings = async () => {
    if (!game) return;
    const newState = await game.startSecondInnings();
    setGameState(newState);
  };

  const saveMatchResult = (finalState: GameState) => {
    const currentStats = StorageService.getStats();
    const isUserWinner = finalState.message.toLowerCase().includes('you won');
    
    const updatedStats: PlayerStats = {
      ...currentStats,
      name: finalState.playerName,
      matchesPlayed: currentStats.matchesPlayed + 1,
      wins: currentStats.wins + (isUserWinner ? 1 : 0),
      losses: currentStats.losses + (isUserWinner ? 0 : 1),
      totalRuns: currentStats.totalRuns + finalState.score,
      highScore: Math.max(currentStats.highScore, finalState.score)
    };
    
    StorageService.saveStats(updatedStats);
    setStats(updatedStats);
    setLeaderboard(StorageService.getLeaderboard());
  };

  const resetGame = () => {
    setGame(null);
    setGameState(null);
  };

  // Render Screens
  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
        <div className="text-center mb-10 animate-bounce-subtle">
          <h1 className="text-6xl font-black font-outfit text-white mb-2 drop-shadow-xl">
            HAND <span className="text-emerald-500">CRICKET</span> PRO
          </h1>
        </div>

        <div className="glass-card p-8 rounded-3xl w-full max-w-md shadow-2xl">
          <div className="mb-6">
            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Player Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="Enter your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>

          <div className="mb-8">
            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-2 rounded-lg font-bold text-sm transition-all ${
                    difficulty === d ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={startGame}
            disabled={!playerName.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black py-4 rounded-xl transition-all shadow-xl active:scale-95 uppercase tracking-widest"
          >
            Start Match
          </button>
        </div>

        {leaderboard.length > 0 && (
          <div className="mt-12 w-full max-w-md">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-trophy text-amber-400"></i> Local Leaderboard
            </h3>
            <div className="glass-card rounded-2xl overflow-hidden">
              {leaderboard.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border-b border-slate-700/50 last:border-0">
                  <span className="text-slate-300 font-medium">{idx + 1}. {entry.name}</span>
                  <span className="text-emerald-400 font-bold">{entry.highScore} runs</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-8">
      {/* Header Info */}
      <div className="max-w-4xl mx-auto w-full flex justify-between items-center mb-8">
        <button onClick={resetGame} className="text-slate-500 hover:text-white transition-colors">
          <i className="fa-solid fa-chevron-left mr-2"></i> Quit Match
        </button>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-bold uppercase">Difficulty</p>
          <p className="text-emerald-500 font-black">{gameState.difficulty}</p>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        
        {/* Phase: Toss */}
        {gameState.phase === 'Toss' && (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-4xl font-black mb-8 font-outfit">The Toss</h2>
            <div className="flex gap-6">
              {(['Heads', 'Tails'] as TossChoice[]).map(choice => (
                <button
                  key={choice}
                  onClick={() => handleToss(choice)}
                  disabled={isProcessing}
                  className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 flex flex-col items-center justify-center hover:bg-emerald-600 hover:border-emerald-400 transition-all group active:scale-90"
                >
                  <i className={`fa-solid ${choice === 'Heads' ? 'fa-circle-user' : 'fa-coins'} text-4xl mb-2 group-hover:scale-110 transition-transform`}></i>
                  <span className="font-bold">{choice}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase: Toss Result Selection */}
        {gameState.phase === 'TossResult' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{gameState.message}</h2>
            <p className="text-slate-400 mb-8 uppercase tracking-widest font-semibold">Choose your role</p>
            <div className="flex gap-4">
              <button 
                onClick={() => handleTossDecision('Batting')}
                className="bg-emerald-500 text-slate-950 font-black px-8 py-4 rounded-xl hover:bg-emerald-400 transition-all uppercase tracking-widest"
              >
                Batting
              </button>
              <button 
                onClick={() => handleTossDecision('Bowling')}
                className="bg-amber-500 text-slate-950 font-black px-8 py-4 rounded-xl hover:bg-amber-400 transition-all uppercase tracking-widest"
              >
                Bowling
              </button>
            </div>
          </div>
        )}

        {/* Phase: Gameplay */}
        {(gameState.phase === 'Innings1' || gameState.phase === 'Innings2') && (
          <div className="w-full animate-in fade-in duration-500">
            <Scoreboard state={gameState} />

            <div className="flex flex-col md:flex-row justify-between items-center gap-12 mt-8 mb-16">
              {/* Computer Display */}
              <div className="text-center order-2 md:order-1">
                <p className="text-slate-500 font-bold uppercase text-xs mb-4">Computer</p>
                <div className={`w-32 h-32 rounded-3xl flex items-center justify-center transition-all ${
                  isProcessing ? 'animate-pulse bg-slate-800' : 'bg-slate-800 border-2 border-slate-700 shadow-lg'
                }`}>
                  {!isProcessing && gameState.aiLastChoice ? (
                    <HandIcon value={gameState.aiLastChoice} className="text-amber-400" />
                  ) : (
                    <i className="fa-solid fa-robot text-slate-600 text-4xl"></i>
                  )}
                </div>
              </div>

              {/* Status Message */}
              <div className="text-center order-1 md:order-2">
                <p className={`text-4xl font-black uppercase tracking-tighter ${
                  gameState.isOut ? 'text-red-500 animate-bounce' : 'text-white'
                }`}>
                  {isProcessing ? 'Waiting...' : gameState.message}
                </p>
              </div>

              {/* User Display */}
              <div className="text-center order-3">
                <p className="text-emerald-500 font-bold uppercase text-xs mb-4">You</p>
                <div className="w-32 h-32 rounded-3xl bg-emerald-950/30 border-2 border-emerald-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  {gameState.userLastChoice ? (
                    <HandIcon value={gameState.userLastChoice} className="text-emerald-500" />
                  ) : (
                    <i className="fa-solid fa-user text-emerald-800 text-4xl"></i>
                  )}
                </div>
              </div>
            </div>

            {/* Input Controls */}
            {!gameState.isOut && !isProcessing && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 w-full max-w-2xl mx-auto">
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    onClick={() => handlePlayTurn(num)}
                    className="aspect-square glass-card rounded-2xl flex flex-col items-center justify-center hover:bg-emerald-600 hover:border-emerald-400 transition-all group active:scale-90"
                  >
                    <HandIcon value={num} className="group-hover:scale-110 transition-transform mb-1" />
                    <span className="font-black text-xl">{num}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Phase: Mid Innings */}
        {gameState.phase === 'MidInnings' && (
          <div className="text-center animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-500">
              <i className="fa-solid fa-skull-crossbones text-4xl"></i>
            </div>
            <h2 className="text-5xl font-black mb-2 font-outfit">OUT!</h2>
            <p className="text-slate-400 text-xl mb-8">
              End of Innings 1. Target: <span className="text-amber-400 font-bold">{gameState.target}</span>
            </p>
            <button 
              onClick={handleNextInnings}
              className="bg-emerald-500 text-slate-900 font-black px-12 py-5 rounded-2xl hover:bg-emerald-400 shadow-xl shadow-emerald-900/40 transition-all uppercase tracking-widest text-lg"
            >
              Start 2nd Innings
            </button>
          </div>
        )}

        {/* Phase: Game Over */}
        {gameState.phase === 'GameOver' && (
          <div className="text-center max-w-lg w-full p-8 rounded-3xl glass-card border-2 border-emerald-500/30 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <h2 className="text-4xl font-black mb-4 font-outfit text-emerald-400">Match Over</h2>
            <div className="bg-slate-900/50 p-6 rounded-2xl mb-8">
              <p className="text-2xl font-bold mb-4">{gameState.message}</p>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Total Runs</p>
                  <p className="text-3xl font-black">{gameState.score}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Target</p>
                  <p className="text-3xl font-black text-amber-400">{gameState.target || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={startGame}
                className="bg-emerald-500 text-slate-950 font-black py-4 rounded-xl hover:bg-emerald-400 transition-all uppercase text-sm tracking-widest"
              >
                Rematch
              </button>
              <button 
                onClick={resetGame}
                className="bg-slate-700 text-white font-black py-4 rounded-xl hover:bg-slate-600 transition-all uppercase text-sm tracking-widest"
              >
                Main Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Persistence Stats Overlay (Tiny bottom corner) */}
      {stats && (
        <div className="fixed bottom-4 left-4 hidden md:block">
          <div className="bg-slate-900/80 backdrop-blur p-4 rounded-xl border border-slate-800 text-xs">
            <p className="text-slate-500 font-bold uppercase mb-1">{stats.name}'s Stats</p>
            <div className="flex gap-4">
              <span>W: <b className="text-emerald-400">{stats.wins}</b></span>
              <span>L: <b className="text-red-400">{stats.losses}</b></span>
              <span>HS: <b className="text-amber-400">{stats.highScore}</b></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
