
import { Link, useLocation } from "react-router-dom";
import { BarChart2, Calendar, Home, ListTodo, User, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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
      title: "Колесо баланса",
      href: "/balance-wheel",
      icon: Users,
    },
  ];

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

  return (
    <aside className="bg-esports-blue text-white h-screen w-64 flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold">eSports Tracker</h2>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {user && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-white/70 hover:text-white hover:bg-white/10 w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Выход</span>
          </button>
        </div>
      )}
      <div className="p-4 text-sm text-white/50">
        <p>© 2023 eSports Tracker</p>
      </div>
    </aside>
  );
};

export default Sidebar;
