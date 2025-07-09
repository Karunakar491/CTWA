import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  activeItem: 'dashboard' | 'flowLibrary' | 'reports' | 'flowBuilder';
  onNavigate: (item: 'dashboard' | 'flowLibrary' | 'reports' | 'flowBuilder') => void;
}

export function AppLayout({ children, activeItem, onNavigate }: AppLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Auto-collapse timer
  const startCollapseTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (!isHovering) {
        setSidebarExpanded(false);
      }
    }, 2000);
  };

  // Clear timer
  const clearCollapseTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Handle clicks outside sidebar to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside sidebar
      if (sidebarRef.current && !sidebarRef.current.contains(target) && sidebarExpanded) {
        setSidebarExpanded(false);
        clearCollapseTimer();
      }
    };

    // Add event listener to document
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarExpanded]);

  // Handle sidebar interactions
  const handleSidebarClick = () => {
    if (!sidebarExpanded) {
      setSidebarExpanded(true);
      clearCollapseTimer();
      startCollapseTimer();
    }
  };

  const handleSidebarMouseEnter = () => {
    setIsHovering(true);
    if (!sidebarExpanded) {
      setSidebarExpanded(true);
    }
    clearCollapseTimer();
  };

  const handleSidebarMouseLeave = () => {
    setIsHovering(false);
    startCollapseTimer();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Always visible, changes width based on expanded state */}
      <div
        ref={sidebarRef}
        className={cn(
          "sidebar-container bg-gray-900 transition-all duration-300 ease-in-out z-50 relative",
          sidebarExpanded ? "min-w-[280px] max-w-[280px]" : "min-w-[55px] max-w-[55px]"
        )}
        onClick={handleSidebarClick}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <Sidebar 
          collapsed={!sidebarExpanded}
          activeItem={activeItem}
          onItemClick={(item) => {
            onNavigate(item);
            // Keep sidebar open briefly after navigation
            clearCollapseTimer();
            startCollapseTimer();
          }}
          onToggleCollapse={() => {
            setSidebarExpanded(!sidebarExpanded);
            clearCollapseTimer();
            if (sidebarExpanded) {
              // If we're collapsing, don't start timer
            } else {
              // If we're expanding, start timer
              startCollapseTimer();
            }
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Backdrop - Only visible when sidebar is expanded */}
      {sidebarExpanded && (
        <div
          className="fixed inset-0 bg-black/10 z-40 transition-opacity duration-300 sidebar-overlay"
          onClick={() => {
            setSidebarExpanded(false);
            clearCollapseTimer();
          }}
        />
      )}
    </div>
  );
}