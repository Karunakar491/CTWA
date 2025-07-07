import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useFlowStore } from '@/store/flowStore';
import { Button } from '../ui/button';
import { X, MoreVertical } from 'lucide-react';
// Import other form components you need: Input, Checkbox, etc.

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InteractivePreviewModal({ open, onOpenChange }: PreviewModalProps) {
  const { flowData } = useFlowStore();
  const [flowSnapshot, setFlowSnapshot] = useState(flowData);
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      const deepCopy = JSON.parse(JSON.stringify(flowData));
      setFlowSnapshot(deepCopy);
      setCurrentScreenId(deepCopy.screens.length > 0 ? deepCopy.screens[0].id : null);
      setFormData({});
    }
  }, [open, flowData]);

  const currentScreen = flowSnapshot.screens.find(s => s.id === currentScreenId);

  const handleNavigate = (nextScreenId: string) => {
    // Basic validation could go here
    setCurrentScreenId(nextScreenId);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-auto h-auto bg-transparent border-none shadow-none p-0">
        <div className="w-[375px] h-[780px] bg-gray-900 rounded-[50px] shadow-2xl p-4 flex flex-col border-4 border-gray-700">
            {/* Phone Screen */}
            <div className="bg-white rounded-[35px] flex-1 flex flex-col overflow-hidden">
                {currentScreen ? (
                    <>
                        {/* Screen Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <button onClick={() => onOpenChange(false)}><X className="w-5 h-5" /></button>
                            <DialogTitle className="font-semibold">{currentScreen.title}</DialogTitle>
                            <button><MoreVertical className="w-5 h-5" /></button>
                        </div>
                        {/* Screen Content - This is where you would render interactive form elements */}
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                            <p className="font-bold text-xl">{currentScreen.data.find(c => c.type === 'TextHeading')?.text}</p>
                            <p>{currentScreen.data.find(c => c.type === 'TextBody')?.text}</p>
                             {/* Add REAL interactive Input, Checkbox etc. here, wired to formData state */}
                        </div>

                        {/* Screen Footer */}
                        <div className="p-3 border-t bg-gray-50 space-y-2">
                             {/* Logic to find the footer button and attach handleNavigate */}
                             <Button onClick={() => console.log("Next Clicked")} className="bg-green-600 hover:bg-green-700 w-full font-semibold">Next</Button>
                             <p className="text-center text-xs text-gray-400">Managed by the business. <a href="#" className="text-blue-600">Learn more</a></p>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No screens to preview.</p>
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}