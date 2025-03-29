
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
