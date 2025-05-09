import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Trophy, Crosshair, Target, Swords, TrendingUp, Medal, UsersRound, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Импорт API функций
import { 
  initFaceitOAuth, 
  checkFaceitStatus, 
  importFaceitMatches,
  getAnalyticsStats,
  getRecentMatches,
  saveAnalyticsMetrics
} from '@/lib/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#48C9B0'];

// Форматирование чисел с 2 знаками после запятой
const formatNumber = (num: number): string => {
  return Number(num).toFixed(2);
};

// Форматирование даты
const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'dd MMM yyyy', { locale: ru });
};

const NewAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [period, setPeriod] = useState<string>('week');
  const [faceitConnected, setFaceitConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [mood, setMood] = useState<number>(7);
  
  const { toast } = useToast();
  
  // Проверка статуса подключения Faceit
  useEffect(() => {
    const checkFaceit = async () => {
      try {
        const response = await checkFaceitStatus();
        setFaceitConnected(response.data.connected);
      } catch (error) {
        console.error('Ошибка при проверке статуса Faceit:', error);
        setFaceitConnected(false);
      }
    };
    
    checkFaceit();
  }, []);
  
  // Загрузка статистики
  useEffect(() => {
    const loadStats = async () => {
      if (!faceitConnected) return;
      
      setIsLoading(true);
      try {
        let fromDate, toDate;
        
        if (period === 'week') {
          fromDate = new Date();
          fromDate.setDate(fromDate.getDate() - 7);
          toDate = new Date();
        } else if (period === 'month') {
          fromDate = new Date();
          fromDate.setMonth(fromDate.getMonth() - 1);
          toDate = new Date();
        } else if (period === 'year') {
          fromDate = new Date();
          fromDate.setFullYear(fromDate.getFullYear() - 1);
          toDate = new Date();
        }
        
        const response = await getAnalyticsStats(
          fromDate?.toISOString().split('T')[0],
          toDate?.toISOString().split('T')[0]
        );
        
        setStatsData(response.data);
        
        // Загрузка последних матчей
        const matchesResponse = await getRecentMatches(10);
        setRecentMatches(matchesResponse.data.matches || []);
      } catch (error) {
        console.error('Ошибка при загрузке статистики:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить статистику',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, [faceitConnected, period, toast]);
  
  // Инициирование подключения к Faceit
  const handleConnectFaceit = async () => {
    try {
      const response = await initFaceitOAuth();
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Ошибка при подключении к Faceit:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось инициировать подключение к Faceit',
        variant: 'destructive'
      });
    }
  };
  
  // Импорт матчей с Faceit
  const handleImportMatches = async () => {
    setIsImporting(true);
    try {
      const response = await importFaceitMatches();
      toast({
        title: 'Успех',
        description: response.data.message,
        variant: 'default'
      });
      
      // Перезагрузка статистики
      const statsResponse = await getAnalyticsStats(
        period === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
        period === 'month' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      );
      
      setStatsData(statsResponse.data);
      
      // Загрузка последних матчей
      const matchesResponse = await getRecentMatches(10);
      setRecentMatches(matchesResponse.data.matches || []);
    } catch (error) {
      console.error('Ошибка при импорте матчей:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось импортировать матчи',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Сохранение метрик настроения
  const handleSaveMood = async () => {
    try {
      await saveAnalyticsMetrics({
        mood,
        balanceWheel: {
          health: 7,
          social: 8,
          skills: 6
        }
      });
      
      toast({
        title: 'Успех',
        description: 'Настроение сохранено',
        variant: 'default'
      });
    } catch (error) {
      console.error('Ошибка при сохранении настроения:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настроение',
        variant: 'destructive'
      });
    }
  };
  
  // Рендер страницы для неподключенного Faceit аккаунта
  if (!faceitConnected) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Аналитика</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Подключение к Faceit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Для использования аналитики необходимо подключить аккаунт Faceit. 
              Это позволит автоматически импортировать данные о ваших матчах и 
              анализировать вашу статистику.
            </p>
            <Button onClick={handleConnectFaceit}>
              Подключить Faceit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Аналитика</h1>
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Неделя</SelectItem>
              <SelectItem value="month">Месяц</SelectItem>
              <SelectItem value="year">Год</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleImportMatches} 
            disabled={isImporting}
            variant="outline"
          >
            {isImporting ? 'Импорт...' : 'Импорт матчей'}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="matches">Матчи</TabsTrigger>
          <TabsTrigger value="mood">Настроение</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Загрузка данных...</p>
          </div>
        ) : (
          <>
            <TabsContent value="overview">
              {statsData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Всего матчей
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Trophy className="h-5 w-5 text-muted-foreground mr-2" />
                        <span className="text-2xl font-bold">
                          {statsData.stats?.totalMatches || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Винрейт
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Target className="h-5 w-5 text-muted-foreground mr-2" />
                        <span className="text-2xl font-bold">
                          {formatNumber(statsData.stats?.winRate || 0)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Средний ELO
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Medal className="h-5 w-5 text-muted-foreground mr-2" />
                        <span className="text-2xl font-bold">
                          {Math.round(statsData.stats?.avgEloAfter || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Прирост ELO
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-muted-foreground mr-2" />
                        <span className="text-2xl font-bold">
                          {statsData.stats?.totalEloGain > 0 ? '+' : ''}
                          {statsData.stats?.totalEloGain || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <p>Нет данных для отображения</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Графики */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* График ELO */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Динамика ELO</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statsData?.chartsData?.eloHistory?.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={statsData.chartsData.eloHistory}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(date) => formatDate(date)} 
                            />
                            <YAxis />
                            <Tooltip 
                              formatter={(value) => [value, 'ELO']}
                              labelFormatter={(date) => formatDate(date)}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="elo"
                              stroke="#8884d8"
                              activeDot={{ r: 8 }}
                              name="ELO"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-center py-10">Нет данных для отображения</p>
                    )}
                  </CardContent>
                </Card>
                
                {/* График результатов матчей */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Результаты матчей</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statsData?.chartsData?.matchResults ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Победы', value: statsData.stats.wins },
                                { name: 'Поражения', value: statsData.stats.losses },
                                { name: 'Ничьи', value: statsData.stats.draws }
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {[
                                { name: 'Победы', value: statsData.stats.wins },
                                { name: 'Поражения', value: statsData.stats.losses },
                                { name: 'Ничьи', value: statsData.stats.draws }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'матчей']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-center py-10">Нет данных для отображения</p>
                    )}
                  </CardContent>
                </Card>
                
                {/* График настроения */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Динамика настроения</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statsData?.chartsData?.moodHistory?.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={statsData.chartsData.moodHistory}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(date) => formatDate(date)} 
                            />
                            <YAxis domain={[0, 10]} />
                            <Tooltip 
                              formatter={(value) => [value, 'Уровень']}
                              labelFormatter={(date) => formatDate(date)}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="mood"
                              stroke="#82ca9d"
                              activeDot={{ r: 8 }}
                              name="Настроение"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-center py-10">Нет данных для отображения</p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Колесо баланса */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Колесо баланса</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statsData?.chartsData?.balanceWheel ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart 
                            cx="50%" 
                            cy="50%" 
                            outerRadius="80%" 
                            data={Object.entries(statsData.chartsData.balanceWheel).map(([key, value]) => ({
                              subject: key.charAt(0).toUpperCase() + key.slice(1),
                              A: value
                            }))}
                          >
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} />
                            <Radar 
                              name="Баланс" 
                              dataKey="A" 
                              stroke="#8884d8" 
                              fill="#8884d8" 
                              fillOpacity={0.6} 
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-center py-10">Нет данных для отображения</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="matches">
              <Card>
                <CardHeader>
                  <CardTitle>Недавние матчи</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentMatches.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Дата</th>
                            <th className="text-left p-2">Карта</th>
                            <th className="text-left p-2">Результат</th>
                            <th className="text-left p-2">ELO до</th>
                            <th className="text-left p-2">ELO после</th>
                            <th className="text-left p-2">Изменение</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentMatches.map((match) => (
                            <tr key={match.id} className="border-b">
                              <td className="p-2">{formatDate(match.playedAt)}</td>
                              <td className="p-2">{match.map}</td>
                              <td className="p-2">
                                <span 
                                  className={
                                    match.result === 'win' 
                                      ? 'text-green-500' 
                                      : match.result === 'loss' 
                                        ? 'text-red-500' 
                                        : 'text-yellow-500'
                                  }
                                >
                                  {match.result === 'win' 
                                    ? 'Победа' 
                                    : match.result === 'loss' 
                                      ? 'Поражение' 
                                      : 'Ничья'}
                                </span>
                              </td>
                              <td className="p-2">{match.eloBefore}</td>
                              <td className="p-2">{match.eloAfter}</td>
                              <td className="p-2">
                                <span 
                                  className={
                                    match.eloChange > 0 
                                      ? 'text-green-500' 
                                      : match.eloChange < 0 
                                        ? 'text-red-500' 
                                        : ''
                                  }
                                >
                                  {match.eloChange > 0 ? '+' : ''}
                                  {match.eloChange}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center py-6">Нет данных о недавних матчах</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="mood">
              <Card>
                <CardHeader>
                  <CardTitle>Запись настроения</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="mb-2">Оцените ваше текущее настроение (от 1 до 10):</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                        <Button
                          key={value}
                          variant={mood === value ? "default" : "outline"}
                          onClick={() => setMood(value)}
                          className="w-10 h-10 p-0"
                        >
                          {value}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={handleSaveMood}>
                    Сохранить настроение
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default NewAnalytics; 