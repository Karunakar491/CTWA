import { Button } from "@/components/ui/button";
import { 
  Home, 
  MessageSquare, 
  BarChart3, 
  Workflow, 
  FileText, 
  Settings, 
  Users, 
  Bell,
  LogOut,
  ChevronsLeftRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed?: boolean;
  activeItem: string;
  onItemClick: (item: string) => void;
}

export function Sidebar({ collapsed = false, activeItem, onItemClick }: SidebarProps) {
  const navigationItems = [
    { name: "Home", icon: Home },
    { name: "WhatsApp Business", icon: MessageSquare },
    { name: "Dashboard", icon: BarChart3 },
    { name: "Flows Studio", icon: Workflow },
    { name: "Flow Builder", icon: Workflow },
    { name: "Templates", icon: FileText },
    { name: "Contacts", icon: Users },
    { name: "Analytics", icon: BarChart3 },
  ];

  const bottomItems = [
    { name: "Notifications", icon: Bell },
    { name: "Settings", icon: Settings },
    { name: "Sign Out", icon: LogOut },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-gray-900 text-white">
      <div className={cn("flex items-center h-[73px] px-4 border-b border-gray-800 flex-shrink-0")}>
        <div className="flex items-center space-x-2 w-full">
          <MessageSquare className="h-8 w-8 text-blue-400 flex-shrink-0" />
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Konverse
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigationItems.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            className={cn(
              "w-full font-medium transition-colors h-10",
              collapsed ? "justify-center" : "justify-start text-left",
              "hover:bg-gray-800 hover:text-white",
              activeItem === item.name ? "bg-blue-600 text-white" : "text-gray-300"
            )}
            onClick={() => onItemClick(item.name)}
            title={collapsed ? item.name : undefined}
          >
            <item.icon className={cn("h-4 w-4", collapsed ? "" : "mr-3")} />
            {!collapsed && <span className="truncate">{item.name}</span>}
          </Button>
        ))}
      </nav>

      <div className="px-2 py-4 space-y-1 border-t border-gray-800">
        {bottomItems.map((item) => (
          <Button key={item.name} variant="ghost" className={cn("w-full font-medium transition-colors h-10", collapsed ? "justify-center" : "justify-start text-left", "hover:bg-gray-800 hover:text-white text-gray-300")}
            title={collapsed ? item.name : undefined} >
            <item.icon className={cn("h-4 w-4", collapsed ? "" : "mr-3")} />
            {!collapsed && <span className="truncate">{item.name}</span>}
          </Button>
        ))}
      </div>
    </div>
  );
}