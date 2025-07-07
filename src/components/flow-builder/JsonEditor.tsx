@@ .. @@
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { Badge } from '@/components/ui/badge';
 import { Card } from '@/components/ui/card';
 import { useFlowStore } from '@/store/flowStore';
+import { whatsappFlowsValidator } from '@/lib/whatsapp-flows-validator';
 import { ArrowLeft, Save, AlertCircle, CheckCircle, Download, Upload } from 'lucide-react';
 import Editor from '@monaco-editor/react';
-import Ajv from 'ajv';
 
 interface JsonEditorProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
-// WhatsApp Flows JSON Schema (simplified version based on Meta documentation)
-const whatsappFlowSchema = {
-  type: "object",
-  properties: {
-    version: {
-      type: "string",
-      enum: ["5.0"]
-    },
-    screens: {
-      type: "array",
-      items: {
-        type: "object",
-        properties: {
-          id: { type: "string" },
-          title: { type: "string" },
-          data: {
-            type: "array",
-            items: {
-              type: "object",
-              properties: {
-                id: { type: "string" },
-                type: {
-                  type: "string",
-                  enum: [
-                    "TextHeading", "TextSubheading", "TextBody", "TextInput",
-                    "CheckboxGroup", "RadioButtonsGroup", "Footer", "OptIn",
-                    "Image", "Dropdown", "DatePicker", "Button", "Form"
-                  ]
-                }
-              },
-              required: ["id", "type"]
-            }
-          }
-        },
-        required: ["id", "title", "data"]
-      }
-    }
-  },
-  required: ["version", "screens"]
-};
-
 export function JsonEditor({ open, onOpenChange }: JsonEditorProps) {
   const { flowData, setFlowData } = useFlowStore();
   const [editorValue, setEditorValue] = useState('');
   const [validationErrors, setValidationErrors] = useState<string[]>([]);
   const [isValidJson, setIsValidJson] = useState(true);
   const [hasChanges, setHasChanges] = useState(false);
 
-  const ajv = new Ajv({ allErrors: true });
-  const validate = ajv.compile(whatsappFlowSchema);
-
   useEffect(() => {
     if (open) {
       const formattedJson = JSON.stringify(flowData, null, 2);
@@ -78,15 +31,15 @@ export function JsonEditor({ open, onOpenChange }: JsonEditorProps) {
       const parsed = JSON.parse(jsonString);
       setIsValidJson(true);
       
-      // Validate against WhatsApp Flows schema
-      const isValid = validate(parsed);
+      // Validate against WhatsApp Flows schema using centralized validator
+      const { isValid, errors } = whatsappFlowsValidator.validate(parsed);
       
-      if (!isValid && validate.errors) {
-        const errors = validate.errors.map(error => {
-          const path = error.instancePath || 'root';
-          return `${path}: ${error.message}`;
+      if (!isValid && errors.length > 0) {
+        const errorMessages = errors.map(error => {
+          const path = error.path || 'root';
+          return `${path}: ${error.message}`;
         });
-        setValidationErrors(errors);
+        setValidationErrors(errorMessages);
       } else {
         setValidationErrors([]);
       }
@@ .. @@
               <CardDescription className="text-blue-700 text-xs">
                 This validator checks your flow against the official WhatsApp Flows API specifications. 
                 All errors must be fixed before your flow can be deployed to WhatsApp Business.
+                The validation uses the latest WhatsApp Flows v7.1 requirements and component specifications.
               </CardDescription>
               <div className="mt-3">
                 <Button