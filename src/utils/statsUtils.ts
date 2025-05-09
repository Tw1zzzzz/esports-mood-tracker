import { MoodEntry, TestEntry, StatsData, WeeklyData } from "@/types";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ru } from "date-fns/locale";

/**
 * Возвращает количество дней в зависимости от выбранного периода времени
 */
export const daysInPeriod = (timeRange = "week") => {
  switch (timeRange) {
    case "week": return 7;
    case "month": return 30;
    case "3months": return 90;
    default: return 7;
  }
};

/**
 * Возвращает метку для выбранного периода времени
 */
export const timeRangeLabel = (timeRange: string) => {
  switch (timeRange) {
    case "week": return "за неделю";
    case "month": return "за месяц";
    case "3months": return "за 3 месяца";
    default: return "";
  }
};

/**
 * Возвращает данные о настроении по дням недели
 */
export const getMoodByDayOfWeek = (entries: MoodEntry[]) => {
  const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  
  // Инициализация массива с нулевыми значениями для каждого дня
  const result = weekDays.map(day => ({
    day,
    mood: 0,
    energy: 0,
    count: 0,
  }));
  
  // Агрегация данных по дням недели
  entries.forEach(entry => {
    const date = new Date(entry.date);
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // Преобразуем индекс для русских дней недели
    
    result[dayIndex].mood += entry.mood;
    result[dayIndex].energy += entry.energy;
    result[dayIndex].count += 1;
  });
  
  // Рассчитываем средние значения
  return result.map(item => ({
    day: item.day,
    mood: item.count ? +(item.mood / item.count).toFixed(1) : 0,
    energy: item.count ? +(item.energy / item.count).toFixed(1) : 0,
  }));
};

/**
 * Возвращает данные о тестах по дням недели
 */
export const getTestsByDayOfWeek = (entries: TestEntry[]) => {
  const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  
  const testsByDay = weekDays.map(day => ({
    day,
    count: 0,
    average: 0,
    total: 0
  }));
  
  entries.forEach(entry => {
    const date = new Date(entry.date);
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    
    testsByDay[dayIndex].count += 1;
    testsByDay[dayIndex].total += entry.score;
  });
  
  return testsByDay.map(item => ({
    ...item,
    average: item.count ? +(item.total / item.count).toFixed(1) : 0
  }));
};

/**
 * Возвращает данные для графика в необходимом формате
 */
export const getChartData = (entries: MoodEntry[]) => {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  
  return entries.map(entry => {
    const date = new Date(entry.date);
    return {
      name: days[date.getDay()],
      date: format(date, 'dd.MM.yyyy'),
      mood: entry.mood,
      energy: entry.energy
    };
  });
};

/**
 * Возвращает данные об активности игрока для графика
 */
export const getPlayerActivityChartData = (playerData: any) => {
  if (!playerData || !playerData.weeklyStats) return [];
  
  return playerData.weeklyStats.map((stat: WeeklyData) => ({
    name: stat.week,
    mood: stat.moodAvg || 0,
    energy: stat.energyAvg || 0,
    tests: stat.testsCompleted || 0
  }));
};

/**
 * Подготавливает данные о настроении для графиков на основе временного периода
 */
