import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoodEntry, TestEntry, StatsData } from "@/types";
import MoodChart from "@/components/charts/MoodChart";
import TestChart from "@/components/charts/TestChart";
import TestDistributionChart from "@/components/charts/TestDistributionChart";
import { getMoodByDayOfWeek, getTestsByDayOfWeek, timeRangeLabel, prepareTestDistribution } from "@/utils/statsUtils";

interface PersonalStatsProps {
  moodData: StatsData[];
  testData: any[];
  testDistribution: any[];
  moodEntries: MoodEntry[];
  testEntries: TestEntry[];
  timeRange: "week" | "month" | "3months";
  onTimeRangeChange: (value: "week" | "month" | "3months") => void;
}

/**
 * Компонент для отображения личной статистики пользователя
 */
const PersonalStats = ({
  moodData,
  testData,
  testDistribution,
  moodEntries,
  testEntries,
  timeRange,
  onTimeRangeChange
}: PersonalStatsProps) => {
  // Получаем данные о настроении по дням недели
  const moodByDayOfWeek = getMoodByDayOfWeek(moodEntries);
  
  // Получаем данные о тестах по дням недели
  const testsByDayOfWeek = getTestsByDayOfWeek(testEntries);
  
  // Расчет общих показателей
  const getAverageStats = () => {
    let totalMood = 0;
    let totalEnergy = 0;
    let count = 0;
    
    moodData.forEach(entry => {
      if (entry.mood > 0) {
        totalMood += entry.mood;
        totalEnergy += entry.energy;
        count++;
      }
    });
    
    return {
      avgMood: count ? +(totalMood / count).toFixed(1) : 0,
      avgEnergy: count ? +(totalEnergy / count).toFixed(1) : 0
    };
  };
  
  // Получаем среднее количество выполненных тестов
  const getCompletedTests = () => {
    const testTypes = [...new Set(testEntries.map(t => t.type))];
    let results: Record<string, { count: number, avgScore: number }> = {};
    
    testTypes.forEach(type => {
      const typeTests = testEntries.filter(t => t.type === type);
      const totalScore = typeTests.reduce((sum, test) => sum + test.score, 0);
      
      results[type] = {
        count: typeTests.length,
        avgScore: typeTests.length ? +(totalScore / typeTests.length).toFixed(1) : 0
      };
    });
    
    return {
      total: testEntries.length,
      types: results
    };
  };
  
  const avgStats = getAverageStats();
  const completedTests = getCompletedTests();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Общая статистика</CardTitle>
            <CardDescription>Ваши средние показатели настроения и энергии</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Среднее настроение</p>
                <p className="text-2xl font-bold">{avgStats.avgMood}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Средняя энергия</p>
                <p className="text-2xl font-bold">{avgStats.avgEnergy}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Выполнено тестов</p>
                <p className="text-2xl font-bold">{completedTests.total}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Дней активности</p>
                <p className="text-2xl font-bold">{
                  [...new Set(moodEntries.map(entry => entry.date.split('T')[0]))].length
                }</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Select value={timeRange} onValueChange={(value: "week" | "month" | "3months") => onTimeRangeChange(value)}>
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

      <Tabs defaultValue="mood">
        <TabsList className="mb-4">
          <TabsTrigger value="mood">Настроение</TabsTrigger>
          <TabsTrigger value="tests">Тесты</TabsTrigger>
          <TabsTrigger value="analysis">Анализ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mood">
          <Card>
            <CardHeader>
              <CardTitle>Динамика настроения и энергии {timeRangeLabel(timeRange)}</CardTitle>
              <CardDescription>График изменения среднего настроения и энергии по дням</CardDescription>
            </CardHeader>
            <CardContent>
              <MoodChart data={moodData} height={400} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tests">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Результаты тестов {timeRangeLabel(timeRange)}</CardTitle>
                <CardDescription>График средних результатов тестов по типам</CardDescription>
              </CardHeader>
              <CardContent>
                <TestChart data={testData} height={300} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Распределение типов тестов</CardTitle>
                <CardDescription>Соотношение различных типов тестов</CardDescription>
              </CardHeader>
              <CardContent>
                <TestDistributionChart 
                  data={testDistribution.length > 0 ? testDistribution : prepareTestDistribution(testEntries)} 
                  height={300} 
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Настроение по дням недели</CardTitle>
                <CardDescription>Средние показатели по каждому дню недели</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2">День недели</th>
                        <th className="text-center p-2">Настроение</th>
                        <th className="text-center p-2">Энергия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moodByDayOfWeek.map((day, idx) => (
                        <tr key={day.day} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                          <td className="p-2">{day.day}</td>
                          <td className="text-center p-2">{day.mood}</td>
                          <td className="text-center p-2">{day.energy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Тесты по дням недели</CardTitle>
                <CardDescription>Среднее количество тестов по дням недели</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2">День недели</th>
                        <th className="text-center p-2">Кол-во тестов</th>
                        <th className="text-center p-2">Средний результат</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testsByDayOfWeek.map((day, idx) => (
                        <tr key={day.day} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                          <td className="p-2">{day.day}</td>
                          <td className="text-center p-2">{day.count}</td>
                          <td className="text-center p-2">{day.average}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonalStats; 