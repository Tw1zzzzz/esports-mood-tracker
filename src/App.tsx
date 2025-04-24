import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./providers/ThemeProvider";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MoodTracker from "./pages/MoodTracker";
import TestTracker from "./pages/TestTracker";
import Statistics from "./pages/Statistics";
import BalanceWheel from "./pages/BalanceWheel";
import StaffBalanceWheel from "./pages/StaffBalanceWheel";
import TopPlayers from "./pages/TopPlayers";
import Analytics from "./pages/Analytics";
import NewAnalytics from "./pages/NewAnalytics";
import FileStorage from "./pages/FileStorage";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import PlayersManagement from "./pages/PlayersManagement";
import NotFound from "./pages/NotFound";
import ROUTES from "./lib/routes";

const queryClient = new QueryClient();

// Унифицированный компонент для защиты маршрутов с проверкой роли
interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const RouteGuard = ({ children, requiredRole }: RouteGuardProps) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  // Проверка на авторизацию
  if (!user) return <Navigate to={ROUTES.WELCOME} replace />;
  
  // Если указана обязательная роль и она не совпадает - перенаправляем
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path={ROUTES.WELCOME} element={<Index />} />
              
              <Route element={
                <RouteGuard>
                  <Layout />
                </RouteGuard>
              }>
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                <Route path={ROUTES.MOOD_TRACKER} element={<MoodTracker />} />
                <Route path={ROUTES.TEST_TRACKER} element={<TestTracker />} />
                <Route path={ROUTES.STATISTICS} element={<Statistics />} />
                
                <Route 
                  path={ROUTES.BALANCE_WHEEL} 
                  element={
                    <RouteGuard requiredRole="player">
                      <BalanceWheel />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path={ROUTES.STAFF_BALANCE_WHEEL} 
                  element={
                    <RouteGuard requiredRole="staff">
                      <StaffBalanceWheel />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path={ROUTES.TOP_PLAYERS} 
                  element={<TopPlayers />} 
                />
                
                <Route 
                  path={ROUTES.ANALYTICS} 
                  element={
                    <RouteGuard>
                      <Analytics />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path={ROUTES.FILE_STORAGE} 
                  element={<FileStorage />} 
                />
                
                <Route 
                  path={ROUTES.PROFILE} 
                  element={<Profile />} 
                />
                
                <Route 
                  path={ROUTES.PLAYERS_MANAGEMENT} 
                  element={
                    <RouteGuard requiredRole="staff">
                      <PlayersManagement />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path={ROUTES.NEW_ANALYTICS} 
                  element={<NewAnalytics />} 
                />
              </Route>
              
              <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
