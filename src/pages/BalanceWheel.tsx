import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { BalanceWheel as BalanceWheelType } from "@/types";
import { ResponsiveRadar } from '@nivo/radar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveBalanceWheel, getMyBalanceWheels, getPlayerBalanceWheels, getPlayers } from "@/lib/api";
import { User } from "@/types";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { COLORS, COMPONENT_STYLES } from "@/styles/theme";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ru } from "date-fns/locale";

// Categories for the balance wheel
const categories = [
  { id: "physical", name: "Физическое здоровье", description: "Здоровье, энергия, активность" },
  { id: "emotional", name: "Эмоциональное состояние", description: "Управление эмоциями, стрессоустойчивость" },
  { id: "intellectual", name: "Интеллектуальное развитие", description: "Обучение, творчество, развитие навыков" },
  { id: "spiritual", name: "Духовное развитие", description: "Ценности, цели, смысл" },
  { id: "occupational", name: "Профессиональная сфера", description: "Карьера, достижения, реализация" },
  { id: "social", name: "Социальные отношения", description: "Семья, друзья, команда" },
  { id: "environmental", name: "Окружающая среда", description: "Жизненное пространство, комфорт" },
  { id: "financial", name: "Финансовое благополучие", description: "Доходы, сбережения, инвестиции" }
];

