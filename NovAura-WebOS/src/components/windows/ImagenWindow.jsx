import React, { useState, useRef } from 'react';
import { 
  Sparkles, Download, RefreshCw, Image as ImageIcon, 
  Settings, X, Check, Loader2, Palette, Ratio,
  AlertCircle, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useAIImageGeneration } from '../../hooks/useFirebaseAI';
import { IMAGEN_MODELS } from '../../services/firebaseAIService';

const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square', icon: '□' },
  { value: '16:9', label: 'Widescreen', icon: '▭' },
  { value: '9:16', label: 'Portrait', icon: '▯' },
  { value: '4:3', label: 'Standard', icon: '▭' },
  { value: '3:2', label: 'Photo', icon: '▭' },
];

const IMAGE_COUNT_OPTIONS = [1, 2, 4];

export default function ImagenWindow() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [selectedModel, setSelectedModel] = useState(IMAGEN_MODELS.GENERATE);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef(null);

  const { 
    generate, 
    images, 
    isLoading, 
    error, 
    clearImages,
    isAvailable 
  } = useAIImageGeneration({
    model: selectedModel,
    numberOfImages,
    aspectRatio,
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      await generate(prompt, {
        model: selectedModel,
        numberOfImages,
        aspectRatio,
      });
      toast.success('Images generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate images');
    }
  };

  const handleDownload = async (imageUrl, index) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `novaura-imagen-${Date.now()}-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded');
    } catch (err) {
      toast.error('Failed to download image');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  if (!isAvailable) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-200 mb-2">Firebase AI Not Available</h3>
          <p className="text-gray-400 max-w-md">
            Firebase AI is not configured. Please check your environment variables and ensure Firebase is properly set up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-[#0a0a0f]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-100">Imagen</h1>
              <p className="text-xs text-gray-500">AI Image Generation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            {images.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearImages}
                className="gap-2 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="grid grid-cols-3 gap-6">
              {/* Model Selection */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase mb-2 block">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 outline-none focus:border-primary/30"
                >
                  <option value={IMAGEN_MODELS.GENERATE}>Imagen 4 Generate</option>
                  <option value={IMAGEN_MODELS.FAST}>Imagen 4 Fast</option>
                  <option value={IMAGEN_MODELS.ULTRA}>Imagen 4 Ultra</option>
                </select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase mb-2 block">
                  Aspect Ratio
                </label>
                <div className="flex gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                        aspectRatio === ratio.value
                          ? 'bg-primary/20 border-primary/30 text-primary'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                      title={ratio.label}
                    >
                      {ratio.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Images */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase mb-2 block">
                  Number of Images
                </label>
                <div className="flex gap-2">
                  {IMAGE_COUNT_OPTIONS.map((count) => (
                    <button
                      key={count}
                      onClick={() => setNumberOfImages(count)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                        numberOfImages === count
                          ? 'bg-primary/20 border-primary/30 text-primary'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex gap-4">
            <div className="flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the image you want to generate... (e.g., 'A futuristic cityscape at sunset with flying cars')"
                className="w-full h-24 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-600 resize-none outline-none focus:border-primary/30"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">
                  Press Cmd+Enter to generate
                </span>
                <span className="text-xs text-gray-500">
                  {prompt.length} chars
                </span>
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="h-24 px-6 flex flex-col items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
              <span className="text-xs">
                {isLoading ? 'Generating...' : 'Generate'}
              </span>
            </Button>
          </div>
        </div>

        {/* Generated Images */}
        <div className="flex-1 overflow-auto p-6">
          {images.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <ImageIcon className="w-24 h-24 mb-4 opacity-20" />
              <p className="text-lg">No images generated yet</p>
              <p className="text-sm opacity-60">Enter a prompt and click Generate</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              images.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
              images.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {images.map((image, index) => (
                <div
                  key={index}
                  className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/5"
                >
                  <img
                    src={image.url}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-auto object-cover"
                    style={{ aspectRatio: aspectRatio.replace(':', '/') }}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(image.url, index)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>

                  {/* Index Badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
