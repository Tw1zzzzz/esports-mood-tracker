import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NotificationsPanel from "./NotificationsPanel";
import SyncStatusIndicator from "./SyncStatusIndicator";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { COLORS } from "@/styles/theme";
// Импортируем логотипы
import logoSvg from "@/assets/1win-logo.svg";

const Header = () => {
  const { user } = useAuth();

  // Стили для хедера
  const headerStyles = {
    backgroundColor: COLORS.cardBackground,
    borderBottomColor: COLORS.borderColor,
    color: COLORS.textColor
  };

  // Стиль для логотипа 1win с увеличенным размером
  const logoStyle = {
    height: '4.5rem',
    maxWidth: '220px',
    objectFit: 'contain' as const,
    borderRadius: '8px',
    padding: '4px',
    background: 'rgba(29, 140, 248, 0.08)',
    border: '1px solid rgba(0, 0, 0, 0.3)',
    boxShadow: '0px 0px 3px rgba(0, 0, 0, 0.2)'
  };

  return (
    <header className="p-4 flex justify-between items-center border-b" style={headerStyles}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center gap-4">
          <img 
            src={logoSvg} 
            alt="1WIN Logo" 
            style={logoStyle}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {user && <SyncStatusIndicator />}
        <NotificationsPanel />
        <Separator orientation="vertical" className="h-8" style={{ backgroundColor: COLORS.borderColor }} />
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Настройки"
          style={{ color: COLORS.textColorSecondary }}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Avatar>
          <AvatarFallback style={{ backgroundColor: COLORS.primary, color: COLORS.textColor }}>
            {user?.name?.substring(0, 2).toUpperCase() || "ES"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default Header;
