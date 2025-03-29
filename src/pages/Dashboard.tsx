
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { MoodEntry, TestEntry, StatsData, WeeklyData } from "@/types";
import { getMoodEntries, getTestEntries } from "@/utils/storage";
import { formatDate, formatTimeOfDay } from "@/utils/dateUtils";

const Dashboard = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [testEntries, setTestEntries] = useState<TestEntry[]>([]);
  const [recentStats, setRecentStats] = useState<StatsData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);

  useEffect(() => {
    // Load data from storage
    const loadedMoodEntries = getMoodEntries();
    const loadedTestEntries = getTestEntries();
    
    setMoodEntries(loadedMoodEntries);
    setTestEntries(loadedTestEntries);
    
    // Process data for charts
    processRecentStats(loadedMoodEntries);
    processWeeklyData(loadedMoodEntries, loadedTestEntries);
  }, []);

  const processRecentStats = (entries: MoodEntry[]) => {
    // Group by date and calculate averages
    const lastSevenDays = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    const dailyStats = lastSevenDays.map(dateStr => {
      const dayEntries = entries.filter(entry => 
        new Date(entry.date).toISOString().split('T')[0] === dateStr
      );
      
      const moodAvg = dayEntries.length 
        ? dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length 
        : 0;
        
      const energyAvg = dayEntries.length 
        ? dayEntries.reduce((sum, entry) => sum + entry.energy, 0) / dayEntries.length 
        : 0;
      
      return {
        date: formatDate(new Date(dateStr), "d MMM"),
        mood: Number(moodAvg.toFixed(1)),
        energy: Number(energyAvg.toFixed(1))
      };
    });
    
    setRecentStats(dailyStats);
  };

  const processWeeklyData = (moodEntries: MoodEntry[], testEntries: TestEntry[]) => {
    // Create weekly data for the last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const weeks = [...Array(4)].map((_, i) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay() + 1);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return {
        start: weekStart,
        end: weekEnd,
        label: `${formatDate(weekStart, "d MMM")} - ${formatDate(weekEnd, "d MMM")}`
      };
    }).reverse();
    
    const weeklyStats = weeks.map(week => {
      const weekMoodEntries = moodEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= week.start && entryDate <= week.end;
      });
      
      const weekTestEntries = testEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= week.start && entryDate <= week.end;
      });
      
      const moodAvg = weekMoodEntries.length 
        ? weekMoodEntries.reduce((sum, entry) => sum + entry.mood, 0) / weekMoodEntries.length 
        : 0;
        
      const energyAvg = weekMoodEntries.length 
        ? weekMoodEntries.reduce((sum, entry) => sum + entry.energy, 0) / weekMoodEntries.length 
        : 0;
      
      return {
        week: week.label,
        moodAvg: Number(moodAvg.toFixed(1)),
        energyAvg: Number(energyAvg.toFixed(1)),
        testsCompleted: weekTestEntries.length
      };
    });
    
    setWeeklyData(weeklyStats);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Обзор</h2>
        <p className="text-muted-foreground">
          Сводка вашего настроения, энергии и прогресса тестов
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Среднее настроение
            </CardTitle>
            <CardDescription>За последние 7 дней</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentStats.length ? 
                (recentStats.reduce((sum, day) => sum + day.mood, 0) / recentStats.filter(day => day.mood > 0).length || 0).toFixed(1) : 
                "Нет данных"}
            </div>
            <p className="text-xs text-muted-foreground">
              {recentStats.length && recentStats[recentStats.length - 1].mood ? 
                `+${(recentStats[recentStats.length - 1].mood - recentStats[0].mood).toFixed(1)} с прошлой недели` : 
                "Добавьте данные для отслеживания"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Средняя энергия
            </CardTitle>
            <CardDescription>За последние 7 дней</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentStats.length ? 
                (recentStats.reduce((sum, day) => sum + day.energy, 0) / recentStats.filter(day => day.energy > 0).length || 0).toFixed(1) : 
                "Нет данных"}
            </div>
            <p className="text-xs text-muted-foreground">
              {recentStats.length && recentStats[recentStats.length - 1].energy ? 
                `${(recentStats[recentStats.length - 1].energy - recentStats[0].energy).toFixed(1)} с прошлой недели` : 
                "Добавьте данные для отслеживания"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Выполнено тестов
            </CardTitle>
            <CardDescription>За текущую неделю</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyData.length ? weeklyData[weeklyData.length - 1].testsCompleted : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {weeklyData.length >= 2 ? 
                `${weeklyData[weeklyData.length - 1].testsCompleted - weeklyData[weeklyData.length - 2].testsCompleted} с прошлой недели` : 
                "Добавьте тесты для отслеживания"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Последние записи
            </CardTitle>
            <CardDescription>За сегодня</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {moodEntries.filter(entry => 
                new Date(entry.date).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {moodEntries.length > 0 ? 
                `Всего ${moodEntries.length} записей` : 
                "Нет записей"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Настроение и энергия</CardTitle>
            <CardDescription>
              Тренды за последние 7 дней
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={recentStats}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="mood"
                  stroke="#8B5CF6"
                  fillOpacity={1}
                  fill="url(#colorMood)"
                  name="Настроение"
                />
                <Area
                  type="monotone"
                  dataKey="energy"
                  stroke="#0EA5E9"
                  fillOpacity={1}
                  fill="url(#colorEnergy)"
                  name="Энергия"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Недельная статистика</CardTitle>
            <CardDescription>
              Выполненные тесты по неделям
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="testsCompleted" 
                  name="Выполнено тестов" 
                  fill="#0EA5E9" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="moodAvg" 
                  name="Среднее настроение" 
                  fill="#8B5CF6" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="energyAvg" 
                  name="Средняя энергия" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Последние записи настроения</CardTitle>
          </CardHeader>
          <CardContent>
            {moodEntries.length > 0 ? (
              <div className="space-y-4">
                {moodEntries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between space-x-4 border-b pb-4"
                    >
                      <div>
                        <p className="font-medium">
                          {formatDate(entry.date)} ({formatTimeOfDay(entry.timeOfDay)})
                        </p>
                        {entry.comment && (
                          <p className="text-sm text-muted-foreground">{entry.comment}</p>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Настроение</p>
                          <p className="font-medium">{entry.mood}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Энергия</p>
                          <p className="font-medium">{entry.energy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Нет записей о настроении. Добавьте новую запись на странице "Настроение".
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Последние выполненные тесты</CardTitle>
          </CardHeader>
          <CardContent>
            {testEntries.length > 0 ? (
              <div className="space-y-4">
                {testEntries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between space-x-4 border-b pb-4"
                    >
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(test.date)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={test.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          Ссылка
                        </a>
                        <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {test.isWeeklyTest ? "Недельный" : "Ежедневный"}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Нет записей о тестах. Добавьте новый тест на странице "Тесты".
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
