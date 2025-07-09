import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { Dashboard } from '@/components/Dashboard';
import { FlowLibrary } from '@/components/FlowLibrary';
import { FlowBuilder } from '@/components/FlowBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';
import { useFlowStore } from '@/store/flowStore';
import { getFlowById } from '@/services/metaApi';
import { Construction, FileText, BarChart3 } from 'lucide-react';

type ActiveView = 'dashboard' | 'flowLibrary' | 'reports' | 'flowBuilder';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const { setFlowData, addNewScreen, addComponentToScreen } = useFlowStore();

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
    console.log(`Navigated to: ${view}`);
  };

  const handleCreateFlow = () => {
    // Reset flow data to empty state
    const newFlowData = {
      version: "7.1",
      data_api_version: "3.0",
      name: "My New WhatsApp Flow",
      routing_model: {},
      screens: []
    };
    
    setFlowData(newFlowData);
    
    // Auto-create first screen with default components
    const newScreen = addNewScreen();
    addComponentToScreen(newScreen.id, 'TextHeading');
    addComponentToScreen(newScreen.id, 'Footer');
    
    setActiveView('flowBuilder');
  };

  const handleEditFlow = async (flowId: string) => {
    try {
      // Simulate fetching flow data
      const flowData = await getFlowById(flowId);
      if (flowData) {
        setFlowData(flowData);
        setActiveView('flowBuilder');
      }
    } catch (error) {
      console.error('Error loading flow for editing:', error);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onCreateFlow={handleCreateFlow} />;
      case 'flowLibrary':
        return <FlowLibrary onCreateFlow={handleCreateFlow} onEditFlow={handleEditFlow} />;
      case 'reports':
        return (
          <div className="flex-1 bg-slate-50 flex items-center justify-center">
            <Card className="max-w-md text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle>Reports & Analytics</CardTitle>
                <CardDescription>
                  View detailed analytics and performance reports for your flows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-2 text-orange-600 bg-orange-50 p-3 rounded-lg">
                  <Construction className="w-4 h-4" />
                  <span className="text-sm font-medium">Coming Soon</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'flowBuilder':
        return <FlowBuilder />;
      default:
        return <Dashboard onCreateFlow={handleCreateFlow} />;
    }
  };

  return (
    <AppLayout activeItem={activeView} onNavigate={handleNavigate}>
      <div className="h-full">
        {renderContent()}
      </div>
      <Toaster />
    </AppLayout>
  );
}

export default App;