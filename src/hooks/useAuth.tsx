import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: "player" | "staff") => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
}

// Mock users for demonstration
const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "player@example.com",
    name: "Test Player",
    role: "player"
  },
  {
    id: "2", 
    email: "staff@example.com",
    name: "Test Staff",
    role: "staff"
  }
];

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Mock login - in a real app, this would be an API call
      const foundUser = MOCK_USERS.find(u => u.email === email);
      
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem("user", JSON.stringify(foundUser));
        toast.success("Успешный вход в систему");
        return;
      }
      
      throw new Error("Неверные учетные данные");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка входа");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: "player" | "staff") => {
    try {
      setLoading(true);
      // Mock registration - in a real app, this would be an API call
      const existingUser = MOCK_USERS.find(u => u.email === email);
      
      if (existingUser) {
        throw new Error("Пользователь с таким email уже существует");
      }
      
      const newUser: User = {
        id: Math.random().toString(36).substring(7),
        email,
        name,
        role
      };
      
      // In a real app, we'd save this to a database
      MOCK_USERS.push(newUser);
      
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      toast.success("Регистрация успешна");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка регистрации");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Выход выполнен успешно");
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      // Mock delete account - in a real app, this would be an API call
      if (!user) {
        throw new Error("Пользователь не найден");
      }
      
      // In a real app, we'd delete from the database
      const index = MOCK_USERS.findIndex(u => u.id === user.id);
      if (index !== -1) {
        MOCK_USERS.splice(index, 1);
      }
      
      localStorage.removeItem("user");
      setUser(null);
      toast.success("Аккаунт успешно удален");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка удаления аккаунта");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        register, 
        logout, 
        deleteAccount 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
