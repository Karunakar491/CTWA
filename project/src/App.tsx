import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { Dashboard } from '@/components/Dashboard';
import { FlowsStudio } from '@/components/FlowsStudio';
import { FlowBuilder } from '@/components/FlowBuilder';
import './App.css';

function App() {
  const [activeItem, setActiveItem] = useState('Flow Builder');

  const handleItemClick = (item: string) => {
    setActiveItem(item);
    console.log(`Clicked: ${item}`);
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'Flows Studio':
        return <FlowsStudio />;
      case 'Flow Builder':
        return <FlowBuilder />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppLayout activeItem={activeItem} onNavigate={handleItemClick}>
      <div className="h-full">
        {renderContent()}
      </div>
    </AppLayout>
  );
}

export default App;