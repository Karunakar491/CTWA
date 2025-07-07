const handleErrorFix = (error: any) => {
     let fixedJson = jsonText;
     let wasFixed = false;
 
     if (error.message.includes('text is required') || error.message.includes('Please add text')) {
       const pathParts = error.path.split('/');
       if (pathParts.includes('TextHeading')) {
         fixedJson = fixedJson.replace(/"text":\s*""/g, '"text": "New Headline"');
         wasFixed = true;
       } else if (pathParts.includes('TextBody')) {
    // Auto-fix logic moved to individual property changes below
    console.log('Attempting to fix error:', error);
        wasFixed = true;
      }
    }

    if (wasFixed) {
      return fixedJson;
    }
    return null;
}

export function InspectorPanel() {
                      onClick={() => {
                        if (error.originalMessage?.includes('text is required')) {
                          if (selectedComponent?.type === 'TextHeading') {
                            handlePropertyChange('text', 'New Headline');
                          } else if (selectedComponent?.type === 'TextBody') {
                            handlePropertyChange('text', 'New text content');
                          } else if (selectedComponent?.type === 'TextCaption') {
                            handlePropertyChange('text', 'New caption');
                          } else if (selectedComponent?.type === 'RichText') {
                            handlePropertyChange('text', 'New **rich** text');
                          } else if (selectedComponent?.type === 'EmbeddedLink') {
                            handlePropertyChange('text', 'Click here to learn more');
                          }
                        } else if (error.originalMessage?.includes('name is required')) {
                          handlePropertyChange('name', 'field_name');
                        } else if (error.originalMessage?.includes('title is required')) {
                          handlePropertyChange('title', 'Button Text');
                        } else if (error.originalMessage?.includes('label is required')) {
                          handlePropertyChange('label', 'Label');
                        } else if (error.originalMessage?.includes('src is required')) {
                          handlePropertyChange('src', 'https://via.placeholder.com/300x200');
                        } else if (error.originalMessage?.includes('on_click_action')) {
                          handlePropertyChange('on_click_action', { name: 'complete' });
                        }
                      }}
                    >
}