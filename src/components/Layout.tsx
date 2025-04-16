import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COLORS } from "@/styles/theme";

const Layout = () => {
  return (
    <div className="flex min-h-screen layout-container" style={{ backgroundColor: COLORS.backgroundColor }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <ScrollArea className="flex-1" style={{ backgroundColor: COLORS.backgroundColor }}>
          <main className="p-4" style={{ backgroundColor: COLORS.backgroundColor, color: COLORS.textColor }}>
            <Outlet />
          </main>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Layout;
