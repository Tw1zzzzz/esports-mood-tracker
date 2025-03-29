
import { Link, useLocation } from "react-router-dom";
import { BarChart2, Calendar, Home, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
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
];

const Sidebar = () => {
  const location = useLocation();

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
      <div className="p-4 text-sm text-white/50">
        <p>© 2023 eSports Tracker</p>
      </div>
    </aside>
  );
};

export default Sidebar;