export const prepareMoodDataByTimeRange = (entries: MoodEntry[], timeRange: "week" | "month" | "3months"): StatsData[] => {
  if (!entries.length) return [];
  
  const now = new Date();
  let startDate: Date;
  let dateFormat = 'dd.MM';
  
  // Определяем начальную дату и формат в зависимости от временного диапазона
  switch (timeRange) {
    case "week":
      startDate = subDays(now, 7);
      dateFormat = 'dd.MM';
      break;
    case "month":
      startDate = subDays(now, 30);
      dateFormat = 'dd.MM';
      break;
    case "3months":
      startDate = subMonths(now, 3);
      dateFormat = 'MM.yyyy';
      break;
    default:
      startDate = subDays(now, 7);
      dateFormat = 'dd.MM';
  }
  
  // Создаем массив дат для выбранного периода
  const dates = eachDayOfInterval({ start: startDate, end: now });
  
  // Инициализируем данные для каждой даты
  const initialData = dates.map(date => ({
    date: format(date, dateFormat, { locale: ru }),
    fullDate: format(date, 'yyyy-MM-dd'),
    mood: 0,
    energy: 0,
    count: 0
  }));
  
  // Фильтруем записи для выбранного периода
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startDate && entryDate <= now;
  });
  
  // Агрегируем данные по датам
  filteredEntries.forEach(entry => {
    const entryDate = new Date(entry.date);
    const dateString = format(entryDate, dateFormat, { locale: ru });
    
    const dataIndex = initialData.findIndex(item => item.date === dateString);
    if (dataIndex !== -1) {
      initialData[dataIndex].mood += entry.mood;
      initialData[dataIndex].energy += entry.energy;
      initialData[dataIndex].count += 1;
    }
  });
  
  // Рассчитываем средние значения
  return initialData.map(item => ({
    date: item.date,
    mood: item.count ? +(item.mood / item.count).toFixed(1) : 0,
    energy: item.count ? +(item.energy / item.count).toFixed(1) : 0
  }));
};

/**
 * Подготавливает данные о тестах для графиков на основе временного периода
 */
export const prepareTestDataByTimeRange = (entries: TestEntry[], timeRange: "week" | "month" | "3months"): any[] => {
  if (!entries.length) return [];
  
  const now = new Date();
  let startDate: Date;
  let dateFormat = 'dd.MM';
  
  // Определяем начальную дату и формат в зависимости от временного диапазона
  switch (timeRange) {
    case "week":
      startDate = subDays(now, 7);
      dateFormat = 'dd.MM';
      break;
    case "month":
      startDate = subDays(now, 30);
      dateFormat = 'dd.MM';
      break;
    case "3months":
      startDate = subMonths(now, 3);
      dateFormat = 'MM.yyyy';
      break;
    default:
      startDate = subDays(now, 7);
      dateFormat = 'dd.MM';
  }
  
  // Фильтруем записи для выбранного периода
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startDate && entryDate <= now;
  });
  
  // Группируем результаты тестов по типу и дате
  const groupedTests: Record<string, any> = {};
  
  filteredEntries.forEach(entry => {
    const entryDate = new Date(entry.date);
    const dateString = format(entryDate, dateFormat, { locale: ru });
    
    if (!groupedTests[dateString]) {
      groupedTests[dateString] = {};
    }
    
    if (!groupedTests[dateString][entry.type]) {
      groupedTests[dateString][entry.type] = {
        total: 0,
        count: 0
      };
    }
    
    groupedTests[dateString][entry.type].total += entry.score;
    groupedTests[dateString][entry.type].count += 1;
  });
  
  // Преобразуем данные в формат для графика
  const dates = Object.keys(groupedTests);
  const testTypes = [...new Set(filteredEntries.map(entry => entry.type))];
  
  return dates.map(date => {
    const result: Record<string, any> = { date };
    
    testTypes.forEach(type => {
      const typeData = groupedTests[date][type];
      if (typeData) {
        result[type] = +(typeData.total / typeData.count).toFixed(1);
      } else {
        result[type] = 0;
      }
    });
    
    return result;
  });
};

/**
 * Подготавливает данные о распределении типов тестов для круговой диаграммы
 */
export const prepareTestDistribution = (entries: TestEntry[]): any[] => {
  if (!entries.length) return [];
  
  const testCounts: Record<string, number> = {};
  
  entries.forEach(entry => {
    if (!testCounts[entry.type]) {
      testCounts[entry.type] = 0;
    }
    testCounts[entry.type] += 1;
  });
  
  return Object.entries(testCounts).map(([name, value]) => ({ name, value }));
}; 