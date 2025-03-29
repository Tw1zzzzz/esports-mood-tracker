
export interface MoodEntry {
  id: string;
  date: Date;
  timeOfDay: "morning" | "afternoon" | "evening";
  mood: number;
  energy: number;
  comment?: string;
}

export interface TestEntry {
  id: string;
  date: Date;
  name: string;
  link: string;
  screenshotUrl?: string;
  isWeeklyTest: boolean;
}

export interface StatsData {
  date: string;
  mood: number;
  energy: number;
}

export interface WeeklyData {
  week: string;
  moodAvg: number;
  energyAvg: number;
  testsCompleted: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "player" | "staff";
  photoUrl?: string;
}

export interface BalanceWheel {
  id: string;
  userId: string;
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
