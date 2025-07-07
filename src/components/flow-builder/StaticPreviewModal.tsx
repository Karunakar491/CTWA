@@ .. @@
export function StaticPreviewModal({ open, onOpenChange }: StaticPreviewModalProps) {
  const { flowData } = useFlowStore();
  const [currentScreenId, setCurrentScreenId] = useState('');
  const [showScreenSelector, setShowScreenSelector] = useState(false);

  // Initialize with first screen when modal opens
  useEffect(() => {
    if (open && flowData.screens.length > 0) {
      setCurrentScreenId(flowData.screens[0].id);
    }
  }, [open, flowData.screens]);

  const currentScreen = flowData.screens.find(s => s.id === currentScreenId);
  const currentScreenIndex = flowData.screens.findIndex(s => s.id === currentScreenId);
  const canGoNext = currentScreenIndex < flowData.screens.length - 1;
  const canGoPrevious = currentScreenIndex > 0;