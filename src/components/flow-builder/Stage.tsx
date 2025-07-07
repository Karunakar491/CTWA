@@ .. @@
export function Stage() {
  const { flowData, addNewScreen, addComponentToScreen } = useFlowStore();
  
  // Auto-create default screen with heading and footer when no screens exist
  useEffect(() => {
    if (flowData.screens.length === 0) {
      // Create the first screen
      const newScreen = addNewScreen();
      
      // Add a text heading component
      addComponentToScreen(newScreen.id, 'TextHeading');
      
      // Add a footer component
      addComponentToScreen(newScreen.id, 'Footer');
    }
  }, [flowData.screens.length, addNewScreen, addComponentToScreen]);
  
  // If no screens exist at all (shouldn't happen due to useEffect above, but safety check)
  if (flowData.screens.length === 0) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <div className="mb-4">
            <Smartphone className="h-16 w-16 mx-auto text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start Building Your Flow
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first screen to start building your WhatsApp Flow. Add components by dragging them from the palette.
          </p>
          <Button onClick={addNewScreen} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create First Screen
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <FlowCanvas />
    </div>
  );
}