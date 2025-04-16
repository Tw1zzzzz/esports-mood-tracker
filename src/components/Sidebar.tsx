import { Link, useLocation } from "react-router-dom";
import { BarChart2, Calendar, Home, ListTodo, User, Users, LogOut, CircleDot, Trophy, BarChart, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { COLORS } from "@/styles/theme";

const getNavItems = (role: "player" | "staff" | null) => {
  const baseItems = [
    {
      title: "Обзор",
      href: "/",
      icon: Home,
    },
    {
      title: "Настроение и Энергия",
      href: "/mood",
      icon: Calendar,
    },
    {
      title: "Тесты",
      href: "/tests",
      icon: ListTodo,
    },
    {
      title: "Статистика",
      href: "/stats",
      icon: BarChart2,
    },
    {
      title: "Аналитика",
      href: "/analytics",
      icon: BarChart,
    },
  ];

  // Add balance wheel but with different paths based on role
  if (role === "player") {
    baseItems.push({
      title: "Колесо баланса",
      href: "/balance-wheel",
      icon: CircleDot,
    });
  } else if (role === "staff") {
    baseItems.push({
      title: "Колесо баланса",
      href: "/staff-balance-wheel",
      icon: CircleDot,
    });
  }
  
  // Add items for both roles
  if (role) { // Доступно для всех аутентифицированных пользователей
    baseItems.push({
      title: "Топ игроков",
      href: "/top-players",
      icon: Trophy,
    });
    
    // Добавляем пункт Файловое хранилище для всех аутентифицированных пользователей
    baseItems.push({
      title: "Файловое хранилище",
      href: "/file-storage",
      icon: FolderOpen,
    });
  }

  // Add staff-only items
  if (role === "staff") {
    baseItems.push({
      title: "Управление игроками",
      href: "/players",
      icon: Users,
    });
  }

  // Add profile item for authenticated users
  if (role) {
    baseItems.push({
      title: "Профиль",
      href: "/profile",
      icon: User,
    });
  }

  return baseItems;
};

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navItems = getNavItems(user?.role || null);

  // Стили для сайдбара
  const sidebarStyles = {
    backgroundColor: COLORS.backgroundColor,
    color: COLORS.textColor,
    borderRight: `1px solid ${COLORS.borderColor}`
  };

  // Стили для активного и неактивного пункта меню
  const getButtonStyles = (isActive: boolean) => ({
    backgroundColor: isActive ? COLORS.primary + "20" : "transparent",
    color: isActive ? COLORS.primary : COLORS.textColorSecondary,
    ":hover": {
      backgroundColor: COLORS.primary + "10",
      color: COLORS.textColor
    }
  });

  return (
    <aside className="h-screen w-64 flex flex-col" style={sidebarStyles}>
      <div className="p-6">
        <h2 className="text-xl font-bold font-heading" style={{ color: COLORS.primary }}>eSports Tracker</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <nav className="px-4 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link to={item.href} className="block">
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start h-10",
                              isActive 
                                ? "text-primary" 
                                : "text-secondary hover:text-primary-foreground"
                            )}
                            style={{
                              backgroundColor: isActive ? COLORS.primary + "20" : "transparent",
                              color: isActive ? COLORS.primary : COLORS.textColorSecondary
                            }}
                          >
                            <item.icon className="mr-2 h-5 w-5" />
                            <span>{item.title}</span>
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" style={{
                        backgroundColor: COLORS.cardBackground,
                        color: COLORS.textColor,
                        borderColor: COLORS.borderColor
                      }}>
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>
      
      {user && (
        <>
          <Separator className="my-2" style={{ backgroundColor: COLORS.borderColor }} />
          <div className="p-4">
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full justify-start"
              style={{ color: COLORS.textColorSecondary }}
            >
              <LogOut className="mr-2 h-5 w-5" />
              <span>Выход</span>
            </Button>
          </div>
        </>
      )}
      
      <div className="p-4 text-sm" style={{ color: COLORS.textColorSecondary }}>
        <p>© 2023 eSports Tracker</p>
      </div>
    </aside>
  );
};

export default Sidebar;