const BalanceWheel = () => {
  const { user } = useAuth();
  const isStaffView = user?.role === 'staff';
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [viewMode, setViewMode] = useState<"current" | "history">("current");
  const [isLoading, setIsLoading] = useState(false);
  const [savingWheel, setSavingWheel] = useState(false);
  const [players, setPlayers] = useState<User[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [usingTestData, setUsingTestData] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Initial values for each category
  const initialValues = {
    physical: 5,
    emotional: 5,
    intellectual: 5,
    spiritual: 5,
    occupational: 5,
    social: 5,
    environmental: 5,
    financial: 5
  };
  
  const [values, setValues] = useState(initialValues);
  const [wheels, setWheels] = useState<(BalanceWheelType & { _id?: string })[]>([]);
  
  // Загрузка списка игроков для сотрудников
  useEffect(() => {
    if (isStaffView) {
      const fetchPlayers = async () => {
        try {
          setLoadingPlayers(true);
          const response = await getPlayers();
          console.log("[DEBUG] Полученный список игроков:", response.data);
          
          if (response.data && Array.isArray(response.data)) {
            setPlayers(response.data);
            
            // Ищем специально игрока nbl
            const nblPlayer = response.data.find(p => p.name?.toLowerCase().includes('nbl'));
            if (nblPlayer) {
              console.log(`[DEBUG] Найден игрок nbl с ID: ${nblPlayer.id}`);
              setSelectedPlayer(nblPlayer.id);
            } else if (response.data.length > 0) {
              // Если nbl не найден, берем первого игрока
              console.log(`[DEBUG] Игрок nbl не найден, устанавливаем первого игрока с ID: ${response.data[0].id}`);
              setSelectedPlayer(response.data[0].id);
            }
          } else {
            console.error("[ERROR] Неверный формат данных игроков:", response.data);
            toast.error('Ошибка при загрузке игроков: неверный формат данных');
          }
        } catch (error) {
          console.error('[ERROR] Ошибка при загрузке игроков:', error);
          toast.error('Ошибка при загрузке игроков');
        } finally {
          setLoadingPlayers(false);
        }
      };
      
      fetchPlayers();
    }
  }, [isStaffView]);
  
  // Загрузка истории колес баланса
  useEffect(() => {
    const fetchBalanceWheels = async () => {
      try {
        setIsLoading(true);
        setUsingTestData(false);
        
        let response;
        if (isStaffView && selectedPlayer) {
          console.log(`[DEBUG] Загрузка колеса баланса для игрока с ID: ${selectedPlayer}`);
          response = await getPlayerBalanceWheels(selectedPlayer);
        } else {
          console.log(`[DEBUG] Загрузка моего колеса баланса`);
          response = await getMyBalanceWheels();
        }
        
        console.log(`[DEBUG] Полный ответ API:`, response);
        if (response && response.status === 200) {
          console.log(`[DEBUG] Успешный ответ API - статус ${response.status}`);
        } else {
          console.log(`[DEBUG] Неожиданный статус ответа API: ${response?.status}`);
        }
        
        // Добавляем больше логирования для понимания структуры данных
        if (response && response.data) {
          console.log(`[DEBUG] Тип response.data: ${typeof response.data}`);
          if (typeof response.data === 'object') {
            console.log(`[DEBUG] Ключи response.data:`, Object.keys(response.data));
            
            if (Array.isArray(response.data)) {
              console.log(`[DEBUG] response.data - это массив длиной ${response.data.length}`);
              if (response.data.length > 0) {
                console.log(`[DEBUG] Первый элемент массива:`, response.data[0]);
              }
            } else if (response.data.data) {
              console.log(`[DEBUG] response.data.data:`, response.data.data);
            } else {
              console.log(`[DEBUG] response.data не является массивом и не содержит поле data`);
            }
          }
        } else {
          console.log(`[DEBUG] response.data отсутствует или пусто`);
        }
        
        // Правильно извлекаем данные из ответа API
        let balanceWheels = [];
        
        if (response && response.data) {
          // Проверяем различные форматы ответа
          if (Array.isArray(response.data)) {
            balanceWheels = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            balanceWheels = response.data.data;
          } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
            // Возможно, это одиночная запись
            balanceWheels = [response.data];
          }
        }
        
        console.log(`[DEBUG] Извлеченные данные колес баланса:`, balanceWheels);
        console.log(`[DEBUG] Получены данные колес баланса: ${balanceWheels.length} записей`);
        
        if (balanceWheels && balanceWheels.length > 0) {
          // Проверяем, содержат ли данные все необходимые поля
          const validWheels = balanceWheels.filter((wheel: any) => 
            wheel && 
            (wheel.physical !== undefined || 
             wheel.emotional !== undefined || 
             wheel.intellectual !== undefined)
          );
          
          console.log(`[DEBUG] Число найденных валидных колес: ${validWheels.length}`);
          
          if (validWheels.length > 0) {
            // Выводим первое колесо для отладки
            console.log(`[DEBUG] Первое валидное колесо:`, validWheels[0]);
            
            const formattedWheels = validWheels.map((wheel: any) => ({
              id: wheel.id || wheel._id || `wheel-${Date.now()}-${Math.random()}`,
              userId: wheel.userId || user?.id || 'unknown',
              date: new Date(wheel.date || new Date()),
              physical: typeof wheel.physical === 'number' ? wheel.physical : 5,
              emotional: typeof wheel.emotional === 'number' ? wheel.emotional : 5,
              intellectual: typeof wheel.intellectual === 'number' ? wheel.intellectual : 5,
              spiritual: typeof wheel.spiritual === 'number' ? wheel.spiritual : 5,
              occupational: typeof wheel.occupational === 'number' ? wheel.occupational : 5,
              social: typeof wheel.social === 'number' ? wheel.social : 5,
              environmental: typeof wheel.environmental === 'number' ? wheel.environmental : 5,
              financial: typeof wheel.financial === 'number' ? wheel.financial : 5
            }));
            
            console.log(`[DEBUG] Отформатированные данные:`, formattedWheels);
            setWheels(formattedWheels);
            setUsingTestData(false);
            console.log(`[DEBUG] Данные успешно обработаны и установлены`);
            return;
          }
        }
        
        console.log(`[DEBUG] Нет валидных данных колеса баланса, создаем тестовые данные`);
        setUsingTestData(true);
        // Создаем тестовые данные только если реальных нет
        const testWheel = {
          id: `test-${Date.now()}`,
          userId: user?.id || 'unknown',
          date: new Date(),
          physical: Math.floor(Math.random() * 10) + 1,
          emotional: Math.floor(Math.random() * 10) + 1,
          intellectual: Math.floor(Math.random() * 10) + 1,
          spiritual: Math.floor(Math.random() * 10) + 1,
          occupational: Math.floor(Math.random() * 10) + 1,
          social: Math.floor(Math.random() * 10) + 1,
          environmental: Math.floor(Math.random() * 10) + 1,
          financial: Math.floor(Math.random() * 10) + 1
        };
        setWheels([testWheel as BalanceWheelType]);
      } catch (error) {
        console.error('[ERROR] Ошибка при загрузке колес баланса:', error);
        toast.error('Ошибка при загрузке истории колес баланса');
        setUsingTestData(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      if (!isStaffView || (isStaffView && selectedPlayer)) {
        fetchBalanceWheels();
      }
    }
  }, [user, isStaffView, selectedPlayer, refreshCount]);
  
  const handleSliderChange = (category: keyof typeof initialValues, value: number[]) => {
    setValues(prev => ({
      ...prev,
      [category]: value[0]
    }));
  };
  
  const handleSave = async () => {
    if (!user) {
      toast.error("Необходимо войти в систему");
      return;
    }
    
    try {
      setSavingWheel(true);
      
      const response = await saveBalanceWheel({
        date: new Date(date),
        physical: values.physical,
        emotional: values.emotional,
        intellectual: values.intellectual,
        spiritual: values.spiritual,
        occupational: values.occupational,
        social: values.social,
        environmental: values.environmental,
        financial: values.financial
      });
      
      // Добавляем новое колесо в список
      setWheels(prev => [
        {
          ...response.data,
          date: new Date(response.data.date)
        },
        ...prev
      ]);
      
      toast.success("Колесо баланса сохранено");
      
      // Reset form
      setValues(initialValues);
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error saving balance wheel:', error);
      toast.error("Ошибка при сохранении колеса баланса");
    } finally {
      setSavingWheel(false);
    }
  };
  
  // Format data for the radar chart
  const getChartData = (wheel: BalanceWheelType) => {
    return [
      {
        name: "Баланс",
        physical: wheel.physical,
        emotional: wheel.emotional,
        intellectual: wheel.intellectual,
        spiritual: wheel.spiritual,
        occupational: wheel.occupational,
        social: wheel.social,
        environmental: wheel.environmental,
        financial: wheel.financial
      }
    ];
  };
  
  // Get the latest wheel data
  const getLatestWheel = () => {
    if (wheels.length === 0) return null;
    return wheels[0]; // Колеса уже отсортированы по дате
  };

  // Get wheel history
  const getWheelHistory = () => {
    return wheels;
  };
  
  const latestWheel = getLatestWheel();
  const wheelHistory = getWheelHistory();
  const isStaff = user?.role === "staff";
  const canEdit = user?.role === "player";

  // Принудительное обновление данных
  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  // Loading states
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Необходимо войти в систему для доступа к этой странице</p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: COLORS.textColor }}>Колесо баланса</h2>
        </div>
        
        {isStaffView && (
          <div className="mb-4">
            <Label htmlFor="player-select" className="block text-sm font-medium mb-2" style={{ color: COLORS.textColor }}>
              Выберите игрока:
            </Label>
            <Select 
              value={selectedPlayer} 
              onValueChange={(value) => setSelectedPlayer(value)}
              disabled={loadingPlayers}
            >
              <SelectTrigger className="w-full" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, color: COLORS.textColor }}>
                <SelectValue placeholder="Выберите игрока" />
              </SelectTrigger>
              <SelectContent>
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id || ''}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Card className="mb-4" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
          <CardHeader>
            <CardTitle style={{ color: COLORS.textColor }}>
              {isStaffView ? 
                `Колесо баланса игрока` :
                "Заполните ваше колесо баланса"
              }
            </CardTitle>
            <CardDescription style={{ color: COLORS.textColorSecondary }}>
              {isStaffView ? 
                "Визуализация колеса баланса игрока" : 
                "Ваше текущее колесо баланса"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={viewMode} onValueChange={(value) => setViewMode(value as "current" | "history")}>
              <TabsList className="grid w-full grid-cols-2 mb-6" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
                <TabsTrigger value="current" 
                  style={{ 
                    color: viewMode === "current" ? COLORS.textColor : COLORS.textColorSecondary, 
                    backgroundColor: viewMode === "current" ? COLORS.primary : 'transparent'
                  }}
                >
                  Текущее состояние
                </TabsTrigger>
                <TabsTrigger value="history" 
                  style={{ 
                    color: viewMode === "history" ? COLORS.textColor : COLORS.textColorSecondary, 
                    backgroundColor: viewMode === "history" ? COLORS.primary : 'transparent'
                  }}
                >
                  История
                </TabsTrigger>
              </TabsList>

              <TabsContent value="current">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left column - Balance Wheel Form */}
                  <Card className={`${!canEdit ? "opacity-50 pointer-events-none" : ""}`}>
                    <CardHeader>
                      <CardTitle>Заполните ваше колесо баланса</CardTitle>
                      <CardDescription>
                        Оцените каждую область вашей жизни на данный момент
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="date">Дата</Label>
                        <Input
                          id="date"
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          disabled={!canEdit || savingWheel}
                        />
                      </div>
                      
                      {categories.map((category) => (
                        <div key={category.id} className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor={category.id}>{category.name}</Label>
                            <span className="text-sm font-medium">
                              {values[category.id as keyof typeof values]}/10
                            </span>
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-sm text-muted-foreground hover:underline">
                                Что это значит?
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="right">
                              <p className="text-sm">{category.description}</p>
                            </PopoverContent>
                          </Popover>
                          <Slider
                            id={category.id}
                            min={1}
                            max={10}
                            step={1}
                            value={[values[category.id as keyof typeof values]]}
                            onValueChange={(value) => handleSliderChange(category.id as keyof typeof values, value)}
                            disabled={!canEdit || savingWheel}
                          />
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={handleSave} 
                        className="w-full" 
                        disabled={!canEdit || savingWheel}
                        style={{ backgroundColor: COLORS.primary, color: COLORS.textColor }}
                      >
                        {savingWheel ? "Сохранение..." : "Сохранить"}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Right column - Current Wheel Visualization */}
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {isStaff ? (
                          selectedPlayer ? 
                            `Колесо баланса игрока` : 
                            "Выберите игрока"
                        ) : (
                          "Ваше текущее колесо баланса"
                        )}
                      </CardTitle>
                      <CardDescription>
                        {latestWheel ? (
                          `Последнее обновление: ${latestWheel.date.toLocaleDateString()}`
                        ) : (
                          isLoading ? "Загрузка..." : "Нет данных"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[900px] p-0">
                      {isLoading ? (
                        <p>Загрузка данных...</p>
                      ) : latestWheel ? (
                        <ResponsiveRadar
                          data={getChartData(latestWheel)}
                          keys={categories.map(c => c.id)}
                          indexBy="name"
                          maxValue={10}
                          margin={{ top: 120, right: 120, bottom: 120, left: 120 }}
                          borderColor={{ from: 'color', modifiers: [['darker', 0.6]] }}
                          gridLabelOffset={40}
                          dotSize={16}
                          dotColor={{ theme: 'background' }}
                          dotBorderWidth={3}
                          colors={{ scheme: 'category10' }}
                          blendMode="multiply"
                          motionConfig="wobbly"
                          gridLevels={5}
                          legends={[
                            {
                              anchor: 'top',
                              direction: 'row',
                              translateX: 0,
                              translateY: -100,
                              itemWidth: 120,
                              itemHeight: 24,
                              itemTextColor: COLORS.textColor,
                              itemDirection: 'left-to-right',
                              itemOpacity: 1,
                              symbolSize: 18,
                              symbolShape: 'circle',
                              effects: [
                                {
                                  on: 'hover',
                                  style: {
                                    itemTextColor: COLORS.primary,
                                    itemOpacity: 0.9
                                  }
                                }
                              ]
                            }
                          ]}
                        />
                      ) : (
                        <div className="text-center">
                          <p>Нет данных для отображения</p>
                          {canEdit && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Заполните форму слева, чтобы создать ваше первое колесо баланса
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {isStaff ? (
                        selectedPlayer ? 
                          `История колес баланса игрока` : 
                          "Выберите игрока"
                      ) : (
                        "Ваша история колес баланса"
                      )}
                    </CardTitle>
                    <CardDescription>
                      {isLoading ? (
                        "Загрузка истории..."
                      ) : wheelHistory.length > 0 ? (
                        `Всего записей: ${wheelHistory.length}`
                      ) : (
                        "Нет истории"
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <p>Загрузка истории...</p>
                      </div>
                    ) : wheelHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <p>Нет истории колес баланса</p>
                        {canEdit && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Заполните форму на вкладке "Текущее состояние", чтобы создать ваше первое колесо баланса
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {wheelHistory.map((wheel) => (
                          <Card key={wheel.id || `wheel-${wheel._id || Math.random()}`} className="overflow-hidden">
                            <CardHeader className="p-4">
                              <CardTitle className="text-sm font-medium">
                                {wheel.date.toLocaleDateString()}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="h-48">
                                <ResponsiveRadar
                                  data={getChartData(wheel)}
                                  keys={categories.map(c => c.id)}
                                  indexBy="name"
                                  maxValue={10}
                                  margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
                                  borderColor={{ from: 'color' }}
                                  gridLabelOffset={12}
                                  dotSize={4}
                                  dotColor={{ theme: 'background' }}
                                  dotBorderWidth={1}
                                  colors={{ scheme: 'category10' }}
                                  blendMode="multiply"
                                  motionConfig="wobbly"
                                  enableDots={false}
                                  enableDotLabel={false}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BalanceWheel;
