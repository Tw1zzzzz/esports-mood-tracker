
import { MoodEntry, TestEntry } from "@/types";

// Local Storage Keys
const MOOD_ENTRIES_KEY = "esports-mood-entries";
const TEST_ENTRIES_KEY = "esports-test-entries";

// Mood Entries
export const getMoodEntries = (): MoodEntry[] => {
  const entries = localStorage.getItem(MOOD_ENTRIES_KEY);
  
  if (!entries) {
    return [];
  }
  
  try {
    return JSON.parse(entries).map((entry: any) => ({
      ...entry,
      date: new Date(entry.date)
    }));
  } catch (error) {
    console.error("Error parsing mood entries:", error);
    return [];
  }
};

export const saveMoodEntry = (entry: Omit<MoodEntry, "id">): MoodEntry => {
  const entries = getMoodEntries();
  const newEntry = {
    ...entry,
    id: Date.now().toString(),
  };
  
  localStorage.setItem(MOOD_ENTRIES_KEY, JSON.stringify([...entries, newEntry]));
  
  return newEntry;
};

export const deleteMoodEntry = (id: string): void => {
  const entries = getMoodEntries();
  const filteredEntries = entries.filter(entry => entry.id !== id);
  
  localStorage.setItem(MOOD_ENTRIES_KEY, JSON.stringify(filteredEntries));
};

// Test Entries
export const getTestEntries = (): TestEntry[] => {
  const entries = localStorage.getItem(TEST_ENTRIES_KEY);
  
  if (!entries) {
    return [];
  }
  
  try {
    return JSON.parse(entries).map((entry: any) => ({
      ...entry,
      date: new Date(entry.date)
    }));
  } catch (error) {
    console.error("Error parsing test entries:", error);
    return [];
  }
};

export const saveTestEntry = (entry: Omit<TestEntry, "id">): TestEntry => {
  const entries = getTestEntries();
  const newEntry = {
    ...entry,
    id: Date.now().toString(),
  };
  
  localStorage.setItem(TEST_ENTRIES_KEY, JSON.stringify([...entries, newEntry]));
  
  return newEntry;
};

export const updateTestEntry = (id: string, updates: Partial<TestEntry>): TestEntry | null => {
  const entries = getTestEntries();
  const entryIndex = entries.findIndex(entry => entry.id === id);
  
  if (entryIndex === -1) {
    return null;
  }
  
  const updatedEntry = { ...entries[entryIndex], ...updates };
  entries[entryIndex] = updatedEntry;
  
  localStorage.setItem(TEST_ENTRIES_KEY, JSON.stringify(entries));
  
  return updatedEntry;
};

export const deleteTestEntry = (id: string): void => {
  const entries = getTestEntries();
  const filteredEntries = entries.filter(entry => entry.id !== id);
  
  localStorage.setItem(TEST_ENTRIES_KEY, JSON.stringify(filteredEntries));
};
