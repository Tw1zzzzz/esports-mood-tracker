import { useState } from "react";
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

// Mock notifications - in a real app would come from an API/database
const MOCK_NOTIFICATIONS = [
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

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Уведомления">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
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
              {notifications.map((notification) => (
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
              ))}
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
