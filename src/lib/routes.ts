// Константы для маршрутов в приложении
export const ROUTES = {
  // Публичные маршруты
  WELCOME: '/welcome',

  // Защищенные маршруты
  DASHBOARD: '/',
  MOOD_TRACKER: '/mood',
  TEST_TRACKER: '/tests',
  STATISTICS: '/stats',
  PROFILE: '/profile',
  TOP_PLAYERS: '/top-players',
  ANALYTICS: '/analytics',
  FILE_STORAGE: '/file-storage',
  
  // Маршруты для игроков
  BALANCE_WHEEL: '/balance-wheel',
  
  // Маршруты для сотрудников
  STAFF_BALANCE_WHEEL: '/staff-balance-wheel',
  PLAYERS_MANAGEMENT: '/players',
  
  // Служебные маршруты
  NOT_FOUND: '*',
};

export const isProtectedRoute = (path: string): boolean => {
  return path !== ROUTES.WELCOME && path !== ROUTES.NOT_FOUND;
};

export const isStaffRoute = (path: string): boolean => {
  return [
    ROUTES.STAFF_BALANCE_WHEEL,
    ROUTES.PLAYERS_MANAGEMENT
  ].includes(path);
};

export const isPlayerRoute = (path: string): boolean => {
  return [
    ROUTES.BALANCE_WHEEL
  ].includes(path);
};

export default ROUTES; 