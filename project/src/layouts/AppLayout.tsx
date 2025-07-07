import { useState } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { Sidebar } from '@/components/Sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  activeItem: string;
  onNavigate: (item: string) => void;
}

export function AppLayout({ children, activeItem, onNavigate }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const sidebarIsTrulyCollapsed = isCollapsed && !isHovering;

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          collapsible
          collapsedSize={4}
          minSize={15}
          defaultSize={18}
          onCollapse={() => setIsCollapsed(true)}
          onExpand={() => setIsCollapsed(false)}
          onMouseEnter={() => { if (isCollapsed) setIsHovering(true); }}
          onMouseLeave={() => setIsHovering(false)}
          className={cn("transition-all duration-300 ease-in-out", sidebarIsTrulyCollapsed ? "min-w-[55px] max-w-[55px]" : "max-w-[280px]")}
        >
          <Sidebar 
            collapsed={sidebarIsTrulyCollapsed}
            activeItem={activeItem}
            onItemClick={onNavigate} 
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel>
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}