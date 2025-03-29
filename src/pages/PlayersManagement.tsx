
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User } from "@/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Mock data - in a real app this would come from an API
const MOCK_PLAYERS: User[] = [
  {
    id: "player1",
    email: "player1@example.com",
    name: "Игрок 1",
    role: "player"
  },
  {
    id: "player2",
    email: "player2@example.com",
    name: "Игрок 2",
    role: "player"
  },
  {
    id: "player3",
    email: "player3@example.com",
    name: "Игрок 3",
    role: "player"
  }
];

const PlayersManagement = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<User[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, this would be an API call
    setPlayers(MOCK_PLAYERS);
  }, []);

  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return;
    
    setIsDeleting(true);
    
    try {
      // In a real app, this would be an API call
      setPlayers(current => current.filter(p => p.id !== selectedPlayer.id));
      toast.success(`Игрок ${selectedPlayer.name} удален`);
    } catch (error) {
      toast.error("Ошибка при удалении игрока");
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Доступ запрещен</CardTitle>
            <CardDescription>
              Эта страница доступна только для персонала команды
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/")}>
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Управление игроками</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Список игроков</CardTitle>
          <CardDescription>
            Управление профилями игроков и просмотр их статистики
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Имя</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-center">Статистика</th>
                  <th className="px-4 py-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id} className="border-b">
                    <td className="px-4 py-4">{player.name}</td>
                    <td className="px-4 py-4">{player.email}</td>
                    <td className="px-4 py-4 text-center">
                      <Button variant="outline" size="sm">
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
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))}

                {players.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Нет доступных игроков
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердите удаление</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить игрока {selectedPlayer?.name}? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlayer}
              disabled={isDeleting}
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
