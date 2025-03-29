
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ru } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MoodEntry, TestEntry, StatsData } from "@/types";
import { getMoodEntries, getTestEntries } from "@/utils/storage";
import { formatDate } from "@/utils/dateUtils";

// Define colors for charts
const COLORS = ["#0EA5E9", "#8B5CF6", "#10B981", "#F59E0B"];

const Statistics = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [testEntries, setTestEntries] = useState<TestEntry[]>([]);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "3months">("week");
  const [moodData, setMoodData] = useState<StatsData[]>([]);
  const [testData, setTestData] = useState<any[]>([]);
  const [testDistribution, setTestDistribution] = useState<any[]>([]);
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (moodEntries.length > 0) {
      processMoodData();
    }
    
    if (testEntries.length > 0) {
      processTestData();
    }
  }, [moodEntries, testEntries, timeRange]);
  
  const loadData = () => {
    const loadedMoodEntries = getMoodEntries();
    const loadedTestEntries = getTestEntries();
    
    setMoodEntries(loadedMoodEntries);
    setTestEntries(loadedTestEntries);
  };
  
  const processMoodData = () => {
    let startDate = new Date();
    let groupByFormat = "d MMM";
    
    // Define time range
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
      groupByFormat = "d MMM";
    } else if (timeRange === "3months") {
      startDate = subMonths(new Date(), 3);
      groupByFormat = "LLL yyyy";
    }
    
    // Filter entries by date range
    const filteredEntries = moodEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= new Date();
    });
    
    // Group by date
    const dataByDate = new Map<string, { mood: number[], energy: number[] }>();
    
    // Initialize dates
    if (timeRange === "week" || timeRange === "month") {
      const dateRange = eachDayOfInterval({
        start: startDate,
        end: new Date()
      });
      
      dateRange.forEach(date => {
        const formattedDate = format(date, groupByFormat, { locale: ru });
        dataByDate.set(formattedDate, { mood: [], energy: [] });
      });
    } else if (timeRange === "3months") {
      let currentDate = startOfMonth(startDate);
      const endDate = endOfMonth(new Date());
      
      while (currentDate <= endDate) {
        const formattedDate = format(currentDate, groupByFormat, { locale: ru });
        dataByDate.set(formattedDate, { mood: [], energy: [] });
        currentDate = startOfMonth(subDays(endOfMonth(currentDate), -1));
      }
    }
    
    // Add entries to data
    filteredEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const formattedDate = format(entryDate, groupByFormat, { locale: ru });
      
      const existingData = dataByDate.get(formattedDate) || { mood: [], energy: [] };
      existingData.mood.push(entry.mood);
      existingData.energy.push(entry.energy);
      
      dataByDate.set(formattedDate, existingData);
    });
    
    // Convert to array and calculate averages
    const moodStats = Array.from(dataByDate.entries()).map(([date, values]) => {
      const moodAvg = values.mood.length > 0
        ? values.mood.reduce((sum, val) => sum + val, 0) / values.mood.length
        : 0;
        
      const energyAvg = values.energy.length > 0
        ? values.energy.reduce((sum, val) => sum + val, 0) / values.energy.length
        : 0;
      
      return {
        date,
        mood: Number(moodAvg.toFixed(1)),
        energy: Number(energyAvg.toFixed(1))
      };
    });
    
    setMoodData(moodStats);
  };
  
  const processTestData = () => {
    let startDate = new Date();
    
    // Define time range
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
    } else if (timeRange === "3months") {
      startDate = subMonths(new Date(), 3);
    }
    
    // Filter entries by date range
    const filteredEntries = testEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= new Date();
    });
    
    // Count tests by day
    const testsByDay = new Map<string, number>();
    
    filteredEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const formattedDate = format(entryDate, "d MMM", { locale: ru });
      
      const count = testsByDay.get(formattedDate) || 0;
      testsByDay.set(formattedDate, count + 1);
    });
    
    // Convert to array
    const testCountData = Array.from(testsByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
    
    setTestData(testCountData);
    
    // Count tests by type (daily vs weekly)
    const dailyTests = filteredEntries.filter(entry => !entry.isWeeklyTest).length;
    const weeklyTests = filteredEntries.filter(entry => entry.isWeeklyTest).length;
    
    setTestDistribution([
      { name: "Ежедневные", value: dailyTests },
      { name: "Еженедельные", value: weeklyTests }
    ]);
  };
  
  const getAverageStats = () => {
    if (moodEntries.length === 0) return { avgMood: 0, avgEnergy: 0 };
    
    let startDate = new Date();
    
    // Define time range
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
    } else if (timeRange === "3months") {
      startDate = subMonths(new Date(), 3);
    }
    
    // Filter entries by date range
    const filteredEntries = moodEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= new Date();
    });
    
    if (filteredEntries.length === 0) return { avgMood: 0, avgEnergy: 0 };
    
    const totalMood = filteredEntries.reduce((sum, entry) => sum + entry.mood, 0);
    const totalEnergy = filteredEntries.reduce((sum, entry) => sum + entry.energy, 0);
    
    return {
      avgMood: Number((totalMood / filteredEntries.length).toFixed(1)),
      avgEnergy: Number((totalEnergy / filteredEntries.length).toFixed(1))
    };
  };
  
  const getCompletedTests = () => {
    let startDate = new Date();
    
    // Define time range
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
    } else if (timeRange === "3months") {
      startDate = subMonths(new Date(), 3);
    }
    
    // Filter entries by date range
    return testEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= new Date();
    }).length;
  };

  const { avgMood, avgEnergy } = getAverageStats();
  const completedTests = getCompletedTests();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Статистика</h2>
          <p className="text-muted-foreground">
            Анализ вашего настроения, энергии и прогресса по тестам
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="time-range" className="text-sm font-medium">
            Период:
          </Label>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Неделя</SelectItem>
              <SelectItem value="month">Месяц</SelectItem>
              <SelectItem value="3months">3 месяца</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Среднее настроение
            </CardTitle>
            <CardDescription>
              {timeRange === "week" 
                ? "За последние 7 дней"
                : timeRange === "month" 
                ? "За последние 30 дней" 
                : "За последние 3 месяца"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMood}</div>
            <p className="text-xs text-muted-foreground">
              Из 10 возможных баллов
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Средняя энергия
            </CardTitle>
            <CardDescription>
              {timeRange === "week" 
                ? "За последние 7 дней"
                : timeRange === "month" 
                ? "За последние 30 дней" 
                : "За последние 3 месяца"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEnergy}</div>
            <p className="text-xs text-muted-foreground">
              Из 10 возможных баллов
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Выполнено тестов
            </CardTitle>
            <CardDescription>
              {timeRange === "week" 
                ? "За последние 7 дней"
                : timeRange === "month" 
                ? "За последние 30 дней" 
                : "За последние 3 месяца"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTests}</div>
            <p className="text-xs text-muted-foreground">
              Всего записей в системе
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="mood" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mood">Настроение и энергия</TabsTrigger>
          <TabsTrigger value="tests">Тесты</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mood">
          <Card>
            <CardHeader>
              <CardTitle>Динамика настроения и энергии</CardTitle>
              <CardDescription>
                {timeRange === "week" 
                  ? "За последние 7 дней"
                  : timeRange === "month" 
                  ? "За последние 30 дней" 
                  : "За последние 3 месяца"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={moodData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    name="Настроение"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Энергия"
                    stroke="#0EA5E9"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tests">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Количество тестов по дням</CardTitle>
                <CardDescription>
                  {timeRange === "week" 
                    ? "За последние 7 дней"
                    : timeRange === "month" 
                    ? "За последние 30 дней" 
                    : "За последние 3 месяца"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={testData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Количество тестов"
                      fill="#0EA5E9"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Распределение типов тестов</CardTitle>
                <CardDescription>
                  Соотношение ежедневных и еженедельных тестов
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {testDistribution.length > 0 && testDistribution.some(item => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={testDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {testDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} тестов`, "Количество"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">Нет данных для отображения</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>История записей</CardTitle>
          <CardDescription>
            Полная история записей о настроении и энергии
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-6 p-4 bg-secondary text-secondary-foreground font-medium">
              <div className="col-span-1">Дата</div>
              <div className="col-span-1">Время дня</div>
              <div className="col-span-1">Настроение</div>
              <div className="col-span-1">Энергия</div>
              <div className="col-span-2">Комментарий</div>
            </div>
            
            <div className="max-h-96 overflow-auto">
              {moodEntries.length > 0 ? (
                moodEntries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-6 p-4 border-t items-center"
                    >
                      <div className="col-span-1 text-sm">
                        {formatDate(entry.date)}
                      </div>
                      <div className="col-span-1">
                        {entry.timeOfDay === "morning"
                          ? "Утро"
                          : entry.timeOfDay === "afternoon"
                          ? "День"
                          : "Вечер"}
                      </div>
                      <div className="col-span-1 font-medium">
                        {entry.mood}/10
                      </div>
                      <div className="col-span-1 font-medium">
                        {entry.energy}/10
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {entry.comment || "-"}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Нет записей о настроении и энергии
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;
