
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type PlayerRole = 'Batting' | 'Bowling';
export type TossChoice = 'Heads' | 'Tails';
export type GamePhase = 'Home' | 'Toss' | 'TossResult' | 'Innings1' | 'MidInnings' | 'Innings2' | 'GameOver';

export interface PlayerStats {
  name: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  totalRuns: number;
  highScore: number;
}

export interface GameState {
  playerName: string;
  difficulty: Difficulty;
  phase: GamePhase;
  userRole: PlayerRole;
  currentInnings: 1 | 2;
  score: number;
  wickets: number;
  target: number | null;
  userLastChoice: number | null;
  aiLastChoice: number | null;
  history: { user: number; ai: number; role: PlayerRole }[];
  isOut: boolean;
  message: string;
}

export interface LeaderboardEntry {
  name: string;
  highScore: number;
  wins: number;
}
