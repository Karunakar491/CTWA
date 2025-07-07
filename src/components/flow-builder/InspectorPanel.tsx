const handleErrorFix = (error: any) => {
     let fixedJson = jsonText;
     let wasFixed = false;
 
     if (error.message.includes('text is required') || error.message.includes('Please add text')) {
       const pathParts = error.path.split('/');
       if (pathParts.includes('TextHeading')) {
         fixedJson = fixedJson.replace(/"text":\s*""/g, '"text": "New Headline"');
         wasFixed = true;
       } else if (pathParts.includes('TextBody')) {
         fixedJson = fixedJson.replace(/"text":\s*""/g, '"text": "New text content"');
         wasFixed = true;
       } else if (pathParts.includes('TextCaption')) {
         fixedJson = fixedJson.replace(/"text":\s*""/g, '"text": "New caption"');
         wasFixed = true;
       } else if (pathParts.includes('RichText')) {
         fixedJson = fixedJson.replace(/"text":\s*""/g, '"text": "New **rich** text"');
         wasFixed = true;
       } else if (pathParts.includes('EmbeddedLink')) {
         fixedJson = fixedJson.replace(/"text":\s*""/g, '"text": "Click here to learn more"');
         wasFixed = true;
       }
    } else if (error.message.includes('name is required') || error.message.includes('field name')) {
      fixedJson = fixedJson.replace(/"name":\s*""/g, '"name": "field_name"');
      wasFixed = true;
    } else if (error.message.includes('title is required') || error.message.includes('title to')) {
      fixedJson = fixedJson.replace(/"title":\s*""/g, '"title": "Button Text"');
      wasFixed = true;
    } else if (error.message.includes('label is required') || error.message.includes('label to')) {
      fixedJson = fixedJson.replace(/"label":\s*""/g, '"label": "Label"');
      wasFixed = true;
    } else if (error.message.includes('src is required') || error.message.includes('select an image')) {
      fixedJson = fixedJson.replace(/"src":\s*""/g, '"src": "https://via.placeholder.com/300x200"');
      wasFixed = true;
    } else if (error.message.includes('on_click_action') || error.message.includes('what happens when')) {
      // Add basic on_click_action for buttons
      const onClickActionRegex = /"on_click_action":\s*null/g;
      if (onClickActionRegex.test(fixedJson)) {
        fixedJson = fixedJson.replace(onClickActionRegex, '"on_click_action": {"name": "complete"}');
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