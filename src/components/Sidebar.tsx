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
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed?: boolean;
  activeItem: string;
  onItemClick: (item: 'dashboard' | 'flows' | 'flowLibrary' | 'reports' | 'flowBuilder') => void;
  onToggleCollapse?: () => void;
}

export function Sidebar({ collapsed = false, activeItem, onItemClick, onToggleCollapse }: SidebarProps) {
  const navigationItems = [
    { name: "Dashboard", id: "dashboard", icon: Home },
    { name: "Flows", id: "flows", icon: Workflow },
    { name: "Flow Library", id: "flowLibrary", icon: FileText },
    { name: "Reports", id: "reports", icon: BarChart3 },
  ];

  const bottomItems = [
    { name: "Notifications", icon: Bell },
    { name: "Settings", icon: Settings },
    { name: "Sign Out", icon: LogOut },
  ];

  return (
    <div className={cn(
      "flex h-full flex-col bg-gray-900 text-white relative transition-all duration-300",
      collapsed ? "w-[55px]" : "w-[280px]"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center h-[73px] px-4 border-b border-gray-800 flex-shrink-0",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-8 w-8 text-blue-400 flex-shrink-0" />
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Konverse
            </span>
          )}
        </div>
        
        {/* Toggle Button */}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full font-medium transition-all duration-200 h-10",
              collapsed ? "justify-center px-2" : "justify-start text-left px-3",
              "hover:bg-gray-800 hover:text-white",
              activeItem === item.id 
                ? "bg-blue-600 text-white shadow-lg" 
                : "text-gray-300 hover:text-white"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onItemClick(item.id);
            }}
            title={collapsed ? item.name : undefined}
          >
            <item.icon className={cn("h-4 w-4 flex-shrink-0", collapsed ? "" : "mr-3")} />
            {!collapsed && <span className="truncate">{item.name}</span>}
          </Button>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="px-2 py-4 space-y-1 border-t border-gray-800">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full font-medium transition-all duration-200 h-10",
            collapsed ? "justify-center px-2" : "justify-start text-left px-3",
            "hover:bg-gray-800 hover:text-white text-gray-300"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className={cn("h-4 w-4 flex-shrink-0", collapsed ? "" : "mr-3")} />
          {!collapsed && <span className="truncate">Settings</span>}
        </Button>
      </div>

      {/* Sidebar Status Indicator - Only show when expanded */}
      {!collapsed && (
        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <span>Auto-hide in 2s</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Collapsed State Indicator */}
      {collapsed && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col space-y-1 opacity-50">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}