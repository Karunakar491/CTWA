@@ .. @@
  // Reset flow state when modal opens
  useEffect(() => {
    if (open && flowData.screens.length > 0) {
      const firstScreen = flowData.screens[0];
      setFlowState({
        currentScreenId: firstScreen.id,
        formData: {},
        completedFlow: false,
        flowPath: [firstScreen.id],
        errors: {}
      });
    }
  }, [open, flowData.screens]);