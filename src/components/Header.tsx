import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NotificationsPanel from "./NotificationsPanel";
import SyncStatusIndicator from "./SyncStatusIndicator";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { COLORS } from "@/styles/theme";

const Header = () => {
  const { user } = useAuth();

  // Стили для хедера
  const headerStyles = {
    backgroundColor: COLORS.cardBackground,
    borderBottomColor: COLORS.borderColor,
    color: COLORS.textColor
  };

  return (
    <header className="p-4 flex justify-between items-center border-b" style={headerStyles}>
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold font-heading" style={{ color: COLORS.primary }}>
          1WIN Tracker Academy
        </h1>
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
