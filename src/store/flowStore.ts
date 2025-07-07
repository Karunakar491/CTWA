@@ .. @@
       EmbeddedLink: {
         id: baseId,
         type: 'EmbeddedLink',
         text: 'Click here to learn more',
         on_click_action: {
           name: 'open_url',
           payload: {
             url: 'https://example.com'
           }
         }
       },
       PhotoPicker: {
         id: baseId,
         type: 'PhotoPicker',
         name: 'photo_field',
         label: 'Upload photo',
         required: false,
         enabled: true,
         photo_source: 'camera_gallery',
         max_file_size_kb: 5120
       },
       DocumentPicker: {
         id: baseId,
         type: 'DocumentPicker',
         name: 'document_field',
         label: 'Upload document',
         required: false,
         enabled: true,
         max_file_size_kb: 10240,
         allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png']
       }
     };
 
     return { ...defaults[componentType] };
   }
 
-  // Start with completely empty flow
+  // Start with a basic valid flow structure
   const initialFlowData: FlowData = {
     version: "5.0",
     data_api_version: "3.0",
     name: "Untitled Flow",
-    screens: []
+    screens: [
+      {
+        id: "WELCOME_SCREEN",
+        title: "Welcome",
+        data: [
+          {
+            id: "welcome_heading",
+            type: "TextHeading",
+            text: "Welcome to our service"
+          },
+          {
+            id: "welcome_body",
+            type: "TextBody", 
+            text: "Thank you for your interest. Please continue to get started."
+          },
+          {
+            id: "continue_footer",
+            type: "Footer",
+            label: "Get Started",
+            on_click_action: {
+              name: "complete"
+            }
+          }
+        ]
+      }
+    ]
   };