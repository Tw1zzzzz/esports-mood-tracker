
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NotificationsPanel from "./NotificationsPanel";

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-esports-blue">
          1WIN Tracker Academy
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationsPanel />
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5 text-gray-500" />
        </Button>
        <Avatar>
          <AvatarFallback className="bg-esports-purple text-white">
            ES
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default Header;
