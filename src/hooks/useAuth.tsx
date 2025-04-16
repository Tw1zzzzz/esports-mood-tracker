import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { toast } from "sonner";
import { makeAuthRequest, handleApiError } from "@/utils/apiUtils";
import ROUTES from "@/lib/routes";

// Задаем базовый URL для API
const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

// Типы для аутентификации
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User | null; error?: string }>;
  register: (name: string, email: string, password: string, role?: string) => Promise<{ success: boolean; user?: User | null; error?: string }>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
}

interface AuthResponse {
  token: string;
  user: User;
}

// Создание контекста
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Проверка сессии пользователя
  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      try {
        const userData = await makeAuthRequest<User>('get', '/auth/me');
        setUser(userData);
      } catch (error: any) {
        localStorage.removeItem("token");
        setUser(null);
        
        if (error.response?.status === 401) {
          toast.error("Сессия истекла. Пожалуйста, войдите снова.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkUserSession();
  }, []);

  // Функция входа
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeAuthRequest<AuthResponse>('post', '/auth/login', { email, password });
      
      localStorage.setItem('token', response.token);
      setUser(response.user);
      
      toast.success(`Добро пожаловать, ${response.user.name}!`);
      return { success: true, user: response.user };
    } catch (error: any) {
      const errorMsg = handleApiError(error, 'Ошибка при входе');
      setError(errorMsg);
      toast.error(errorMsg);
      
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Функция регистрации
  const register = async (name: string, email: string, password: string, role: string = 'player') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeAuthRequest<AuthResponse>('post', '/auth/register', { 
        name, email, password, role 
      });
      
      localStorage.setItem('token', response.token);
      setUser(response.user);
      
      toast.success(`Аккаунт успешно создан! Добро пожаловать, ${response.user.name}!`);
      return { success: true, user: response.user };
    } catch (error: any) {
      const errorMsg = handleApiError(error, 'Ошибка при регистрации');
      setError(errorMsg);
      toast.error(errorMsg);
      
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Функция выхода
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Вы вышли из системы");
  };

  // Функция удаления аккаунта
  const deleteAccount = async () => {
    try {
      setLoading(true);
      await makeAuthRequest('delete', '/auth/me');
      logout();
      toast.success("Аккаунт успешно удален");
    } catch (error: any) {
      const errorMsg = handleApiError(error, 'Ошибка удаления аккаунта');
      toast.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
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
