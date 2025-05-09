import { useState, useEffect, useRef } from "react";
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
import { 
  createMoodEntry, 
  getMyMoodEntries, 
  getAllPlayersMoodStats, 
  getAllPlayersMoodStatsByDate,
  getPlayerMoodEntries, 
  getPlayerMoodChartData,
  getPlayerMoodByDate,
  getPlayerMoodChartDataByDate,
  getPlayerActivityData,
  deleteMoodEntry
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatTimeOfDay, getTimeOfDay, getCurrentWeekRange, getWeekLabel, getPrevWeek, getNextWeek } from "@/utils/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as TooltipRecharts, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { COLORS, COMPONENT_STYLES } from "@/styles/theme";
import { TooltipProps } from 'recharts';
import { Smile } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import axios from "axios";

// Расширяем интерфейс MoodEntry
interface MoodEntryWithTimeOfDay extends MoodEntry {
  id: string;
  date: string;
  mood: number;
  energy: number;
  timeOfDay: "morning" | "afternoon" | "evening";
  comment?: string;
}

// Добавление интерфейса MoodEntryData
interface MoodEntryData {
  date: string;
  timeOfDay: "morning" | "afternoon" | "evening";
  mood: number;
  energy: number;
  comment?: string;
}

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

// После импортов и перед первым компонентом добавим интерфейс для данных точки графика с временем
interface ChartDataPoint {
  date: string;
  mood: number;
  energy: number;
  time?: string;
  timeOfDay?: string;
}

