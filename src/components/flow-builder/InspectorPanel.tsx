import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useFlowStore } from '@/store/flowStore';
import { ImageUploader } from './ImageUploader';
import { Plus, X, AlertCircle, Calendar, Image as ImageIcon, Settings, Trash2, Info, Copy, Check, Download, RotateCcw, Lightbulb, Zap, CheckCircle, Save, Globe, Terminal, Clock, ChevronDown, ChevronRight, Wifi } from 'lucide-react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useToast } from '@/hooks/use-toast';
import type { ApiLogEntry } from '@/types/api';

interface InspectorPanelProps {
  activeTab?: 'properties' | 'json' | 'dataExchange';
  apiLogs?: ApiLogEntry[];
}

let editorStylesAdded = false;

interface InspectorPanelProps {
  activeTab?: 'properties' | 'json';
  apiLogs?: any[];
}

export function InspectorPanel({ activeTab = 'properties', apiLogs = [] }: InspectorPanelProps) {
  // ... rest of the code remains the same ...
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debounced;
}