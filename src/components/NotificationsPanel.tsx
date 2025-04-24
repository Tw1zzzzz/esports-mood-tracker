import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Notification {
  id: string;
  title: string;
  description: string;
  date: Date;
  read: boolean;
}

// Mock уведомления - в реальном приложении должны приходить с API/БД
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Новый тест доступен",
    description: "У вас есть новый тест для прохождения",
    date: new Date("2023-10-15"),
    read: false
  },
  {
    id: "2",
    title: "Обновление статистики",
    description: "Ваши результаты были обновлены",
    date: new Date("2023-10-14"),
    read: true
  },
  {
    id: "3",
    title: "Напоминание",
    description: "Не забудьте заполнить колесо баланса за этот месяц",
    date: new Date("2023-10-10"),
    read: true
  }
];

/**
 * Компонент панели уведомлений с выпадающим меню
 */
const NotificationsPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [open, setOpen] = useState<boolean>(false);
  
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  /**
   * Обработчик для пометки всех уведомлений как прочитанных
   */
  const handleMarkAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };
  
  /**
   * Обработчик для пометки одного уведомления как прочитанного
   */
  const handleMarkAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  /**
   * Форматирование даты в локализованный формат
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };
  
  /**
   * Рендерит отдельное уведомление
   */
  const renderNotification = (notification: Notification) => (
    <Card 
      key={notification.id} 
      className={`border-0 rounded-none ${!notification.read ? "bg-muted/10" : ""}`}
    >
      <CardContent 
        className="p-4 hover:bg-muted/30 cursor-pointer"
        onClick={() => handleMarkAsRead(notification.id)}
      >
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-sm">{notification.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {notification.description}
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            {formatDate(notification.date)}
          </Badge>
        </div>
        
        {!notification.read && (
          <div className="mt-2 flex justify-end">
            <div className="h-2 w-2 bg-primary rounded-full"></div>
          </div>
        )}
      </CardContent>
      <Separator />
    </Card>
  );
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative" 
          aria-label="Уведомления"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 bg-muted/20">
          <h3 className="font-medium">Уведомления</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Отметить все как прочитанные
            </Button>
          )}
        </div>
        
        <Separator />
        
        <ScrollArea className="h-80">
          {notifications.length > 0 ? (
            <div>
              {notifications.map(renderNotification)}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Нет новых уведомлений
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPanel;
