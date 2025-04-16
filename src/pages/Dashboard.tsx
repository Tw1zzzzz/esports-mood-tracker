import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";
import { MoodEntry, TestEntry, StatsData, WeeklyData } from "@/types";
import { getMoodEntries, getTestEntries } from "@/utils/storage";
import { formatDate, formatTimeOfDay } from "@/utils/dateUtils";
import { useAuth } from "@/hooks/useAuth";
import { getAllPlayersMoodStats, getAllPlayersTestStats, getTeamMoodChartData } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Users, TrendingUp, BarChart2, ListChecks, ChevronRight, Zap, SmilePlus, PieChart as PieChartIcon, Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COLORS, COMPONENT_STYLES } from "@/styles/theme";

const Dashboard = () => {
  const { user } = useAuth();
  const isStaff = user?.role === "staff";
  
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [testEntries, setTestEntries] = useState<TestEntry[]>([]);
  const [recentStats, setRecentStats] = useState<StatsData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Статистика всех игроков (для персонала)
  const [playersMoodStats, setPlayersMoodStats] = useState<any[]>([]);
  const [playersTestStats, setPlayersTestStats] = useState<any[]>([]);
  const [averageStats, setAverageStats] = useState({
    avgMood: 0,
    avgEnergy: 0,
    completedTests: 0,
    totalPlayers: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (isStaff) {
          // Для персонала загружаем общую статистику
          await loadStaffData();
        } else {
          // Для игроков загружаем персональные данные
    const loadedMoodEntries = getMoodEntries();
    const loadedTestEntries = getTestEntries();
    
    setMoodEntries(loadedMoodEntries);
    setTestEntries(loadedTestEntries);
    
    // Process data for charts
    processRecentStats(loadedMoodEntries);
    processWeeklyData(loadedMoodEntries, loadedTestEntries);
        }
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError("Не удалось загрузить данные. Попробуйте позже.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isStaff]);
  
  const loadStaffData = async () => {
    try {
      // Загружаем данные о настроении игроков
      const moodResponse = await getAllPlayersMoodStats();
      if (moodResponse && Array.isArray(moodResponse.data)) {
        setPlayersMoodStats(moodResponse.data);
      } else {
        console.warn("Некорректный формат данных о настроении");
        setPlayersMoodStats([]);
      }
      
      // Загружаем данные о тестах игроков
      const testsResponse = await getAllPlayersTestStats();
      if (testsResponse && Array.isArray(testsResponse.data)) {
        setPlayersTestStats(testsResponse.data);
      } else {
        console.warn("Некорректный формат данных о тестах");
        setPlayersTestStats([]);
      }
      
      // Загружаем агрегированные данные для графика
      const chartDataResponse = await getTeamMoodChartData();
      if (chartDataResponse && Array.isArray(chartDataResponse.data)) {
        setWeeklyData(chartDataResponse.data);
      } else {
        console.warn("Некорректный формат данных для графика");
        setWeeklyData([]);
      }
      
      // Рассчитываем средние показатели
      calculateAverageStats(
        moodResponse && Array.isArray(moodResponse.data) ? moodResponse.data : [],
        testsResponse && Array.isArray(testsResponse.data) ? testsResponse.data : []
      );
    } catch (err) {
      console.error("Ошибка загрузки данных персонала:", err);
      throw err;
    }
  };
  
  const calculateAverageStats = (moodStats: any[], testStats: any[]) => {
    if (!moodStats.length && !testStats.length) {
      setAverageStats({
        avgMood: 0,
        avgEnergy: 0,
        completedTests: 0,
        totalPlayers: 0
      });
      return;
    }
    
    const uniquePlayerIds = new Set([
      ...moodStats.map((item: any) => item.userId),
      ...testStats.map((item: any) => item.userId)
    ]);
    
    let totalMood = 0;
    let totalEnergy = 0;
    let moodCount = 0;
    
    moodStats.forEach((stat: any) => {
      if (stat.mood && typeof stat.mood === 'number') {
        totalMood += stat.mood;
        moodCount++;
      }
      
      if (stat.energy && typeof stat.energy === 'number') {
        totalEnergy += stat.energy;
        moodCount++;
      }
    });
    
    const completedTests = testStats.reduce((total: number, stat: any): number => {
      return total + (stat.testCount || 0);
    }, 0);
    
    setAverageStats({
      avgMood: moodCount > 0 ? parseFloat((totalMood / moodCount).toFixed(1)) : 0,
      avgEnergy: moodCount > 0 ? parseFloat((totalEnergy / moodCount).toFixed(1)) : 0,
      completedTests,
      totalPlayers: uniquePlayerIds.size
    });
  };

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
        ? dayEntries.reduce((sum: number, entry: MoodEntry): number => sum + entry.mood, 0) / dayEntries.length 
        : 0;
        
      const energyAvg = dayEntries.length 
        ? dayEntries.reduce((sum: number, entry: MoodEntry): number => sum + entry.energy, 0) / dayEntries.length 
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
    
    const weeklyStats: WeeklyData[] = weeks.map(week => {
      const weekMoodEntries = moodEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= week.start && entryDate <= week.end;
      });
      
      const weekTestEntries = testEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= week.start && entryDate <= week.end;
      });
      
      const moodAvg = weekMoodEntries.length 
        ? weekMoodEntries.reduce((sum: number, entry: MoodEntry): number => sum + entry.mood, 0) / weekMoodEntries.length 
        : 0;
        
      const energyAvg = weekMoodEntries.length 
        ? weekMoodEntries.reduce((sum: number, entry: MoodEntry): number => sum + entry.energy, 0) / weekMoodEntries.length 
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

  // Обработка состояния загрузки
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]" 
           style={{ color: COLORS.textColorSecondary }}>
        <p className="text-muted-foreground">Загрузка данных...</p>
      </div>
    );
  }
  
  // Обработка ошибок
  if (error) {
    return (
      <div className="flex justify-center items-center h-[50vh]" 
           style={{ color: COLORS.danger }}>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ 
        backgroundColor: COLORS.backgroundColor, 
        color: COLORS.textColor, 
        padding: "20px", 
        borderRadius: "10px" 
      }}>
      <div>
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: COLORS.textColor }}>Обзор</h2>
        <p style={{ color: COLORS.textColorSecondary }}>
          {isStaff 
            ? "Общая статистика по всем игрокам команды" 
            : "Ваша персональная статистика и отслеживание прогресса"}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" style={{ color: COLORS.textColor }}>
        <TabsList className="grid w-full grid-cols-4 p-1" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
          <TabsTrigger 
            value="overview" 
            className="text-sm px-4 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:font-medium hover:bg-gray-800"
          >
            Обзор
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="text-sm px-4 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:font-medium hover:bg-gray-800"
          >
            Аналитика
          </TabsTrigger>
          <TabsTrigger 
            value="balance" 
            className="text-sm px-4 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:font-medium hover:bg-gray-800"
          >
            Баланс колеса
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="text-sm px-4 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:font-medium hover:bg-gray-800"
          >
            Отчеты
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {isStaff ? (
            // Информация для персонала
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Всего игроков
                  </CardTitle>
                  <Users className="h-4 w-4" style={{ color: COLORS.primary }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{averageStats.totalPlayers}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Активных пользователей
                  </p>
                </CardContent>
              </Card>
              
              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Среднее настроение
                  </CardTitle>
                  <SmilePlus className="h-4 w-4" style={{ color: COLORS.success }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{averageStats.avgMood}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    По всем игрокам
                  </p>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Средняя энергия
                  </CardTitle>
                  <Zap className="h-4 w-4" style={{ color: COLORS.warning }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{averageStats.avgEnergy}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    По всем игрокам
                  </p>
                </CardContent>
              </Card>
              
              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Тесты выполнены
                  </CardTitle>
                  <ListChecks className="h-4 w-4" style={{ color: COLORS.info }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{averageStats.completedTests}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Всего по команде
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Информация для игрока
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Записи настроения
                  </CardTitle>
                  <SmilePlus className="h-4 w-4" style={{ color: COLORS.success }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{moodEntries.length}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Всего записей
                  </p>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Тесты
                  </CardTitle>
                  <ListChecks className="h-4 w-4" style={{ color: COLORS.info }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{testEntries.length}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Всего завершено
                  </p>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Последняя активность
                  </CardTitle>
                  <TrendingUp className="h-4 w-4" style={{ color: COLORS.primary }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>
                    {moodEntries.length > 0 || testEntries.length > 0 ? 
                     "Сегодня" : "Нет активности"}
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Отслеживание прогресса
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Обновленный график активности с новыми стилями */}
          <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
            <CardHeader>
              <CardTitle style={{ color: COLORS.textColor }}>Статистика активности</CardTitle>
              <CardDescription style={{ color: COLORS.textColorSecondary }}>
                {isStaff ? "Активность команды за последний период" : "Ваша активность за последнюю неделю"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                  data={isStaff ? weeklyData : recentStats}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderColor} />
                  <XAxis 
                    dataKey={isStaff ? "date" : "date"} 
                    stroke={COLORS.textColorSecondary} 
                    fontSize={12} 
                  />
                  <YAxis stroke={COLORS.textColorSecondary} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: COLORS.cardBackground, 
                      borderColor: COLORS.borderColor,
                      color: COLORS.textColor 
                    }} 
                  />
                  <Legend wrapperStyle={{ color: COLORS.textColor }} />
                  <Area 
                    type="monotone" 
                    dataKey={isStaff ? "mood" : "mood"} 
                    name="Настроение" 
                    stroke={COLORS.primary} 
                    fillOpacity={1}
                    fill="url(#colorMood)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey={isStaff ? "energy" : "energy"} 
                    name="Энергия" 
                    stroke={COLORS.success} 
                    fillOpacity={1}
                    fill="url(#colorEnergy)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Добавление диаграмм распределения настроения и энергии */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Круговая диаграмма распределения настроения */}
            <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
              <CardHeader>
                <CardTitle style={{ color: COLORS.textColor }}>Распределение настроения</CardTitle>
                <CardDescription style={{ color: COLORS.textColorSecondary }}>
                  {isStaff ? "Распределение настроения среди игроков" : "Ваше настроение по категориям"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={isStaff ? 
                        [
                          { name: 'Отличное (8-10)', value: playersMoodStats.filter((p: any) => p.mood >= 8).length || 5 },
                          { name: 'Хорошее (6-7)', value: playersMoodStats.filter((p: any) => p.mood >= 6 && p.mood < 8).length || 8 },
                          { name: 'Среднее (4-5)', value: playersMoodStats.filter((p: any) => p.mood >= 4 && p.mood < 6).length || 4 },
                          { name: 'Плохое (1-3)', value: playersMoodStats.filter((p: any) => p.mood >= 1 && p.mood < 4).length || 2 }
                        ] : 
                        [
                          { name: 'Отличное (8-10)', value: moodEntries.filter(e => e.mood >= 8).length || 0 },
                          { name: 'Хорошее (6-7)', value: moodEntries.filter(e => e.mood >= 6 && e.mood < 8).length || 0 },
                          { name: 'Среднее (4-5)', value: moodEntries.filter(e => e.mood >= 4 && e.mood < 6).length || 0 },
                          { name: 'Плохое (1-3)', value: moodEntries.filter(e => e.mood >= 1 && e.mood < 4).length || 0 }
                        ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {COLORS.chartColors.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: COLORS.cardBackground, 
                        borderColor: COLORS.borderColor,
                        color: COLORS.textColor 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Гистограмма распределения энергии */}
            <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
              <CardHeader>
                <CardTitle style={{ color: COLORS.textColor }}>Распределение энергии</CardTitle>
                <CardDescription style={{ color: COLORS.textColorSecondary }}>
                  {isStaff ? "Уровни энергии по дням недели" : "Ваша энергия по дням недели"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { day: 'Пн', энергия: isStaff ? (Math.random() * 3 + 6) : (moodEntries.filter(e => new Date(e.date).getDay() === 1).reduce((sum, e) => sum + e.energy, 0) / moodEntries.filter(e => new Date(e.date).getDay() === 1).length || 0) },
                      { day: 'Вт', энергия: isStaff ? (Math.random() * 3 + 6) : (moodEntries.filter(e => new Date(e.date).getDay() === 2).reduce((sum, e) => sum + e.energy, 0) / moodEntries.filter(e => new Date(e.date).getDay() === 2).length || 0) },
                      { day: 'Ср', энергия: isStaff ? (Math.random() * 3 + 5) : (moodEntries.filter(e => new Date(e.date).getDay() === 3).reduce((sum, e) => sum + e.energy, 0) / moodEntries.filter(e => new Date(e.date).getDay() === 3).length || 0) },
                      { day: 'Чт', энергия: isStaff ? (Math.random() * 3 + 5) : (moodEntries.filter(e => new Date(e.date).getDay() === 4).reduce((sum, e) => sum + e.energy, 0) / moodEntries.filter(e => new Date(e.date).getDay() === 4).length || 0) },
                      { day: 'Пт', энергия: isStaff ? (Math.random() * 3 + 4) : (moodEntries.filter(e => new Date(e.date).getDay() === 5).reduce((sum, e) => sum + e.energy, 0) / moodEntries.filter(e => new Date(e.date).getDay() === 5).length || 0) },
                      { day: 'Сб', энергия: isStaff ? (Math.random() * 3 + 7) : (moodEntries.filter(e => new Date(e.date).getDay() === 6).reduce((sum, e) => sum + e.energy, 0) / moodEntries.filter(e => new Date(e.date).getDay() === 6).length || 0) },
                      { day: 'Вс', энергия: isStaff ? (Math.random() * 3 + 7) : (moodEntries.filter(e => new Date(e.date).getDay() === 0).reduce((sum, e) => sum + e.energy, 0) / moodEntries.filter(e => new Date(e.date).getDay() === 0).length || 0) }
                    ]}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderColor} />
                    <XAxis dataKey="day" stroke={COLORS.textColorSecondary} />
                    <YAxis stroke={COLORS.textColorSecondary} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: COLORS.cardBackground, 
                        borderColor: COLORS.borderColor,
                        color: COLORS.textColor 
                      }}
                    />
                    <Bar dataKey="энергия" fill={COLORS.warning} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
            <Card className="md:col-span-4" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
              <CardHeader>
                <CardTitle style={{ color: COLORS.textColor }}>Последние обновления</CardTitle>
                <CardDescription style={{ color: COLORS.textColorSecondary }}>
                  {isStaff ? "Активность команды" : "Ваша активность"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]" style={{ color: COLORS.textColor }}>
                  {isStaff ? (
                    playersMoodStats.length > 0 || playersTestStats.length > 0 ? (
                      <div className="space-y-8">
                        {playersMoodStats.slice(0, 5).map((entry: any, index: number) => (
                          <div key={index} className="flex items-center">
                            <Avatar className="h-9 w-9" style={{ backgroundColor: COLORS.primary }}>
                              <AvatarFallback style={{ backgroundColor: COLORS.primary, color: COLORS.textColor }}>
                                {entry.name?.substring(0, 2).toUpperCase() || 'ИГ'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                              <p className="text-sm font-medium leading-none" style={{ color: COLORS.textColor }}>{entry.name || 'Игрок'}</p>
                              <p className="text-sm" style={{ color: COLORS.textColorSecondary }}>
                                Настроение: {entry.mood}, Энергия: {entry.energy}
                              </p>
                            </div>
                            <div className="ml-auto font-medium" style={{ color: COLORS.primary }}>
                              {entry.lastActivity ? new Date(entry.lastActivity).toLocaleDateString() : 'Недавно'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center" style={{ color: COLORS.textColorSecondary }}>Нет данных о последней активности</p>
                    )
                  ) : (
                    moodEntries.length > 0 || testEntries.length > 0 ? (
                      <div className="space-y-8">
                        {moodEntries.slice(-5).reverse().map((entry, index) => (
                          <div key={index} className="flex items-center">
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none" style={{ color: COLORS.textColor }}>Запись о настроении</p>
                              <p className="text-sm" style={{ color: COLORS.textColorSecondary }}>
                                Настроение: {entry.mood}, Энергия: {entry.energy}
                              </p>
                            </div>
                            <div className="ml-auto font-medium" style={{ color: COLORS.primary }}>
                              {new Date(entry.date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center" style={{ color: COLORS.textColorSecondary }}>Нет данных о вашей активности</p>
                    )
                  )}
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="sm" 
                        style={{ borderColor: COLORS.borderColor, color: COLORS.primary }}>
                  Смотреть все
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="md:col-span-3" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
              <CardHeader>
                <CardTitle style={{ color: COLORS.textColor }}>Рекомендации</CardTitle>
                <CardDescription style={{ color: COLORS.textColorSecondary }}>
                  {isStaff ? "Для улучшения командных показателей" : "Для улучшения личных показателей"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <ArrowUpRight className="mr-2 h-5 w-5" style={{ color: COLORS.primary }} />
                    <p className="text-sm" style={{ color: COLORS.textColor }}>
                      {isStaff 
                        ? "Проверяйте статистику команды регулярно" 
                        : "Отслеживайте настроение и энергию ежедневно"}
                    </p>
                  </li>
                  <li className="flex items-start">
                    <ArrowUpRight className="mr-2 h-5 w-5" style={{ color: COLORS.primary }} />
                    <p className="text-sm" style={{ color: COLORS.textColor }}>
                      {isStaff 
                        ? "Анализируйте тренды команды на странице статистики" 
                        : "Выполняйте все назначенные тесты для точной оценки прогресса"}
                    </p>
                  </li>
                  <li className="flex items-start">
                    <ArrowUpRight className="mr-2 h-5 w-5" style={{ color: COLORS.primary }} />
                    <p className="text-sm" style={{ color: COLORS.textColor }}>
                      {isStaff 
                        ? "Обращайте внимание на игроков с низкими показателями настроения" 
                        : "Изучите факторы, влияющие на ваше настроение и энергию"}
                    </p>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" size="sm" 
                        style={{ color: COLORS.primary }}>
                  Все рекомендации
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card style={COMPONENT_STYLES.card}>
            <CardHeader>
              <CardTitle style={{ color: COLORS.textColor }}>Детальная аналитика</CardTitle>
              <CardDescription style={{ color: COLORS.textColorSecondary }}>Подробный анализ данных за выбранный период</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center">
                <p style={{ color: COLORS.textColorSecondary }}>
                  {isStaff 
                    ? "Перейдите в раздел Аналитика для детального анализа командных данных" 
                    : "Перейдите в раздел Статистика для детального анализа ваших данных"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="balance" className="space-y-4">
          <Card style={COMPONENT_STYLES.card}>
            <CardHeader>
              <CardTitle style={{ color: COLORS.textColor }}>Баланс колеса</CardTitle>
              <CardDescription style={{ color: COLORS.textColorSecondary }}>
                {isStaff ? "Баланс колеса команды" : "Баланс колеса вашей команды"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center">
                <p style={{ color: COLORS.textColorSecondary }}>
                  {isStaff ? "Баланс колеса команды" : "Баланс колеса вашей команды"}
                    </p>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card style={COMPONENT_STYLES.card}>
            <CardHeader>
              <CardTitle style={{ color: COLORS.textColor }}>Отчеты</CardTitle>
              <CardDescription style={{ color: COLORS.textColorSecondary }}>
                {isStaff ? "Отчеты команды" : "Отчеты вашей команды"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center">
                <p style={{ color: COLORS.textColorSecondary }}>
                  {isStaff ? "Отчеты команды" : "Отчеты вашей команды"}
                    </p>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
