import React, { useState, useRef } from 'react';
import { Image, Sparkles, Upload, Download, Trash2, Loader2, Wand2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import { BACKEND_URL } from '../../services/aiService';

export default function BackgroundRemoverWindow() {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target.result);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackground = async () => {
    if (!originalImage) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Convert base64 to blob
      const base64Data = originalImage.split(',')[1];
      
      const response = await axios.post(`${BACKEND_URL}/api/remove-background`, {
        image: base64Data
      }, {
        timeout: 30000
      });
      
      if (response.data.result) {
        setProcessedImage(`data:image/png;base64,${response.data.result}`);
        toast.success('Background removed successfully!');
      }
      
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error('Failed to remove background', {
        description: error.response?.data?.detail || error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'background-removed.png';
    link.click();
    
    toast.success('Image downloaded!');
  };

  const clearImages = () => {
    setOriginalImage(null);
    setProcessedImage(null);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-window-bg to-window-header">
      {/* Header */}
      <div className="px-6 py-4 border-b border-primary/20 bg-window-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Background Remover</h3>
            <p className="text-xs text-muted-foreground">AI-powered background removal</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto scrollbar-custom">
        {!originalImage ? (
          /* Upload Area */
          <div className="h-full flex items-center justify-center">
            <Card className="w-full max-w-md p-8 border-2 border-dashed border-primary/30 bg-window-bg hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    Upload Image
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                  <Image className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
              </div>
            </Card>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          /* Image Processing Area */
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  onClick={removeBackground}
                  disabled={isProcessing}
                  className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(0,217,255,0.3)]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Remove Background
                    </>
                  )}
                </Button>
                
                {processedImage && (
                  <Button
                    onClick={downloadImage}
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
              
              <Button
                onClick={clearImages}
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>

            {/* Image Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <Card className="p-4 bg-window-bg border-primary/20">
                <h4 className="text-sm font-semibold text-foreground mb-3">Original</h4>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/20 border border-border">
                  <img 
                    src={originalImage} 
                    alt="Original" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </Card>

              {/* Processed */}
              <Card className="p-4 bg-window-bg border-primary/20">
                <h4 className="text-sm font-semibold text-foreground mb-3">Result</h4>
                <div className="relative aspect-square rounded-lg overflow-hidden" 
                     style={{ 
                       backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
                       backgroundSize: '20px 20px',
                       backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                     }}>
                  {processedImage ? (
                    <img 
                      src={processedImage} 
                      alt="Processed" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">Click "Remove Background" to process</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Info */}
            <Card className="p-4 bg-muted/20 border-border">
              <p className="text-xs text-muted-foreground">
                🧪 <strong>AI-Powered:</strong> Using advanced computer vision to remove backgrounds. 
                Works best with clear subjects and good contrast.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
