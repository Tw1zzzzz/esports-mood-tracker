export interface MoodEntry {
  id: string;
  date: string;
  mood: number;
  energy: number;
  notes?: string;
}

export interface TestEntry {
  id: string;
  date: string;
  type: string;
  score: number;
  notes?: string;
}

export interface StatsData {
  date: string;
  mood: number;
  energy: number;
}

export interface WeeklyData {
  date?: string;
  week?: string;
  mood?: number;
  energy?: number;
  moodAvg?: number;
  energyAvg?: number;
  testsCompleted?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "player" | "staff";
  completedTests?: boolean;
  completedBalanceWheel?: boolean;
  createdAt?: string;
  photoUrl?: string;
}

export interface BalanceWheel {
  id: string;
  userId: string;
  playerName?: string;
  date: Date;
  physical: number;
  emotional: number;
  intellectual: number;
  spiritual: number;
  occupational: number;
  social: number;
  environmental: number;
  financial: number;
}

export interface BalanceWheelData {
  physical: number;
  emotional: number;
  intellectual: number;
  spiritual: number;
  occupational: number;
  social: number;
  environmental: number;
  financial: number;
}
