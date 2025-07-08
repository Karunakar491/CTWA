import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';

interface ImageUploaderProps {
  componentId: string;
  currentSrc?: string;
}

export function ImageUploader({ componentId, currentSrc }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { updateComponentProperty } = useFlowStore();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        updateComponentProperty(componentId, 'src', result);
      }
      setIsUploading(false);
    };

    reader.onerror = () => {
      alert('Error reading file');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    updateComponentProperty(componentId, 'src', '');
  };

  return (
    <div className="space-y-4">
      <Label>Image</Label>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Current image preview */}
      {currentSrc && (
        <Card className="p-4">
          <div className="relative">
            <img
              src={currentSrc}
              alt="Preview"
              className="w-full h-32 object-cover rounded-md"
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={handleRemoveImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click "Change Image" to replace this image
          </p>
        </Card>
      )}

      {/* Upload area */}
      <Card 
        className={`p-6 border-2 border-dashed cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50 ${
          isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onClick={handleFileSelect}
      >
        <div className="flex flex-col items-center space-y-3">
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </>
          ) : (
            <>
              {currentSrc ? (
                <ImageIcon className="h-8 w-8 text-gray-400" />
              ) : (
                <Upload className="h-8 w-8 text-gray-400" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {currentSrc ? 'Change Image' : 'Upload Image'}
                </p>
                <p className="text-xs text-gray-500">
                  Click to select or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Upload button alternative */}
      <Button
        variant="outline"
        onClick={handleFileSelect}
        disabled={isUploading}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        {currentSrc ? 'Change Image' : 'Select Image'}
      </Button>
    </div>
  );
}