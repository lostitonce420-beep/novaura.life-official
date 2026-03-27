import React, { useState } from 'react';
import { Palette, Sparkles, Image as ImageIcon, Video, Loader2, Download, Wand2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { generateImage as aiGenerateImage, generateVideo, BACKEND_URL, getAuthHeaders } from '../../services/aiService';

export default function VertexAIWindow() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMedia, setGeneratedMedia] = useState([]);
  const [selectedModel, setSelectedModel] = useState('imagen-3.0-generate-001');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  const imageModels = [
    { value: 'imagen-3.0-generate-001', label: 'Imagen 3.0 (Fast)' },
    { value: 'imagen-3.0-fast-generate-001', label: 'Imagen 3.0 Fast' },
  ];
  
  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
  ];

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await aiGenerateImage(
        negativePrompt ? `${prompt}. Avoid: ${negativePrompt}` : prompt,
        aspectRatio
      );

      if (result.imageUrl) {
        setGeneratedMedia(prev => [{ url: result.imageUrl, type: 'image' }, ...prev]);
        toast.success('Image generated successfully!');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);

    try {
      toast.info('Video generation started', {
        description: 'This may take a few minutes...'
      });

      const result = await generateVideo(prompt, { aspectRatio });

      if (result.videoUrl) {
        setGeneratedMedia(prev => [{
          type: 'video',
          url: result.videoUrl
        }, ...prev]);
        toast.success('Video generated successfully!');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error('Failed to generate video', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-window-bg to-window-header">
      {/* Header */}
      <div className="px-6 py-4 border-b border-primary/20 bg-window-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Vertex AI Studio</h3>
              <p className="text-xs text-muted-foreground">Google Imagen 3.0 & Video Generation</p>
            </div>
          </div>
          <Badge variant="outline" className="border-success text-success">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Google
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Generation */}
        <div className="w-2/5 border-r border-primary/20 p-6 overflow-auto scrollbar-custom">
          <Tabs defaultValue="image" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="image" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <Video className="w-4 h-4" />
                Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-4">
              {/* Prompt */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Prompt</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="min-h-[100px] bg-window-bg border-primary/20 resize-none"
                />
              </div>

              {/* Negative Prompt */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Negative Prompt (Optional)</label>
                <Input
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="What to avoid..."
                  className="bg-window-bg border-primary/20"
                />
              </div>

              {/* Model Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="bg-window-bg border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageModels.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Aspect Ratio</label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="bg-window-bg border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatios.map(ratio => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateImage}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-[0_0_30px_rgba(0,217,255,0.4)]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              {/* Prompt */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Video Prompt</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to generate..."
                  className="min-h-[150px] bg-window-bg border-primary/20 resize-none"
                />
              </div>

              <Card className="p-4 bg-muted/20 border-border">
                <p className="text-xs text-muted-foreground">
                  ⏱️ Video generation takes 2-3 minutes. The AI will create a short 4-second video based on your prompt.
                </p>
              </Card>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateVideo}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-accent to-secondary hover:opacity-90 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Gallery */}
        <div className="flex-1 p-6 overflow-auto scrollbar-custom">
          <h4 className="text-sm font-semibold text-foreground mb-4">Generated Media</h4>
          
          {generatedMedia.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Your generated media will appear here</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedMedia.map((media, index) => (
                <Card key={index} className="overflow-hidden bg-window-bg border-primary/20 group">
                  {media.type === 'video' ? (
                    <video 
                      src={media.url} 
                      controls 
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <img 
                      src={media} 
                      alt={`Generated ${index}`} 
                      className="w-full aspect-square object-cover"
                    />
                  )}
                  <div className="p-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = media.url || media;
                        link.download = `vertex-ai-${index}.${media.type === 'video' ? 'mp4' : 'png'}`;
                        link.click();
                        toast.success('Downloaded!');
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
