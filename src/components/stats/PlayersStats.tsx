import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MoodChart from "@/components/charts/MoodChart";
import TestChart from "@/components/charts/TestChart";
import TestDistributionChart from "@/components/charts/TestDistributionChart";
import { prepareTestDistribution } from "@/utils/statsUtils";

interface PlayersStatsProps {
  playersMoodStats: any[];
  playersTestStats: any[];
  averagePlayerStats: {
    avgMood: number;
    avgEnergy: number;
    completedTests: number;
    totalPlayers: number;
  };
  players: any[];
  selectedPlayerId: string;
  onPlayerChange: (playerId: string) => void;
  playerStatsData: any;
  loadingPlayerStats: boolean;
  loadingPlayersData: boolean;
  loadingError: string | null;
}

/**
 * Компонент для отображения статистики по игрокам (режим тренера)
 */
const PlayersStats = ({
  playersMoodStats,
  playersTestStats,
  averagePlayerStats,
  players,
  selectedPlayerId,
  onPlayerChange,
  playerStatsData,
  loadingPlayerStats,
  loadingPlayersData,
  loadingError
}: PlayersStatsProps) => {
  const [statsView, setStatsView] = useState<"mood" | "tests">("mood");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Общая статистика игроков</CardTitle>
            <CardDescription>Средние показатели настроения и энергии игроков</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Среднее настроение</p>
                <p className="text-2xl font-bold">{averagePlayerStats.avgMood.toFixed(1)}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Средняя энергия</p>
                <p className="text-2xl font-bold">{averagePlayerStats.avgEnergy.toFixed(1)}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Выполнено тестов</p>
                <p className="text-2xl font-bold">{averagePlayerStats.completedTests}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Всего игроков</p>
                <p className="text-2xl font-bold">{averagePlayerStats.totalPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Select value={statsView} onValueChange={(value: "mood" | "tests") => setStatsView(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Выберите тип статистики" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mood">Настроение</SelectItem>
            <SelectItem value="tests">Тесты</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loadingPlayersData ? (
        <div className="flex justify-center items-center py-20">
          <p>Загрузка данных...</p>
        </div>
      ) : loadingError ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-danger">{loadingError}</p>
        </div>
      ) : statsView === "mood" ? (
        <Card>
          <CardHeader>
            <CardTitle>Статистика настроения игроков</CardTitle>
            <CardDescription>Средние показатели настроения и энергии по всем игрокам</CardDescription>
          </CardHeader>
          <CardContent>
            <MoodChart data={playersMoodStats} height={400} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Статистика тестов игроков</CardTitle>
            <CardDescription>Результаты тестов игроков по типам</CardDescription>
          </CardHeader>
          <CardContent>
            <TestChart data={playersTestStats} height={400} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Статистика игрока</CardTitle>
            <CardDescription>Подробная статистика по выбранному игроку</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select value={selectedPlayerId} onValueChange={onPlayerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите игрока" />
                </SelectTrigger>
                <SelectContent>
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
                <p>Загрузка данных игрока...</p>
              </div>
            ) : !playerStatsData ? (
              <div className="flex justify-center items-center py-20">
                <p>Выберите игрока для просмотра статистики</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Настроение и энергия</h3>
                  <MoodChart data={playerStatsData.moodStats || []} height={300} />
                </div>
                {playerStatsData.testStats && playerStatsData.testStats.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Результаты тестов</h3>
                    <TestChart data={playerStatsData.testStats || []} height={300} />
                  </div>
                )}
                {playerStatsData.testEntries && playerStatsData.testEntries.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Распределение типов тестов</h3>
                    <TestDistributionChart 
                      data={prepareTestDistribution(playerStatsData.testEntries || [])} 
                      height={300} 
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlayersStats; 