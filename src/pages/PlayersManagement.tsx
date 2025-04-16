import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User } from "@/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getPlayers, deletePlayer as apiDeletePlayer } from "@/lib/api";
import { COLORS } from "@/styles/theme";

const PlayersManagement = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<User[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Загрузка списка игроков
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getPlayers();
        console.log('Received players:', response.data);
        setPlayers(response.data);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('Ошибка при загрузке игроков');
        toast.error('Не удалось загрузить список игроков');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleDeletePlayer = async () => {
    if (!selectedPlayer || !selectedPlayer.id) {
      console.error('Нет выбранного игрока или отсутствует ID игрока');
      toast.error("Не удалось удалить игрока: идентификатор игрока отсутствует");
      setIsDialogOpen(false);
      return;
    }
    
    setIsDeleting(true);
    let retryAttempt = 0;
    const maxRetries = 3;
    
    const attemptDelete = async (): Promise<boolean> => {
      try {
        console.log(`Попытка ${retryAttempt + 1} удаления игрока ${selectedPlayer.id}`);
        await apiDeletePlayer(selectedPlayer.id);
        console.log(`Игрок ${selectedPlayer.name} (${selectedPlayer.id}) успешно удален`);
        return true;
      } catch (error) {
        console.error(`Ошибка при удалении игрока (попытка ${retryAttempt + 1}):`, error);
        return false;
      }
    };
    
    try {
      let success = false;
      
      // Пробуем несколько раз, если не удалось с первого раза
      while (retryAttempt < maxRetries && !success) {
        success = await attemptDelete();
        
        if (success) {
          // Обновляем список игроков
          setPlayers(current => current.filter(p => p.id !== selectedPlayer.id));
          toast.success(`Игрок ${selectedPlayer.name} успешно удален`);
        } else {
          retryAttempt++;
          if (retryAttempt < maxRetries) {
            // Ждем перед следующей попыткой
            await new Promise(resolve => setTimeout(resolve, 1000 * retryAttempt));
          }
        }
      }
      
      if (!success) {
        toast.error(`Не удалось удалить игрока после ${maxRetries} попыток`);
      }
    } catch (error) {
      console.error('Ошибка при удалении игрока:', error);
      toast.error("Ошибка при удалении игрока. Попробуйте еще раз позже.");
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
      setSelectedPlayer(null);
    }
  };

  // Redirect if not staff
  if (user?.role !== "staff") {
    return (
      <div className="flex items-center justify-center h-full">
        <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
          <CardHeader>
            <CardTitle style={{ color: COLORS.textColor }}>Доступ запрещен</CardTitle>
            <CardDescription style={{ color: COLORS.textColorSecondary }}>
              Эта страница доступна только для персонала команды
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate("/")}
              style={{ 
                backgroundColor: COLORS.primary, 
                color: COLORS.textColor 
              }}
            >
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6" style={{ color: COLORS.textColor }}>Управление игроками</h1>
      
      <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
        <CardHeader>
          <CardTitle style={{ color: COLORS.textColor }}>Список игроков</CardTitle>
          <CardDescription style={{ color: COLORS.textColorSecondary }}>
            Управление профилями игроков и просмотр их статистики
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" style={{ color: COLORS.textColorSecondary }}>
              <p>Загрузка игроков...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8" style={{ color: COLORS.danger }}>
              <p>{error}</p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => window.location.reload()}
                style={{ borderColor: COLORS.borderColor, color: COLORS.primary }}
              >
                Попробовать снова
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: COLORS.borderColor }}>
                    <th className="px-4 py-2 text-left" style={{ color: COLORS.textColor }}>Имя</th>
                    <th className="px-4 py-2 text-left" style={{ color: COLORS.textColor }}>Email</th>
                    <th className="px-4 py-2 text-center" style={{ color: COLORS.textColor }}>Статистика</th>
                    <th className="px-4 py-2 text-right" style={{ color: COLORS.textColor }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => (
                    <tr key={player.id} className="border-b" style={{ borderColor: COLORS.borderColor }}>
                      <td className="px-4 py-4" style={{ color: COLORS.textColor }}>{player.name}</td>
                      <td className="px-4 py-4" style={{ color: COLORS.textColor }}>{player.email}</td>
                      <td className="px-4 py-4 text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/stats?playerId=${player.id}`)}
                          style={{ borderColor: COLORS.borderColor, color: COLORS.primary }}
                        >
                          Просмотр статистики
                        </Button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedPlayer(player);
                            setIsDialogOpen(true);
                          }}
                          style={{ backgroundColor: COLORS.danger, color: COLORS.textColor }}
                        >
                          Удалить
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {players.length === 0 && (
                    <tr key="empty-row">
                      <td colSpan={4} className="px-4 py-8 text-center" style={{ color: COLORS.textColorSecondary }}>
                        Нет доступных игроков
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.textColor }}>Подтвердите удаление</DialogTitle>
            <DialogDescription style={{ color: COLORS.textColorSecondary }}>
              Вы уверены, что хотите удалить игрока {selectedPlayer?.name}? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isDeleting}
              style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
            >
              Отмена
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePlayer}
              disabled={isDeleting}
              style={{ backgroundColor: COLORS.danger, color: COLORS.textColor }}
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayersManagement;