// Интерфейс для пропсов кастомного тултипа
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const MoodTracker = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [entries, setEntries] = useState<MoodEntryWithTimeOfDay[]>([]);
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
  const [playerEntries, setPlayerEntries] = useState<MoodEntryWithTimeOfDay[]>([]);
  const [isLoadingPlayerData, setIsLoadingPlayerData] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(user?.role === "staff" ? "players" : "my");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  // Добавляем состояние для выбора даты на графиках
  const [selectedChartDate, setSelectedChartDate] = useState<Date>(new Date());
  
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
  
  // Добавляем ref для секции с записями игрока
  const playerEntriesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (user?.role === "staff") {
      // Персонал видит только статистику игроков
      loadPlayerStats();
      
      // Восстанавливаем выбранного игрока из sessionStorage
      try {
        const savedPlayerId = sessionStorage.getItem('selectedPlayerId');
        if (savedPlayerId) {
          setSelectedPlayerId(savedPlayerId);
          loadPlayerEntriesForDate(savedPlayerId, selectedChartDate);
        }
      } catch (e) {
        // Игнорируем ошибки sessionStorage
      }
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
      
      // Используем форматированную дату для API
      const formattedDate = selectedChartDate.toISOString().split('T')[0];
      
      // Используем обновленное API с фильтрацией по дате
      const response = await getAllPlayersMoodStatsByDate(formattedDate);
      
      setPlayerStats(response.data);
      console.log(`Загружена статистика настроения игроков на дату ${formattedDate}`, response.data);
    } catch (error) {
      console.error("Ошибка при загрузке статистики игроков:", error);
      
      // Если не удалось загрузить с фильтрацией по дате, пробуем без фильтрации
      try {
        const fallbackResponse = await getAllPlayersMoodStats();
        setPlayerStats(fallbackResponse.data);
        console.log("Загружена статистика настроения игроков (без фильтрации по дате)", fallbackResponse.data);
      } catch (fallbackError) {
        console.error("Ошибка при загрузке статистики игроков (резервный метод):", fallbackError);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить статистику игроков.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoadingPlayerData(false);
    }
  };
  
  // Метод для изменения выбранной даты графика
  const handleChartDateChange = (date: Date) => {
    setSelectedChartDate(date);
    
    // Перезагружаем статистику игроков с новой датой
    loadPlayerStats();
    
    // Если выбран игрок - перезагружаем его данные с новой датой
    if (selectedPlayerId) {
      loadPlayerEntriesForDate(selectedPlayerId, date);
    }
  };
  
  // Загрузка записей игрока для конкретной даты
  const loadPlayerEntriesForDate = async (playerId: string, date: Date) => {
    if (user?.role !== "staff") return;
    
    try {
      setIsLoadingPlayerData(true);
      
      // Сбрасываем предыдущие данные и ошибки
      setPlayerEntries([]);
      setChartData([]);
      
      // Проверка на валидность ID
      if (!playerId || playerId === 'undefined' || playerId === 'null') {
        toast({
          title: "Ошибка загрузки",
          description: "Некорректный идентификатор игрока.",
          variant: "destructive"
        });
        setIsLoadingPlayerData(false);
        return;
      }
      
      try {
        // Форматируем дату для API (YYYY-MM-DD)
        const apiDateFormat = date.toISOString().split('T')[0];
        
        // Используем API с фильтрацией по дате на сервере
        const response = await getPlayerMoodByDate(playerId, apiDateFormat);
        
        const playerEntries = response.data.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          timeOfDay: entry.timeOfDay || "morning"
        }));
        
        setPlayerEntries(playerEntries as MoodEntryWithTimeOfDay[]);
        setSelectedPlayerId(playerId);
        
        // Загружаем данные для графика через API с фильтрацией по дате
        try {
          const chartResponse = await getPlayerMoodChartDataByDate(playerId, apiDateFormat);
          setChartData(chartResponse.data);
        } catch (chartError) {
          console.error(`Ошибка при загрузке данных для графика игрока ${playerId}:`, chartError);
          
          // Fallback: используем обычный API без фильтрации если API с фильтрацией недоступно
          try {
            const fallbackChartResponse = await getPlayerMoodChartData(playerId);
            
            // Фильтруем данные на клиентской стороне если необходимо
            const filteredChartData = fallbackChartResponse.data.filter((item: any) => {
              const itemDate = new Date(item.date);
              const itemDateStr = itemDate.toISOString().split('T')[0];
              return itemDateStr === apiDateFormat;
            });
            
            setChartData(filteredChartData.length > 0 ? filteredChartData : fallbackChartResponse.data);
          } catch (fallbackError) {
            console.error(`Ошибка при загрузке данных для графика игрока (резервный метод) ${playerId}:`, fallbackError);
            
            // Если все API недоступны, создаем график из доступных данных
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
        }
      } catch (error: any) {
        console.error(`Ошибка при загрузке записей игрока ${playerId}:`, error);
        
        // Fallback: используем обычный API если API с фильтрацией недоступно
        try {
          const fallbackResponse = await getPlayerMoodEntries(playerId);
          
          // Фильтруем записи по дате на стороне клиента
          const apiDateFormat = date.toISOString().split('T')[0];
          const filteredEntries = fallbackResponse.data
            .filter((entry: any) => {
              const entryDate = new Date(entry.date);
              return entryDate.toISOString().split('T')[0] === apiDateFormat;
            })
            .map((entry: any) => ({
              ...entry,
              date: new Date(entry.date),
              timeOfDay: entry.timeOfDay || "morning"
            }));
          
          setPlayerEntries(filteredEntries as MoodEntryWithTimeOfDay[]);
          setSelectedPlayerId(playerId);
          
          // Генерируем данные для графика из доступных записей
          if (filteredEntries.length > 0) {
            prepareChartData(filteredEntries);
          } else {
            // Если нет данных для выбранной даты
            toast({
              title: "Нет данных",
              description: `Нет записей на ${formatDate(date)} для данного игрока.`,
              variant: "default"
            });
          }
        } catch (fallbackError) {
          console.error(`Ошибка при загрузке записей игрока (резервный метод) ${playerId}:`, fallbackError);
          
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
      }

      toast({
        title: "Данные загружены",
        description: "Записи игрока успешно загружены.",
        variant: "default"
      });

      // Сохраняем ID игрока в sessionStorage для восстановления при перезагрузке
      try {
        sessionStorage.setItem('selectedPlayerId', playerId);
      } catch (e) {
        // Игнорируем ошибки sessionStorage
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
  
  // Модифицируем существующий метод loadPlayerEntries, чтобы он учитывал выбранную дату
  const loadPlayerEntries = async (playerId: string) => {
    // Показываем индикатор загрузки
    setIsLoadingPlayerData(true);
    
    // Сброс предыдущих уведомлений
    try {
      // Просто показываем уведомление без сохранения ссылки
      toast({
        title: "Загрузка...",
        description: "Загружаем записи игрока",
        variant: "default"
      });
      
      // Больше не пытаемся скрыть уведомление вручную,
      // используем автоматическое скрытие
    } catch (e) {
      // Игнорируем ошибки toast
      console.error("Ошибка toast:", e);
    }
    
    // Используем новый метод с выбранной датой
    await loadPlayerEntriesForDate(playerId, selectedChartDate);
    
    // После загрузки прокручиваем к секции с записями
    setTimeout(() => {
      if (playerEntriesRef.current) {
        playerEntriesRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
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
          let serverEntries = response.data.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date)
          }));
          
          console.log('Загружено записей с сервера:', serverEntries.length);
          
          // Удаляем дубликаты записей с одинаковыми датами и временем дня
          const uniqueEntries = removeDuplicateEntries(serverEntries);
          console.log('Уникальных записей после обработки:', uniqueEntries.length);
          
          // Обновляем состояние только уникальными записями
          setEntries(uniqueEntries as MoodEntryWithTimeOfDay[]);
          
          // Обновляем локальное хранилище с уникальными данными с сервера
          moodRepository.updateFromServer(uniqueEntries);
          
          console.log('Настроения успешно загружены с сервера');
        } catch (error) {
          console.error('Ошибка загрузки настроений с сервера:', error);
          
          // Если не удалось загрузить с сервера, используем локальные данные
          const localEntries = moodRepository.getAll();
          const uniqueLocalEntries = removeDuplicateEntries(localEntries);
          setEntries(uniqueLocalEntries as MoodEntryWithTimeOfDay[]);
          
          toast({
            title: "Ошибка загрузки",
            description: "Не удалось загрузить записи с сервера, используются локальные данные.",
            variant: "destructive"
          });
        }
      } else {
        // Если пользователь не авторизован, используем локальные данные
        const localEntries = moodRepository.getAll();
        const uniqueLocalEntries = removeDuplicateEntries(localEntries);
        setEntries(uniqueLocalEntries as MoodEntryWithTimeOfDay[]);
      }
    } catch (error) {
      console.error('Ошибка загрузки записей о настроении:', error);
      
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить записи о настроении.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Вспомогательная функция для удаления дубликатов записей
  const removeDuplicateEntries = (entries: any[]) => {
    const uniqueEntries = new Map();
    
    // Проходим по всем записям и сохраняем только уникальные
    entries.forEach(entry => {
      const entryDate = typeof entry.date === 'string' 
        ? new Date(entry.date).toISOString().split('T')[0]
        : entry.date.toISOString().split('T')[0];
      
      // Создаем уникальный ключ для записи на основе даты и времени суток
      const key = `${entryDate}_${entry.timeOfDay}`;
      
      // Если запись с таким ключом уже существует, перезаписываем её только если текущая запись новее
      if (!uniqueEntries.has(key) || 
          (entry.updated && new Date(entry.updated) > new Date(uniqueEntries.get(key).updated))) {
        uniqueEntries.set(key, {
          ...entry,
          id: entry.id || entry._id || key // Обеспечиваем наличие ID
        });
      }
    });
    
    // Возвращаем массив уникальных записей
    return Array.from(uniqueEntries.values());
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
      
      // Форматируем дату для проверки и API
      const formattedDate = selectedDate instanceof Date 
        ? selectedDate.toISOString().split('T')[0] 
        : selectedDate;
    
      // Проверяем, есть ли уже запись на выбранную дату и время суток
      const existingEntries = entries.filter(entry => {
        const entryDate = typeof entry.date === 'string' 
          ? new Date(entry.date).toISOString().split('T')[0] 
          : (entry.date as Date).toISOString().split('T')[0];
        return entryDate === formattedDate && entry.timeOfDay === timeOfDay;
      });
      
      // Если есть существующие записи, предупреждаем пользователя
      if (existingEntries.length > 0) {
        toast({
          title: "Внимание",
          description: `Уже существует запись на ${formatDate(selectedDate)} (${formatTimeOfDay(timeOfDay)}). Записи на выбранное время суток не должны дублироваться.`,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
    
      // Создаем объект с данными для API
      const newEntry = {
        date: formattedDate,
        timeOfDay,
        mood,
        energy,
        comment: comment.trim() || undefined,
      };
      
      console.log("Создаем новую запись с данными:", newEntry);
      
      // Создаем уникальный идентификатор для новой записи
      const tempId = `${formattedDate}_${timeOfDay}_${Date.now()}`;
      
      // Создаем запись локально сначала с временным уникальным ID
      let savedEntry = moodRepository.create({
        ...newEntry,
        id: tempId,
        date: selectedDate // Для локального хранилища используем объект Date
      } as any);
      
      console.log("Локальная запись создана с ID:", savedEntry.id);
      
      // Если пользователь авторизован, пытаемся сразу сохранить на сервере
      if (user) {
        try {
          // Отправляем данные на сервер
          const response = await createMoodEntry(newEntry as any);
          console.log('Запись сохранена на сервере:', response.data);
          
          // Обновляем локальную запись с ID от сервера
          if (response.data && (response.data.id || response.data._id)) {
            const serverId = response.data.id || response.data._id;
            console.log("ID полученный с сервера:", serverId);
            
            // Удаляем запись с временным ID
            moodRepository.delete(savedEntry.id);
            
            // Создаем новую запись с ID сервера
            savedEntry = {
              ...savedEntry,
              id: serverId
            };
            
            // Сохраняем обновленную запись в локальное хранилище
            const allEntries = moodRepository.getAll();
            moodRepository.updateFromServer([...allEntries, savedEntry]);
          }
        } catch (error) {
          console.error('Ошибка сохранения на сервере (будет синхронизировано позже):', error);
        }
      }
      
      // Загружаем записи заново
      await loadEntries();
      resetForm();
      setIsAddingEntry(false);
      
      toast({
        title: "Запись добавлена",
        description: "Запись о настроении успешно сохранена.",
      });
    } catch (error) {
      console.error('Ошибка сохранения записи:', error);
      
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить запись о настроении.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string | undefined) => {
    console.log(`Попытка удаления записи с ID: ${id}`);
    
    // Проверяем наличие ID
    if (!id) {
      console.error("Ошибка: ID не определен при попытке удаления");
      toast({
        title: "Ошибка",
        description: "Ошибка: ID записи не определен",
        variant: "destructive"
      });
      return;
    }
    
    // Проверяем роль пользователя
    if (user?.role === "staff") {
      console.error("Ошибка: Пользователь staff не может удалять записи");
      toast({
        title: "Ошибка",
        description: "У вас нет прав на удаление записей",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Удаляем запись из API
      const response = await deleteMoodEntry(id);
      console.log(`Ответ от API при удалении:`, response.data);
      
      // Обновляем локальное хранилище
      const updatedEntries = entries.filter((entry: any) => 
        (entry.id !== id && entry._id !== id) // Проверяем оба возможных варианта ID
      );
      setEntries(updatedEntries);
      
      // Обновляем UI
      loadEntries();
      
      toast({
        title: "Запись удалена",
        description: "Запись настроения была успешно удалена",
      });
    } catch (error) {
      console.error("Ошибка при удалении записи:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить запись. Пожалуйста, попробуйте снова.",
        variant: "destructive"
      });
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
    
    // Шаг 1: Создаем Set для хранения уникальных ID
    const uniqueIds = new Set();
    
    // Шаг 2: Фильтруем записи, сначала по времени дня, затем по уникальности ID
    const timeEntries = dayEntries
      .filter((entry: any) => entry.timeOfDay === time)
      .reduce((unique: MoodEntryWithTimeOfDay[], entry: any) => {
        // Генерируем идентификатор для записи, основанный на нескольких ее свойствах
        const entryId = entry.id || entry._id || `${entry.date}_${entry.timeOfDay}_${entry.mood}_${entry.energy}`;
        
        // Проверяем, есть ли уже запись с таким ID
        if (!uniqueIds.has(entryId)) {
          // Если нет, добавляем ID в Set и запись в результат
          uniqueIds.add(entryId);
          unique.push({
        ...entry,
            id: entryId // Используем надежный идентификатор
          });
        }
        
        return unique;
      }, []);
    
    // Дополнительная проверка и логирование, если нужно
    if (timeEntries.length > 0) {
      console.log(`Уникальные записи на ${time} для ${formatDate(date)}:`, timeEntries.length);
    }
    
    return timeEntries;
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

  // Кастомный компонент для отображения всплывающей подсказки с временем
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          style={{ 
            backgroundColor: COLORS.cardBackground, 
            color: COLORS.textColor,
            padding: '10px',
            border: `1px solid ${COLORS.borderColor}`,
            borderRadius: '4px'
          }}
        >
          <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>{`${label}`}</p>
          <p style={{ margin: '0 0 5px' }}>
            {data.time ? `Время: ${data.time}` : 'Время не указано'}
            {data.timeOfDay ? ` (${data.timeOfDay === "morning" ? "Утро" : data.timeOfDay === "afternoon" ? "День" : "Вечер"})` : ''}
          </p>
          <p style={{ 
            margin: '0 0 5px', 
            color: COLORS.chartColors[0]
          }}>
            {`Настроение: ${payload[0].value}/10`}
          </p>
          {payload.length > 1 && (
            <p style={{ 
              margin: '0', 
              color: COLORS.chartColors[1]
            }}>
              {`Энергия: ${payload[1].value}/10`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Обновляем компонент для отображения мини-графика в карточке игрока, чтобы он использовал реальные данные
  const PlayerActivityMiniChart = ({ playerId }: { playerId: string }) => {
    const [activityData, setActivityData] = useState<{ date: string; time: string; mood: number; energy: number; timeOfDay?: string }[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { toast } = useToast();

    // Загрузка данных активности для мини-графика
    useEffect(() => {
      const loadActivityData = async () => {
        try {
          setIsLoading(true);
          
          // Используем API для получения данных активности
          const response = await getPlayerActivityData(playerId);
          
          // Преобразуем данные в нужный формат с разделением на настроение и энергию
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const formattedData = response.data.map((item: any) => {
              const itemDate = new Date(item.date);
              return {
                date: formatDate(itemDate, 'dd.MM'),
                time: formatDate(itemDate, 'HH:mm'),
                mood: item.mood,
                energy: item.energy,
                timeOfDay: item.timeOfDay || formatTimeOfDay("morning")
              };
            });
            
            setActivityData(formattedData);
          } else {
            // Если API вернуло пустые или некорректные данные, устанавливаем пустой массив
            setActivityData([]);
            console.log('API вернул пустые данные для графика активности');
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных активности:', error);
          setActivityData([]);
          
          toast({
            title: "Ошибка загрузки данных",
            description: "Не удалось загрузить данные активности игрока",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      };

      if (playerId) {
        loadActivityData();
      }
    }, [playerId, toast]);

    if (isLoading) {
      return <div className="h-20 w-full bg-gray-800 rounded animate-pulse"></div>;
    }

    if (!activityData || !activityData.length) {
      return <div className="h-20 w-full bg-gray-800 rounded flex items-center justify-center text-xs" style={{ color: COLORS.textColorSecondary }}>Нет данных</div>;
    }

    return (
      <div className="h-24 w-full">
        <div className="flex justify-end gap-3 mb-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.chartColors[0] }}></div>
            <span className="text-xs" style={{ color: COLORS.textColorSecondary }}>Настр.</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.chartColors[1] }}></div>
            <span className="text-xs" style={{ color: COLORS.textColorSecondary }}>Энерг.</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart
            data={activityData}
            margin={{ top: 0, right: 2, left: 2, bottom: 0 }}
          >
            <YAxis domain={[0, 10]} hide={true} />
            <TooltipRecharts 
              content={<CustomTooltip />}
              cursor={{ stroke: COLORS.borderColor, strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Line 
              type="monotone" 
              dataKey="mood" 
              stroke={COLORS.chartColors[0]} 
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: COLORS.chartColors[0] }}
            />
            <Line 
              type="monotone" 
              dataKey="energy" 
              stroke={COLORS.chartColors[1]} 
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: COLORS.chartColors[1] }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Изменяем компонент отображения графиков для игрока
  const PlayerMoodCharts = () => {
    if (!selectedPlayerId || chartData.length === 0) return null;
    
    const playerName = playerStats.find(p => p.userId === selectedPlayerId)?.name || "Игрок";
    
    return (
      <Card className="mt-6 mb-6" style={cardStyle}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle style={titleStyle}>
              <TrendingUp className="mr-2 h-5 w-5" />
              Динамика настроения и энергии: {playerName}
            </CardTitle>
            
            {/* Добавляем селектор даты */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                style={{ color: COLORS.primary }}
                onClick={() => handleChartDateChange(new Date(selectedChartDate.getTime() - 86400000))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="bg-gray-800 rounded-md px-3 py-1 flex items-center">
                <Calendar className="h-4 w-4 mr-2" style={{ color: COLORS.primary }} />
                <span style={{ color: COLORS.textColor }}>
                  {formatDate(selectedChartDate)}
                </span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                style={{ color: COLORS.primary }}
                onClick={() => handleChartDateChange(new Date(selectedChartDate.getTime() + 86400000))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription style={descriptionStyle}>
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
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderColor} />
                <XAxis dataKey="date" tick={{ fill: COLORS.textColor }} />
                <YAxis domain={[0, 10]} tick={{ fill: COLORS.textColor }} />
                <TooltipRecharts
                  formatter={(value: number) => [`${value}/10`, '']}
                  labelFormatter={(label) => `Дата: ${label}`}
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
                  stroke={COLORS.chartColors[0]} 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: COLORS.chartColors[0] }}
                  activeDot={{ r: 6, fill: COLORS.chartColors[0] }}
                />
                <Line
                  type="monotone" 
                  dataKey="energy" 
                  name="Энергия" 
                  stroke={COLORS.chartColors[1]} 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: COLORS.chartColors[1] }}
                  activeDot={{ r: 6, fill: COLORS.chartColors[1] }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
              <CardContent className="pt-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold" style={{ color: COLORS.textColor }}>Настроение</h4>
                  <p className="text-sm mt-1" style={{ color: COLORS.textColorSecondary }}>
                    Среднее: {chartData.length > 0 ? (chartData.reduce((sum, item) => sum + item.mood, 0) / chartData.length).toFixed(1) : 0}{"/10"}
                  </p>
                  <p className="text-sm" style={{ color: COLORS.textColorSecondary }}>
                    Диапазон: {chartData.length > 0 ? Math.min(...chartData.map(item => item.mood)) : 0}-{chartData.length > 0 ? Math.max(...chartData.map(item => item.mood)) : 0}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
              <CardContent className="pt-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold" style={{ color: COLORS.textColor }}>Энергия</h4>
                  <p className="text-sm mt-1" style={{ color: COLORS.textColorSecondary }}>
                    Среднее: {chartData.length > 0 ? (chartData.reduce((sum, item) => sum + item.energy, 0) / chartData.length).toFixed(1) : 0}{"/10"}
                  </p>
                  <p className="text-sm" style={{ color: COLORS.textColorSecondary }}>
                    Диапазон: {chartData.length > 0 ? Math.min(...chartData.map(item => item.energy)) : 0}-{chartData.length > 0 ? Math.max(...chartData.map(item => item.energy)) : 0}
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
            <>
              {/* Добавляем общий селектор даты для всех игроков */}
              <Card style={cardStyle}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold" style={titleStyle}>
                      Настроение и энергия на дату
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        style={{ color: COLORS.primary }}
                        onClick={() => handleChartDateChange(new Date(selectedChartDate.getTime() - 86400000))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="bg-gray-800 rounded-md px-3 py-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" style={{ color: COLORS.primary }} />
                        <span style={{ color: COLORS.textColor }}>
                          {formatDate(selectedChartDate)}
                        </span>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        style={{ color: COLORS.primary }}
                        onClick={() => handleChartDateChange(new Date(selectedChartDate.getTime() + 86400000))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Отображение карточек игроков */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {playerStats.map(player => (
                  <Card key={player.userId} style={cardStyle}>
                    <CardHeader className="pb-2">
                      <CardTitle style={titleStyle}>{player.name}</CardTitle>
                      <CardDescription style={descriptionStyle}>
                        Средние показатели: Настроение {player.mood.toFixed(1)}, Энергия {player.energy.toFixed(1)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-0">
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
                      
                      {/* Добавляем график активности */}
                      <div className="mt-3">
                        <p className="text-sm mb-1" style={descriptionStyle}>Активность</p>
                        <PlayerActivityMiniChart playerId={player.userId} />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="default"
                        style={{ backgroundColor: COLORS.primary, color: "white" }}
                        onClick={() => loadPlayerEntries(player.userId)}
                        className="w-full"
                      >
                        Смотреть записи
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
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
            <div className="space-y-4 mt-8" ref={playerEntriesRef}>
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold" style={titleStyle}>
                  Записи игрока
                </h3>
                <Button 
                  variant="outline" 
                  style={{ color: COLORS.primary, borderColor: COLORS.primary }}
                  onClick={() => {
                    setSelectedPlayerId(null);
                    setPlayerEntries([]);
                    setChartData([]);
                    // Удаляем ID игрока из sessionStorage
                    try {
                      sessionStorage.removeItem('selectedPlayerId');
                    } catch (e) {
                      // Игнорируем ошибки sessionStorage
                    }
                  }}
                >
                  Назад к списку
                </Button>
              </div>
              
              {/* Если загрузка данных - показываем спиннер */}
              {isLoadingPlayerData ? (
                <Card style={cardStyle}>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary mb-2"></div>
                      <p style={descriptionStyle}>Загрузка записей игрока...</p>
                    </div>
                  </CardContent>
                </Card>
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
                            <TooltipRecharts 
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
                              stroke={COLORS.chartColors[0]}
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: COLORS.chartColors[0] }} 
                              activeDot={{ r: 6, fill: COLORS.chartColors[0] }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="energy" 
                              name="Энергия" 
                              stroke={COLORS.chartColors[1]}
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: COLORS.chartColors[1] }}
                              activeDot={{ r: 6, fill: COLORS.chartColors[1] }}
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
                    style={{ color: COLORS.primary }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span style={titleStyle}>{getWeekLabel(currentWeek)}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextWeek}
                    style={{ color: COLORS.primary }}
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
                          ? "bg-esports-teal/20 border border-esports-teal"
                          : "bg-gray-800 border border-gray-700 hover:bg-gray-700"
                      }`}
                      onClick={() => handleSelectDate(date)}
                    >
                      <p className="text-sm font-medium" style={{ color: COLORS.textColor }}>
                        {formatDate(date, "EEE")}
                      </p>
                      <p className="text-xl font-semibold" style={{ color: COLORS.textColor }}>
                        {formatDate(date, "d")}
                      </p>
                      <div className="mt-2 flex justify-center">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            dayEntries.length > 0 ? "bg-esports-teal" : "bg-gray-600"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Отображение записей на выбранную дату с возможностью добавления */}
          <Card style={cardStyle}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle style={titleStyle}>
                  Записи за {formatDate(selectedDate, "d MMMM yyyy")}
                </CardTitle>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setIsAddingEntry(true)}
                  style={{ backgroundColor: COLORS.primary, color: "white" }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить запись
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Утренние записи */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.textColor }}>Утро</h3>
                  <div className="space-y-2">
                    {/* Получаем записи на утро и используем Set для хранения уже отрендеренных ID */}
                    {(() => {
                      const renderedIds = new Set();
                      const morningEntries = getTimeOfDayEntries(selectedDate, "morning");
                      
                      return morningEntries.map((entry) => {
                        // Если запись уже была отрендерена, пропускаем её
                        if (renderedIds.has(entry.id)) {
                          return null;
                        }
                        
                        // Добавляем ID в Set отрендеренных
                        renderedIds.add(entry.id);
                        
                        return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-md"
                        style={{ 
                          backgroundColor: 'rgba(22, 25, 37, 0.7)', 
                          borderLeft: `4px solid ${COLORS.chartColors[0]}`,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                        }}
                      >
                        <div className="flex space-x-4 items-center">
                          <TooltipProvider>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                                  style={{ backgroundColor: COLORS.primary }}>
                                  <Smile className="text-white" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent style={{ backgroundColor: COLORS.cardBackground, color: COLORS.textColor, borderColor: COLORS.borderColor }}>
                                <div className="w-48 p-2">
                                  <div className="mb-1">
                                    <span className="font-semibold">Настроение:</span>{" "}
                                    {entry.mood}/10
                                  </div>
                                  <div className="mb-1">
                                    <span className="font-semibold">Энергия:</span>{" "}
                                    {entry.energy}/10
                                  </div>
                                  {entry.comment && (
                                    <div>
                                      <span className="font-semibold">Комментарий:</span>{" "}
                                      {entry.comment}
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div>
                            <div className="font-medium" style={{ color: COLORS.textColor }}>
                              Настроение: {entry.mood}/10, Энергия: {entry.energy}/10
                            </div>
                            {entry.comment && (
                              <div className="text-sm" style={{ color: COLORS.textColorSecondary }}>
                                {entry.comment}
                              </div>
                            )}
                          </div>
                        </div>
                        {user?.role !== "staff" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry.id)}
                            style={{ color: COLORS.textColor }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                        );
                      }).filter(Boolean); // Фильтруем null значения
                    })()}
                    {getTimeOfDayEntries(selectedDate, "morning").length === 0 && (
                      <div className="text-center py-3" style={{ color: COLORS.textColorSecondary }}>
                        Нет записей на утро
                      </div>
                    )}
                  </div>
                </div>

                {/* Дневные записи */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.textColor }}>День</h3>
                  <div className="space-y-2">
                    {/* Получаем записи на день с проверкой уникальности */}
                    {(() => {
                      const renderedIds = new Set();
                      const afternoonEntries = getTimeOfDayEntries(selectedDate, "afternoon");
                      
                      return afternoonEntries.map((entry) => {
                        if (renderedIds.has(entry.id)) {
                          return null;
                        }
                        renderedIds.add(entry.id);
                        
                        return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-md"
                        style={{ 
                          backgroundColor: 'rgba(22, 25, 37, 0.7)', 
                          borderLeft: `4px solid ${COLORS.chartColors[1]}`,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                        }}
                      >
                        <div className="flex space-x-4 items-center">
                          <TooltipProvider>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                                  style={{ backgroundColor: COLORS.primary }}>
                                  <Smile className="text-white" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent style={{ backgroundColor: COLORS.cardBackground, color: COLORS.textColor, borderColor: COLORS.borderColor }}>
                                <div className="w-48 p-2">
                                  <div className="mb-1">
                                    <span className="font-semibold">Настроение:</span>{" "}
                                    {entry.mood}/10
                                  </div>
                                  <div className="mb-1">
                                    <span className="font-semibold">Энергия:</span>{" "}
                                    {entry.energy}/10
                                  </div>
                                  {entry.comment && (
                                    <div>
                                      <span className="font-semibold">Комментарий:</span>{" "}
                                      {entry.comment}
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div>
                            <div className="font-medium" style={{ color: COLORS.textColor }}>
                              Настроение: {entry.mood}/10, Энергия: {entry.energy}/10
                            </div>
                            {entry.comment && (
                              <div className="text-sm" style={{ color: COLORS.textColorSecondary }}>
                                {entry.comment}
                              </div>
                            )}
                          </div>
                        </div>
                        {user?.role !== "staff" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry.id)}
                            style={{ color: COLORS.textColor }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                        );
                      }).filter(Boolean); // Фильтруем null значения
                    })()}
                    {getTimeOfDayEntries(selectedDate, "afternoon").length === 0 && (
                      <div className="text-center py-3" style={{ color: COLORS.textColorSecondary }}>
                        Нет записей на день
                      </div>
                    )}
                  </div>
                </div>

                {/* Вечерние записи */}
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.textColor }}>Вечер</h3>
                  <div className="space-y-2">
                    {/* Получаем записи на вечер с проверкой уникальности */}
                    {(() => {
                      const renderedIds = new Set();
                      const eveningEntries = getTimeOfDayEntries(selectedDate, "evening");
                      
                      return eveningEntries.map((entry) => {
                        if (renderedIds.has(entry.id)) {
                          return null;
                        }
                        renderedIds.add(entry.id);
                        
                        return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-md"
                        style={{ 
                          backgroundColor: 'rgba(22, 25, 37, 0.7)', 
                          borderLeft: `4px solid #9c59b6`,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                        }}
                      >
                        <div className="flex space-x-4 items-center">
                          <TooltipProvider>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                                  style={{ backgroundColor: COLORS.primary }}>
                                  <Smile className="text-white" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent style={{ backgroundColor: COLORS.cardBackground, color: COLORS.textColor, borderColor: COLORS.borderColor }}>
                                <div className="w-48 p-2">
                                  <div className="mb-1">
                                    <span className="font-semibold">Настроение:</span>{" "}
                                    {entry.mood}/10
                                  </div>
                                  <div className="mb-1">
                                    <span className="font-semibold">Энергия:</span>{" "}
                                    {entry.energy}/10
                                  </div>
                                  {entry.comment && (
                                    <div>
                                      <span className="font-semibold">Комментарий:</span>{" "}
                                      {entry.comment}
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div>
                            <div className="font-medium" style={{ color: COLORS.textColor }}>
                              Настроение: {entry.mood}/10, Энергия: {entry.energy}/10
                            </div>
                            {entry.comment && (
                              <div className="text-sm" style={{ color: COLORS.textColorSecondary }}>
                                {entry.comment}
                              </div>
                            )}
                          </div>
                        </div>
                        {user?.role !== "staff" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry.id)}
                            style={{ color: COLORS.textColor }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                        );
                      }).filter(Boolean); // Фильтруем null значения
                    })()}
                    {getTimeOfDayEntries(selectedDate, "evening").length === 0 && (
                      <div className="text-center py-3" style={{ color: COLORS.textColorSecondary }}>
                        Нет записей на вечер
                      </div>
                    )}
                  </div>
                </div>
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
          <div className="space-y-4 py-2">
            {/* Выбор времени суток */}
            <div className="space-y-2">
              <Label htmlFor="timeOfDay" style={{ color: COLORS.textColor }}>Время суток</Label>
              <Select 
                value={timeOfDay} 
                onValueChange={(value: "morning" | "afternoon" | "evening") => setTimeOfDay(value)}
              >
                <SelectTrigger className="w-full" style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor, color: COLORS.textColor }}>
                  <SelectValue placeholder="Выберите время суток" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, color: COLORS.textColor }}>
                  <SelectItem value="morning">Утро</SelectItem>
                  <SelectItem value="afternoon">День</SelectItem>
                  <SelectItem value="evening">Вечер</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Настроение */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="mood" style={{ color: COLORS.textColor }}>Настроение</Label>
                <span style={{ color: COLORS.textColor }}>{mood}/10</span>
              </div>
              <Slider
                id="mood"
                min={1}
                max={10}
                step={1}
                value={[mood]}
                onValueChange={(value) => setMood(value[0])}
                style={{ color: COLORS.chartColors[0] }}
              />
            </div>
            
            {/* Энергия */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="energy" style={{ color: COLORS.textColor }}>Энергия</Label>
                <span style={{ color: COLORS.textColor }}>{energy}/10</span>
              </div>
              <Slider
                id="energy"
                min={1}
                max={10}
                step={1}
                value={[energy]}
                onValueChange={(value) => setEnergy(value[0])}
                style={{ color: COLORS.chartColors[1] }}
              />
            </div>
            
            {/* Комментарий */}
            <div className="space-y-2">
              <Label htmlFor="comment" style={{ color: COLORS.textColor }}>Комментарий (необязательно)</Label>
              <Textarea
                id="comment"
                placeholder="Введите комментарий..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor, color: COLORS.textColor }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsAddingEntry(false)}
              style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={isLoading}
              style={{ backgroundColor: COLORS.primary, color: "white" }}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white mr-2"></div>
                  Сохранение...
                </>
              ) : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MoodTracker;
