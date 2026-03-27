import React, { useState, useRef } from 'react';
import { Globe, Sparkles, Code2, Eye, Download, Wand2, Layers, Palette, Layout, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { generateWebsite } from '../../services/aiService';

const TEMPLATES = [
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Hero section, features, CTA',
    icon: Layout,
    preview: '/templates/landing.png',
    tags: ['Marketing', 'SaaS', 'Product']
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Projects showcase, about, contact',
    icon: Palette,
    preview: '/templates/portfolio.png',
    tags: ['Personal', 'Creative', 'Designer']
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Product grid, cart, checkout',
    icon: Globe,
    preview: '/templates/ecommerce.png',
    tags: ['Store', 'Shop', 'Business']
  },
  {
    id: 'blog',
    name: 'Blog',
    description: 'Article feed, categories, sidebar',
    icon: Code2,
    preview: '/templates/blog.png',
    tags: ['Content', 'Writing', 'News']
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Charts, tables, widgets',
    icon: Layers,
    preview: '/templates/dashboard.png',
    tags: ['Admin', 'Analytics', 'Data']
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch',
    icon: Wand2,
    preview: '/templates/blank.png',
    tags: ['Custom', 'Free-form']
  }
];

export default function WebsiteBuilderWindow() {
  const [step, setStep] = useState('template'); // template, customize, preview
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState({
    html: '',
    css: '',
    js: ''
  });
  const [activeTab, setActiveTab] = useState('preview');
  const iframeRef = useRef(null);

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setPrompt(`I want to build a ${template.name.toLowerCase()} website. `);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your website');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateWebsite(
        prompt,
        selectedTemplate?.id || 'blank',
        { responsive: true, modern: true, framework: 'vanilla' }
      );

      setGeneratedCode({
        html: result.html || '',
        css: result.css || '',
        js: result.js || '',
      });
      setStep('preview');
      setActiveTab('preview');
      updatePreview(result.html, result.css, result.js);
      toast.success('Website generated!', {
        description: `Built with ${result.source || 'AI'}`
      });
    } catch (error) {
      console.error('Error generating website:', error);
      toast.error('Failed to generate website', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updatePreview = (html, css, js) => {
    if (!iframeRef.current) return;
    
    const doc = iframeRef.current.contentDocument;
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
      </html>
    `;
    
    doc.open();
    doc.write(fullHtml);
    doc.close();
  };

  const refreshPreview = () => {
    updatePreview(generatedCode.html, generatedCode.css, generatedCode.js);
  };

  const downloadWebsite = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <style>
${generatedCode.css}
  </style>
</head>
<body>
${generatedCode.html}
  <script>
${generatedCode.js}
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'website.html';
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Website downloaded!', {
      description: 'Open website.html in your browser'
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-window-bg to-window-header">
      {/* Header */}
      <div className="px-6 py-4 border-b border-primary/20 bg-window-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Website Builder</h3>
            <p className="text-xs text-muted-foreground">AI-Powered Site Generation</p>
          </div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center gap-2">
          <Badge variant={step === 'template' ? 'default' : 'outline'} className="text-xs">
            1. Template
          </Badge>
          <Badge variant={step === 'customize' ? 'default' : 'outline'} className="text-xs">
            2. Customize
          </Badge>
          <Badge variant={step === 'preview' ? 'default' : 'outline'} className="text-xs">
            3. Preview
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {step === 'template' && (
          /* Template Selection */
          <div className="h-full p-6 overflow-auto scrollbar-custom">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Choose Your Starting Point
                </h2>
                <p className="text-muted-foreground">
                  Select a template or start from scratch
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <Card
                      key={template.id}
                      className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                        selectedTemplate?.id === template.id
                          ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(0,217,255,0.2)]'
                          : 'border-primary/20 hover:border-primary/40'
                      }`}
                      onClick={() => selectTemplate(template)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">
                            {template.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Preview placeholder */}
                      <div className="w-full h-32 rounded-lg bg-muted/20 border border-border mb-3 flex items-center justify-center">
                        <Icon className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {selectedTemplate && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={() => setStep('customize')}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(0,217,255,0.3)]"
                  >
                    Continue with {selectedTemplate.name}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'customize' && (
          /* Customization */
          <div className="h-full p-6 overflow-auto scrollbar-custom">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Describe Your Website
                </h2>
                <p className="text-muted-foreground">
                  Tell the AI what you want - be as detailed as you like
                </p>
              </div>

              {/* Prompt Input */}
              <Card className="p-6 border-primary/30 bg-window-bg">
                <label className="text-sm font-medium text-foreground mb-3 block">
                  What do you want to build?
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: I want a modern landing page for my AI startup. It should have a hero section with a gradient background, features section with icons, pricing table, and testimonials. Use a dark theme with cyan and purple accents."
                  className="min-h-[200px] bg-background border-primary/20 resize-none text-base"
                />
              </Card>

              {/* Quick Options */}
              <Card className="p-6 border-primary/20 bg-window-bg">
                <h4 className="text-sm font-semibold text-foreground mb-3">Quick Add:</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Hero section',
                    'Navigation bar',
                    'Contact form',
                    'Image gallery',
                    'Testimonials',
                    'Pricing table',
                    'Footer',
                    'Dark mode',
                  ].map((item) => (
                    <Button
                      key={item}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(prev => prev + ` Include a ${item.toLowerCase()}.`)}
                      className="border-primary/30 hover:bg-primary/10"
                    >
                      + {item}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Generate Button */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('template')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex-1 bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 shadow-[0_0_40px_rgba(0,217,255,0.3)]"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Website
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          /* Preview & Code */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            {/* Tab Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-window-header">
              <TabsList className="bg-window-bg">
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="html" className="gap-2">
                  HTML
                </TabsTrigger>
                <TabsTrigger value="css" className="gap-2">
                  CSS
                </TabsTrigger>
                <TabsTrigger value="js" className="gap-2">
                  JavaScript
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshPreview}
                  className="border-primary/30"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={downloadWebsite}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value="preview" className="h-full m-0 p-0">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-0 bg-white"
                  title="Website Preview"
                />
              </TabsContent>

              <TabsContent value="html" className="h-full m-0">
                <Editor
                  height="100%"
                  language="html"
                  value={generatedCode.html}
                  onChange={(value) => setGeneratedCode(prev => ({ ...prev, html: value }))}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on'
                  }}
                />
              </TabsContent>

              <TabsContent value="css" className="h-full m-0">
                <Editor
                  height="100%"
                  language="css"
                  value={generatedCode.css}
                  onChange={(value) => setGeneratedCode(prev => ({ ...prev, css: value }))}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on'
                  }}
                />
              </TabsContent>

              <TabsContent value="js" className="h-full m-0">
                <Editor
                  height="100%"
                  language="javascript"
                  value={generatedCode.js}
                  onChange={(value) => setGeneratedCode(prev => ({ ...prev, js: value }))}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on'
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
