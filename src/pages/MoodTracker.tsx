import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Calendar, Plus, Trash2, User, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MoodEntry, User as UserType } from "@/types";
import { moodRepository } from "@/lib/dataRepository";
import { createMoodEntry, getMyMoodEntries, getAllPlayersMoodStats, getPlayerMoodEntries, getPlayerMoodChartData } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatTimeOfDay, getTimeOfDay, getCurrentWeekRange, getWeekLabel, getPrevWeek, getNextWeek } from "@/utils/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS, COMPONENT_STYLES } from "@/styles/theme";

interface PlayerMoodStats {
  userId: string;
  name: string;
  mood: number;
  energy: number;
  entries: number;
  lastActivity: Date;
}

interface ChartData {
  date: string;
  mood: number;
  energy: number;
}

const MoodTracker = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mood, setMood] = useState<number>(5);
  const [energy, setEnergy] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "evening">(getTimeOfDay());
  const [isAddingEntry, setIsAddingEntry] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Новые переменные состояния для статистики игроков (для персонала)
  const [playerStats, setPlayerStats] = useState<PlayerMoodStats[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [playerEntries, setPlayerEntries] = useState<MoodEntry[]>([]);
  const [isLoadingPlayerData, setIsLoadingPlayerData] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(user?.role === "staff" ? "players" : "my");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  // Добавляем стили, основанные на нашей теме
  const cardStyle = {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.borderColor,
    boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)",
    marginBottom: "0.75rem"
  };
  
  const titleStyle = { color: COLORS.textColor };
  const descriptionStyle = { color: COLORS.textColorSecondary };
  const containerStyle = { 
    backgroundColor: COLORS.backgroundColor, 
    color: COLORS.textColor,
    padding: "0.5rem"
  };
  
  // Стили для вкладок
  const tabsStyle = {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.borderColor
  };
  
  const tabsTriggerStyle = "text-sm px-4 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:font-medium hover:bg-gray-800";
  
  useEffect(() => {
    if (user?.role === "staff") {
      // Персонал видит только статистику игроков
      loadPlayerStats();
    } else {
      // Игроки видят свои записи
      loadEntries();
    }
    generateWeekDates(currentWeek);
  }, [currentWeek, user?.role]);
  
  // Подготовка данных для графиков при изменении записей игрока
  useEffect(() => {
    if (playerEntries.length > 0) {
      prepareChartData();
    }
  }, [playerEntries]);
  
  // Загрузка статистики по всем игрокам (для персонала)
  const loadPlayerStats = async () => {
    if (user?.role !== "staff") return;
    
    try {
      setIsLoadingPlayerData(true);
      const response = await getAllPlayersMoodStats();
      setPlayerStats(response.data);
      console.log("Загружена статистика настроения игроков", response.data);
    } catch (error) {
      console.error("Ошибка при загрузке статистики игроков:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить статистику игроков.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPlayerData(false);
    }
  };
  
  // Загрузка записей конкретного игрока (для персонала)
  const loadPlayerEntries = async (playerId: string) => {
    if (user?.role !== "staff") return;
    
    try {
      setIsLoadingPlayerData(true);
      
      // Сбрасываем предыдущие данные и ошибки
      setPlayerEntries([]);
      setChartData([]);
      
      // Проверка на валидность ID
      if (!playerId || playerId === 'undefined' || playerId === 'null') {
        console.error(`Попытка загрузить записи с невалидным ID игрока: ${playerId}`);
        toast({
          title: "Ошибка загрузки",
          description: "Некорректный идентификатор игрока.",
          variant: "destructive"
        });
        setIsLoadingPlayerData(false);
        return;
      }
      
      try {
        const response = await getPlayerMoodEntries(playerId);
        // Преобразуем даты из строк в объекты Date
        const playerEntries = response.data.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        }));
        setPlayerEntries(playerEntries);
        setSelectedPlayerId(playerId);
        
        // Загружаем данные для графика напрямую с сервера
        try {
          const chartResponse = await getPlayerMoodChartData(playerId);
          setChartData(chartResponse.data);
        } catch (chartError) {
          console.error(`Ошибка при загрузке данных для графика игрока ${playerId}:`, chartError);
          // Если не удалось загрузить данные для графика с сервера, создаем их локально из записей
          if (playerEntries.length > 0) {
            prepareChartData(playerEntries);
          } else {
            toast({
              title: "Ошибка загрузки графика",
              description: "Не удалось загрузить данные для графика.",
              variant: "destructive"
            });
          }
        }
        
        console.log(`Загружены записи настроения для игрока ${playerId}`, playerEntries);
      } catch (error: any) {
        console.error(`Ошибка при загрузке записей игрока ${playerId}:`, error);
        
        let errorMessage = "Не удалось загрузить записи игрока.";
        if (error.response) {
          if (error.response.status === 400) {
            errorMessage = "Некорректный идентификатор игрока.";
          } else if (error.response.status === 404) {
            errorMessage = "Игрок не найден.";
          } else if (error.response.status === 500) {
            errorMessage = "Ошибка сервера при загрузке данных.";
          }
        }
        
        toast({
          title: "Ошибка загрузки",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Общая ошибка загрузки данных:`, error);
      toast({
        title: "Ошибка загрузки",
        description: "Произошла неизвестная ошибка при попытке загрузить данные.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPlayerData(false);
    }
  };
  
  // Подготовка данных для графиков - теперь используется как запасной вариант и принимает записи как параметр
  const prepareChartData = (entries = playerEntries) => {
    if (entries.length === 0) return;
    
    // Сортируем записи по дате (от старых к новым)
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Создаем Map для группировки записей по дате
    const entriesByDate = new Map<string, { moodSum: number, energySum: number, count: number }>();
    
    // Группируем записи по дате и считаем средние значения
    sortedEntries.forEach(entry => {
      const dateStr = formatDate(new Date(entry.date));
      
      if (!entriesByDate.has(dateStr)) {
        entriesByDate.set(dateStr, { moodSum: 0, energySum: 0, count: 0 });
      }
      
      const dateData = entriesByDate.get(dateStr)!;
      dateData.moodSum += entry.mood;
      dateData.energySum += entry.energy;
      dateData.count += 1;
    });
    
    // Преобразуем Map в массив объектов для графика
    const data: ChartData[] = Array.from(entriesByDate.entries()).map(([date, values]) => ({
      date,
      mood: parseFloat((values.moodSum / values.count).toFixed(1)),
      energy: parseFloat((values.energySum / values.count).toFixed(1))
    }));
    
    setChartData(data);
  };
  
  const loadEntries = async () => {
    try {
      setIsLoading(true);
      
      if (user) {
        // Загружаем данные с сервера
        try {
          const response = await getMyMoodEntries();
          // Преобразуем даты из строк в объекты Date
          const serverEntries = response.data.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date)
          }));
          
          // Важно: устанавливаем состояние entries напрямую из серверных данных,
          // а не добавляем их к существующим
          setEntries(serverEntries);
          
          // Обновляем локальное хранилище с данными с сервера
          moodRepository.updateFromServer(serverEntries);
          
          console.log('Mood entries loaded from server');
        } catch (error) {
          console.error('Error loading mood entries from server:', error);
          
          // Если не удалось загрузить с сервера, используем локальные данные
          const localEntries = moodRepository.getAll();
          setEntries(localEntries);
          
          toast({
            title: "Ошибка загрузки",
            description: "Не удалось загрузить записи с сервера, используются локальные данные.",
            variant: "destructive"
          });
        }
      } else {
        // Если пользователь не авторизован, используем локальные данные
        const localEntries = moodRepository.getAll();
        setEntries(localEntries);
      }
    } catch (error) {
      console.error('Error loading mood entries:', error);
      
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить записи о настроении.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateWeekDates = (date: Date) => {
    const { start } = getCurrentWeekRange(date);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    setWeekDates(days);
  };
  
  const handlePrevWeek = () => {
    setCurrentWeek(getPrevWeek(currentWeek));
  };
  
  const handleNextWeek = () => {
    setCurrentWeek(getNextWeek(currentWeek));
  };
  
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };
  
  const resetForm = () => {
    setMood(5);
    setEnergy(5);
    setComment("");
    setTimeOfDay(getTimeOfDay());
  };
  
  const handleSubmit = async () => {
    // Персонал не должен иметь возможность создавать записи
    if (user?.role === "staff") {
      toast({
        title: "Доступ запрещен",
        description: "Персонал не может создавать записи о настроении.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
    const newEntry: Omit<MoodEntry, "id"> = {
      date: selectedDate,
      timeOfDay,
      mood,
      energy,
      comment: comment.trim() || undefined,
    };
    
      // Используем репозиторий для сохранения данных
      const savedEntry = moodRepository.create(newEntry);
      
      // Если пользователь авторизован, пытаемся сразу сохранить на сервере
      if (user) {
        try {
          const response = await createMoodEntry(newEntry);
          console.log('Mood entry saved to server:', response.data);
        } catch (error) {
          console.error('Error saving mood entry to server (will be synced later):', error);
        }
      }
      
      // Обновляем список записей
      await loadEntries();
    resetForm();
    setIsAddingEntry(false);
    
    toast({
      title: "Запись добавлена",
      description: "Запись о настроении успешно сохранена.",
    });
    } catch (error) {
      console.error('Error saving mood entry:', error);
      
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить запись о настроении.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    // Персонал не должен иметь возможность удалять записи
    if (user?.role === "staff") {
      toast({
        title: "Доступ запрещен",
        description: "Персонал не может удалять записи о настроении.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Проверка на валидность ID
      if (!id || id === 'undefined' || id === 'null') {
        console.error(`Попытка удалить запись настроения с невалидным ID: ${id}`);
        toast({
          title: "Ошибка удаления",
          description: "Невозможно удалить запись, некорректный идентификатор.",
          variant: "destructive"
        });
        return;
      }
      
      setIsLoading(true);
      console.log(`Удаление записи настроения с ID: ${id}`);
      
      // Удаляем запись через репозиторий
      moodRepository.delete(id);
      
      // Обновляем список записей
      await loadEntries();
    
      toast({
        title: "Запись удалена",
        description: "Запись о настроении успешно удалена."
      });
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить запись о настроении.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getDayEntries = (date: Date) => {
    // Возвращаем записи в зависимости от выбранного режима просмотра
    const currentEntries = user?.role === "staff" ? playerEntries : entries;
    
    return currentEntries.filter(
      (entry) => new Date(entry.date).toDateString() === date.toDateString()
    );
  };

  // Получение записей для конкретного времени дня (с учетом выбранного режима просмотра)
  const getTimeOfDayEntries = (date: Date, time: "morning" | "afternoon" | "evening") => {
    const dayEntries = getDayEntries(date);
    return dayEntries.filter(entry => entry.timeOfDay === time);
  };

  // Обновляем метод renderTitle, добавляя стили
  const renderTitle = () => {
    if (user?.role === "staff") {
      return (
        <div style={containerStyle}>
          <h2 className="text-3xl font-bold tracking-tight" style={titleStyle}>
            Настроение и энергия игроков
          </h2>
          <p style={descriptionStyle}>Отслеживание эмоционального состояния игроков команды</p>
        </div>
      );
    } else {
      return (
        <div style={containerStyle}>
          <h2 className="text-3xl font-bold tracking-tight" style={titleStyle}>
            Настроение и энергия
          </h2>
          <p style={descriptionStyle}>Отслеживание вашего эмоционального состояния и энергии</p>
        </div>
      );
    }
  };

  // Компонент для отображения графиков
  const PlayerMoodCharts = () => {
    if (!selectedPlayerId || chartData.length === 0) return null;
    
    const playerName = playerStats.find(p => p.userId === selectedPlayerId)?.name || "Игрок";
    
    return (
      <Card className="mt-6 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Динамика настроения и энергии: {playerName}
          </CardTitle>
          <CardDescription>
            Средние показатели по дням
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip
                  formatter={(value: number) => [`${value}/10`, '']}
                  labelFormatter={(label) => `Дата: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  name="Настроение" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="energy" 
                  name="Энергия" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="pt-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-indigo-700">Настроение</h4>
                  <p className="text-sm text-indigo-600 mt-1">
                    Среднее: {chartData.reduce((sum, item) => sum + item.mood, 0) / chartData.length}{"/10"}
                  </p>
                  <p className="text-sm text-indigo-600">
                    Диапазон: {Math.min(...chartData.map(item => item.mood))}-{Math.max(...chartData.map(item => item.mood))}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="pt-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-emerald-700">Энергия</h4>
                  <p className="text-sm text-emerald-600 mt-1">
                    Среднее: {chartData.reduce((sum, item) => sum + item.energy, 0) / chartData.length}{"/10"}
                  </p>
                  <p className="text-sm text-emerald-600">
                    Диапазон: {Math.min(...chartData.map(item => item.energy))}-{Math.max(...chartData.map(item => item.energy))}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4" style={containerStyle}>
      {renderTitle()}
      
      {user?.role === "staff" ? (
        // Для персонала отображаем статистику игроков
        <div className="space-y-4">
          {isLoadingPlayerData ? (
            <Card style={cardStyle}>
              <CardContent className="pt-6">
                <div className="flex justify-center py-8">
                  <p style={descriptionStyle}>Загрузка данных...</p>
                </div>
              </CardContent>
            </Card>
          ) : playerStats.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {playerStats.map(player => (
                <Card key={player.userId} style={cardStyle}>
                  <CardHeader className="pb-2">
                    <CardTitle style={titleStyle}>{player.name}</CardTitle>
                    <CardDescription style={descriptionStyle}>
                      Средние показатели: Настроение {player.mood.toFixed(1)}, Энергия {player.energy.toFixed(1)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm mb-1" style={descriptionStyle}>Настроение</p>
                        <p className="text-2xl font-semibold" style={titleStyle}>{player.mood.toFixed(1)}/10</p>
                      </div>
                      <div>
                        <p className="text-sm mb-1" style={descriptionStyle}>Энергия</p>
                        <p className="text-2xl font-semibold" style={titleStyle}>{player.energy.toFixed(1)}/10</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm mb-1" style={descriptionStyle}>Записей</p>
                      <p className="text-xl font-semibold" style={titleStyle}>{player.entries}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      style={{ backgroundColor: COLORS.primary, color: COLORS.textColor }}
                      onClick={() => loadPlayerEntries(player.userId)}
                      className="w-full"
                    >
                      Смотреть записи
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card style={cardStyle}>
              <CardContent className="pt-6">
                <div className="flex justify-center py-8">
                  <p style={descriptionStyle}>Нет данных о настроении игроков</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Детальные записи выбранного игрока */}
          {selectedPlayerId && (
            <div className="space-y-4 mt-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold" style={titleStyle}>
                  Записи игрока
                </h3>
                <Button 
                  variant="outline" 
                  style={{ borderColor: COLORS.borderColor, color: COLORS.primary }}
                  onClick={() => {
                    setSelectedPlayerId(null);
                    setPlayerEntries([]);
                    setChartData([]);
                  }}
                >
                  Назад к списку
                </Button>
              </div>
              
              {isLoadingPlayerData ? (
                <div className="py-8 text-center" style={descriptionStyle}>
                  Загрузка данных...
                </div>
              ) : playerEntries.length > 0 ? (
                <>
                  {/* График настроения и энергии */}
                  <Card style={cardStyle}>
                    <CardHeader>
                      <CardTitle style={titleStyle}>Динамика показателей</CardTitle>
                      <CardDescription style={descriptionStyle}>
                        Изменение настроения и энергии со временем
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderColor} />
                            <XAxis dataKey="date" stroke={COLORS.textColorSecondary} />
                            <YAxis domain={[0, 10]} stroke={COLORS.textColorSecondary} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: COLORS.cardBackground, 
                                borderColor: COLORS.borderColor,
                                color: COLORS.textColor 
                              }} 
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="mood" 
                              name="Настроение" 
                              stroke={COLORS.primary} 
                              activeDot={{ r: 8 }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="energy" 
                              name="Энергия" 
                              stroke={COLORS.success} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Другие компоненты также обновляем с использованием стилей cardStyle, titleStyle и т.д. */}
                </>
              ) : (
                <Card style={cardStyle}>
                  <CardContent className="pt-6">
                    <div className="flex justify-center py-8">
                      <p style={descriptionStyle}>У этого игрока нет записей о настроении</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      ) : (
        // Для игроков отображаем их личные записи
        <div className="space-y-4">
          {/* Календарь с записями - тоже применяем стили */}
          <Card style={cardStyle}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle style={titleStyle}>Календарь записей</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevWeek}
                    style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span style={titleStyle}>{getWeekLabel(currentWeek)}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextWeek}
                    style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4">
                {weekDates.map((date) => {
                  const dayEntries = getDayEntries(date);
                  return (
                    <div
                      key={date.toISOString()}
                      className={`text-center p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedDate.toDateString() === date.toDateString()
                          ? "bg-esports-teal/10 border border-esports-teal"
                          : "bg-white border hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelectDate(date)}
                    >
                      <p className="text-sm font-medium">
                        {formatDate(date, "EEE")}
                      </p>
                      <p className="text-xl font-semibold">
                        {formatDate(date, "d")}
                      </p>
                      <div className="mt-2 flex justify-center">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            dayEntries.length > 0 ? "bg-esports-teal" : "bg-gray-200"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Диалоговое окно для добавления записи - применяем стили диалога */}
      <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
        <DialogContent style={{ backgroundColor: COLORS.cardBackground, color: COLORS.textColor, borderColor: COLORS.borderColor }}>
          <DialogHeader>
            <DialogTitle style={titleStyle}>Добавить запись</DialogTitle>
            <DialogDescription style={descriptionStyle}>
              Оцените ваше настроение и энергию на момент {timeOfDay === "morning" ? "утра" : timeOfDay === "afternoon" ? "дня" : "вечера"} {formatDate(selectedDate, "d MMMM")}
            </DialogDescription>
          </DialogHeader>
          
          {/* Содержимое формы - также применяем стили */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MoodTracker;
