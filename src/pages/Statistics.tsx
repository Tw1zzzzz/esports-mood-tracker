import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ru } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { MoodEntry, TestEntry, StatsData } from "@/types";
import { getMoodEntries, getTestEntries } from "@/utils/storage";
import { formatDate } from "@/utils/dateUtils";
import { getMoodStats, getTestStats, getAllPlayersMoodStats, getAllPlayersTestStats, getPlayers, getPlayerStats } from "@/lib/api";
import { useLocation, useNavigate } from "react-router-dom";
import { COLORS, COMPONENT_STYLES } from "@/styles/theme";
import { prepareMoodDataByTimeRange, prepareTestDataByTimeRange, prepareTestDistribution } from "@/utils/statsUtils";
import PersonalStats from "@/components/stats/PersonalStats";
import PlayersStats from "@/components/stats/PlayersStats";

// Используем цвета темы для графиков
const CHART_COLORS = COLORS.chartColors;

// Кастомный стиль для диаграмм
const chartStyle = {
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: '12px',
  fill: COLORS.textColor,
  borderRadius: '12px', 
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
};

// Компонент для стилизованных всплывающих подсказок на графиках
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  
  return (
    <div style={{ 
      backgroundColor: COLORS.cardBackground, 
      borderColor: COLORS.borderColor,
      border: `1px solid ${COLORS.borderColor}`,
      borderRadius: '8px',
      padding: '10px 14px',
      color: COLORS.textColor,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
    }}>
      <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: COLORS.textColor }}>
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <p key={`tooltip-item-${index}`} style={{ 
          margin: '4px 0', 
          display: 'flex',
          alignItems: 'center'
        }}>
          <span 
            style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              marginRight: '8px',
              backgroundColor: entry.color,
              borderRadius: '50%'
            }} 
          />
          <span style={{ marginRight: '8px', color: COLORS.textColorSecondary }}>
            {entry.name}:
          </span>
          <span style={{ fontWeight: 'bold', color: COLORS.textColor }}>
            {entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

const Statistics = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const urlPlayerId = queryParams.get('playerId');
  
  const isStaff = user?.role === "staff";
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [testEntries, setTestEntries] = useState<TestEntry[]>([]);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "3months">("week");
  const [moodData, setMoodData] = useState<StatsData[]>([]);
  const [testData, setTestData] = useState<any[]>([]);
  const [testDistribution, setTestDistribution] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"personal" | "players">(urlPlayerId ? "personal" : "personal");
  const [playersMoodStats, setPlayersMoodStats] = useState<any>([]);
  const [playersTestStats, setPlayersTestStats] = useState<any>([]);
  const [loadingPlayersData, setLoadingPlayersData] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [averagePlayerStats, setAveragePlayerStats] = useState({
    avgMood: 0,
    avgEnergy: 0,
    completedTests: 0,
    totalPlayers: 0
  });
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(urlPlayerId || "");
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(false);
  const [playerStatsData, setPlayerStatsData] = useState<any>(null);
  
  useEffect(() => {
    if (isStaff) {
      fetchPlayers();
      if (urlPlayerId) {
        setSelectedPlayerId(urlPlayerId);
        setActiveTab("personal");
      } else {
        loadPlayersData();
      }
    } else {
      loadPersonalData();
    }
  }, [isStaff, urlPlayerId]);
  
  useEffect(() => {
    if (isStaff && selectedPlayerId) {
      fetchPlayerStats(selectedPlayerId);
    }
  }, [isStaff, selectedPlayerId]);
  
  useEffect(() => {
    if (isStaff && activeTab === "players") {
      loadPlayersData();
    }
  }, [isStaff, activeTab]);
  
  useEffect(() => {
    if (moodEntries.length > 0) {
      processMoodData();
    }
    
    if (testEntries.length > 0) {
      processTestData();
    }
  }, [moodEntries, testEntries, timeRange]);
  
  const loadPersonalData = async () => {
    try {
      console.log('Загрузка личной статистики игрока');
      setLoadingPlayersData(true);
      setLoadingError(null);
      
      // Получаем данные о настроении из API
      const moodResponse = await getMoodStats();
      if (moodResponse.data && Array.isArray(moodResponse.data)) {
        console.log(`Получено ${moodResponse.data.length} записей о настроении`);
        setMoodEntries(moodResponse.data);
      } else {
        console.warn('Не получено данных о настроении');
        setMoodEntries([]);
      }
      
      // Получаем данные о тестах из API
      const testResponse = await getTestStats();
      if (testResponse.data && Array.isArray(testResponse.data)) {
        console.log(`Получено ${testResponse.data.length} записей о тестах`);
        setTestEntries(testResponse.data);
      } else {
        console.warn('Не получено данных о тестах');
        setTestEntries([]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      setLoadingError(`Ошибка загрузки данных: ${(error as Error).message}`);
      
      // В случае ошибки API, пытаемся получить данные из локального хранилища как запасной вариант
      const loadedMoodEntries = getMoodEntries();
      const loadedTestEntries = getTestEntries();
      
      setMoodEntries(loadedMoodEntries);
      setTestEntries(loadedTestEntries);
    } finally {
      setLoadingPlayersData(false);
    }
  };
  
  const fetchPlayers = async () => {
    try {
      setLoadingError(null);
      const response = await getPlayers();
      if (!response.data) {
        throw new Error('Не удалось загрузить список игроков');
      }
      setPlayers(response.data);
      if (response.data.length > 0 && !selectedPlayerId) {
        setSelectedPlayerId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };
  
  const fetchPlayerStats = async (playerId: string) => {
    if (!playerId) return;
    
    try {
      setLoadingPlayerStats(true);
      setLoadingError(null);
      
      // Проверяем, не является ли playerId объектом
      let playerIdStr = playerId;
      if (typeof playerId === 'object' && playerId !== null) {
        console.log('Получен объект игрока вместо ID, извлекаем ID:', playerId);
        // @ts-ignore
        playerIdStr = playerId._id || '';
        if (!playerIdStr) {
          throw new Error('Некорректный формат ID игрока: ID отсутствует в объекте');
        }
      }
      
      console.log(`Fetching stats for player: ${playerIdStr}`);
      const response = await getPlayerStats(playerIdStr);
      
      if (response.data) {
        console.log('Player data received:', response.data);
        
        // Проверяем, есть ли данные о настроении
        if (response.data.moodEntries && Array.isArray(response.data.moodEntries)) {
          console.log(`Received ${response.data.moodEntries.length} mood entries`);
          setMoodEntries(response.data.moodEntries);
        } else {
          console.warn('No mood entries data received');
          setMoodEntries([]);
        }
        
        // Проверяем, есть ли данные о тестах
        if (response.data.testEntries && Array.isArray(response.data.testEntries)) {
          console.log(`Received ${response.data.testEntries.length} test entries`);
          setTestEntries(response.data.testEntries);
        } else {
          console.warn('No test entries data received');
          setTestEntries([]);
        }
        
        // Сохраняем дополнительные данные игрока
        setPlayerStatsData(response.data);
      } else {
        console.warn('No data received for player');
        setMoodEntries([]);
        setTestEntries([]);
        setPlayerStatsData(null);
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
      setLoadingError(`Ошибка загрузки данных игрока: ${(error as Error).message}`);
      setMoodEntries([]);
      setTestEntries([]);
      setPlayerStatsData(null);
    } finally {
      setLoadingPlayerStats(false);
    }
  };
  
  const loadPlayersData = async () => {
    try {
      setLoadingPlayersData(true);
      setLoadingError(null);
      
      // Загружаем данные о настроении игроков
      const moodResponse = await getAllPlayersMoodStats();
      if (moodResponse.data) {
        setPlayersMoodStats(moodResponse.data);
      }
      
      // Загружаем данные о тестах игроков
      const testResponse = await getAllPlayersTestStats();
      if (testResponse.data) {
        setPlayersTestStats(testResponse.data);
      }
      
      // Рассчитываем средние показатели игроков
      if (moodResponse.data && testResponse.data) {
        calculateAveragePlayerStats(moodResponse.data, testResponse.data);
      }
    } catch (error) {
      console.error('Error loading players data:', error);
      setLoadingError(`Ошибка загрузки данных: ${(error as Error).message}`);
    } finally {
      setLoadingPlayersData(false);
    }
  };
  
  const calculateAveragePlayerStats = (moodStats: any, testStats: any) => {
    if (!moodStats || !Array.isArray(moodStats) || !testStats || !Array.isArray(testStats)) {
      return;
    }
    
    let totalMood = 0;
    let totalEnergy = 0;
    let moodCount = 0;
    let totalTests = 0;
    let uniquePlayers = new Set<string>();
    
    // Обрабатываем данные о настроении
    moodStats.forEach(entry => {
      if (entry.mood && typeof entry.mood === 'number') {
        totalMood += entry.mood;
        moodCount++;
      }
      
      if (entry.energy && typeof entry.energy === 'number') {
        totalEnergy += entry.energy;
        moodCount++;
      }
      
      if (entry.playerId) {
        uniquePlayers.add(entry.playerId);
      }
    });
    
    // Обрабатываем данные о тестах
    testStats.forEach(entry => {
      if (entry.count && typeof entry.count === 'number') {
        totalTests += entry.count;
      }
      
      if (entry.playerId) {
        uniquePlayers.add(entry.playerId);
      }
    });
    
    // Сохраняем средние показатели
    setAveragePlayerStats({
      avgMood: moodCount ? +(totalMood / moodCount).toFixed(1) : 0,
      avgEnergy: moodCount ? +(totalEnergy / moodCount).toFixed(1) : 0,
      completedTests: totalTests,
      totalPlayers: uniquePlayers.size
    });
  };
  
  const processMoodData = () => {
    setMoodData(prepareMoodDataByTimeRange(moodEntries, timeRange));
  };
  
  const processTestData = () => {
    setTestData(prepareTestDataByTimeRange(testEntries, timeRange));
    setTestDistribution(prepareTestDistribution(testEntries));
  };
  
  const handlePlayerChange = (playerId: string | any) => {
    setSelectedPlayerId(playerId);
    
    // Обновляем URL с выбранным игроком
    const params = new URLSearchParams(location.search);
    params.set('playerId', playerId);
    navigate({
      pathname: location.pathname,
      search: params.toString()
    });
  };
  
  const handleTimeRangeChange = (value: "week" | "month" | "3months") => {
    setTimeRange(value);
  };

  // Для обычных пользователей показываем личную статистику
  if (!isStaff) {
    return (
      <PersonalStats
        moodData={moodData}
        testData={testData}
        testDistribution={testDistribution}
        moodEntries={moodEntries}
        testEntries={testEntries}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />
    );
  }
  
  // Для тренеров показываем другой интерфейс
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Статистика</h1>
        
        <Select 
          value={activeTab} 
          onValueChange={(value: "personal" | "players") => setActiveTab(value)}
        >
          <SelectTrigger className="w-[180px] bg-[#1C1F3B] border-[#293056] text-white">
            <SelectValue placeholder="Выберите режим" />
          </SelectTrigger>
          <SelectContent className="bg-[#1C1F3B] border-[#293056] text-white">
            <SelectItem value="personal">Статистика игрока</SelectItem>
            <SelectItem value="players">Общая статистика</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {activeTab === "personal" ? (
        // Показываем статистику выбранного игрока
        <div className="space-y-6">
          <div className="mb-4">
            <Select value={selectedPlayerId} onValueChange={handlePlayerChange}>
              <SelectTrigger className="w-[250px] bg-[#1C1F3B] border-[#293056] text-white">
                <SelectValue placeholder="Выберите игрока" />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1F3B] border-[#293056] text-white">
                {players.map((player) => (
                  <SelectItem key={player._id} value={player._id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {loadingPlayerStats ? (
            <div className="flex justify-center items-center py-20">
              <p className="text-white">Загрузка данных игрока...</p>
            </div>
          ) : loadingError ? (
            <div className="flex justify-center items-center py-20">
              <p className="text-red-500">{loadingError}</p>
            </div>
          ) : (
            <PersonalStats
              moodData={moodData}
              testData={testData}
              testDistribution={testDistribution}
              moodEntries={moodEntries}
              testEntries={testEntries}
              timeRange={timeRange}
              onTimeRangeChange={handleTimeRangeChange}
            />
          )}
        </div>
      ) : (
        // Показываем общую статистику всех игроков
        <PlayersStats
          playersMoodStats={playersMoodStats}
          playersTestStats={playersTestStats}
          averagePlayerStats={averagePlayerStats}
          players={players}
          selectedPlayerId={selectedPlayerId}
          onPlayerChange={handlePlayerChange}
          playerStatsData={playerStatsData}
          loadingPlayerStats={loadingPlayerStats}
          loadingPlayersData={loadingPlayersData}
          loadingError={loadingError}
        />
      )}
    </div>
  );
};

export default Statistics;
