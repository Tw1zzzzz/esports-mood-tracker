import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

/**
 * Интерфейс состояния профиля
 */
interface ProfileState {
  isDeleting: boolean;
  isDialogOpen: boolean;
}

/**
 * Компонент страницы профиля пользователя
 * Отображает данные профиля и предоставляет возможность удаления аккаунта
 */
const Profile: React.FC = () => {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  
  // Объединение связанных состояний в один объект
  const [state, setState] = useState<ProfileState>({
    isDeleting: false,
    isDialogOpen: false
  });

  /**
   * Обработчик для изменения состояния диалога
   */
  const handleDialogChange = (open: boolean): void => {
    setState(prevState => ({ ...prevState, isDialogOpen: open }));
  };

  /**
   * Обработчик удаления аккаунта пользователя
   */
  const handleDeleteAccount = async (): Promise<void> => {
    // Устанавливаем состояние удаления
    setState(prevState => ({ ...prevState, isDeleting: true }));
    
    try {
      await deleteAccount();
      // После успешного удаления перенаправляем на страницу входа
      navigate("/login");
    } catch (error) {
      console.error("Ошибка при удалении аккаунта:", error);
    } finally {
      // Сбрасываем состояния независимо от результата
      setState({ isDeleting: false, isDialogOpen: false });
    }
  };

  /**
   * Компонент для неавторизованных пользователей
   */
  const UnauthenticatedView = () => (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Требуется авторизация</CardTitle>
          <CardDescription>
            Для доступа к профилю необходимо войти в систему
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Войти
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  // Если пользователь не авторизован, показываем соответствующий компонент
  if (!user) {
    return <UnauthenticatedView />;
  }

  const { isDeleting, isDialogOpen } = state;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Профиль пользователя</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Карточка с информацией о профиле */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о профиле</CardTitle>
            <CardDescription>
              Ваши персональные данные
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <div className="p-2 bg-muted rounded">{user.name}</div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="p-2 bg-muted rounded">{user.email}</div>
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <div className="p-2 bg-muted rounded">
                {user.role === "player" ? "Игрок" : "Стафф"}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {/* Диалог подтверждения удаления аккаунта */}
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button variant="destructive">Удалить аккаунт</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Вы уверены?</DialogTitle>
                  <DialogDescription>
                    Эта операция безвозвратно удалит ваш аккаунт и все связанные данные.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleDialogChange(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Удаление..." : "Удалить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
        
        {/* Карточка со статистикой */}
        <Card>
          <CardHeader>
            <CardTitle>Статистика</CardTitle>
            <CardDescription>
              Сводка вашей активности
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded">
              <p className="text-sm">Эта секция будет содержать вашу персональную статистику.</p>
            </div>
            {/* Дополнительная статистика может быть добавлена здесь */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
