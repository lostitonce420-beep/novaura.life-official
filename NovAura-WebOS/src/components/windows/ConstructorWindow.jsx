import React, { useState } from 'react';
import { Wrench, Copy, Download, Play, Code, Layers, FileCode, RefreshCw } from 'lucide-react';

const FRAMEWORKS = [
  { id: 'react', label: 'React', icon: '⚛️' },
  { id: 'vue', label: 'Vue 3', icon: '💚' },
  { id: 'svelte', label: 'Svelte', icon: '🔥' },
  { id: 'vanilla', label: 'Vanilla JS', icon: '📜' },
];

const COMPONENT_TYPES = ['button','card','modal','form','navbar','sidebar','table','list','input','dropdown','tabs','accordion','tooltip','badge','avatar'];

const TEMPLATES = {
  react: {
    button: `import React from 'react';\n\nexport default function Button({ children, variant = 'primary', onClick, disabled = false }) {\n  const styles = {\n    primary: 'bg-blue-600 hover:bg-blue-700 text-white',\n    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',\n    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',\n  };\n\n  return (\n    <button\n      onClick={onClick}\n      disabled={disabled}\n      className={\`px-4 py-2 rounded-lg font-medium transition-colors \${styles[variant]} \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}\n    >\n      {children}\n    </button>\n  );\n}`,
    card: `import React from 'react';\n\nexport default function Card({ title, description, image, footer, className = '' }) {\n  return (\n    <div className={\`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden \${className}\`}>\n      {image && <img src={image} alt={title} className="w-full h-48 object-cover" />}\n      <div className="p-4">\n        {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}\n        {description && <p className="text-gray-600 text-sm">{description}</p>}\n      </div>\n      {footer && <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">{footer}</div>}\n    </div>\n  );\n}`,
    modal: `import React from 'react';\n\nexport default function Modal({ isOpen, onClose, title, children }) {\n  if (!isOpen) return null;\n\n  return (\n    <div className="fixed inset-0 z-50 flex items-center justify-center">\n      <div className="absolute inset-0 bg-black/50" onClick={onClose} />\n      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">\n        <div className="flex items-center justify-between p-4 border-b">\n          <h2 className="text-lg font-semibold">{title}</h2>\n          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>\n        </div>\n        <div className="p-4">{children}</div>\n      </div>\n    </div>\n  );\n}`,
  },
  vue: {
    button: `<template>\n  <button\n    :class="[\n      'px-4 py-2 rounded-lg font-medium transition-colors',\n      styles[variant],\n      disabled ? 'opacity-50 cursor-not-allowed' : ''\n    ]"\n    :disabled="disabled"\n    @click="$emit('click')"\n  >\n    <slot />\n  </button>\n</template>\n\n<script setup>\ndefineProps({\n  variant: { type: String, default: 'primary' },\n  disabled: { type: Boolean, default: false }\n});\n\ndefineEmits(['click']);\n\nconst styles = {\n  primary: 'bg-blue-600 hover:bg-blue-700 text-white',\n  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',\n  outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',\n};\n</script>`,
    card: `<template>\n  <div :class="['rounded-xl border bg-white shadow-sm overflow-hidden', className]">\n    <img v-if="image" :src="image" :alt="title" class="w-full h-48 object-cover" />\n    <div class="p-4">\n      <h3 v-if="title" class="text-lg font-semibold mb-1">{{ title }}</h3>\n      <p v-if="description" class="text-gray-600 text-sm">{{ description }}</p>\n    </div>\n    <div v-if="$slots.footer" class="px-4 py-3 border-t bg-gray-50">\n      <slot name="footer" />\n    </div>\n  </div>\n</template>\n\n<script setup>\ndefineProps(['title', 'description', 'image', 'className']);\n</script>`,
  },
  svelte: {
    button: `<script>\n  export let variant = 'primary';\n  export let disabled = false;\n\n  const styles = {\n    primary: 'bg-blue-600 hover:bg-blue-700 text-white',\n    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',\n    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',\n  };\n</script>\n\n<button\n  class="px-4 py-2 rounded-lg font-medium transition-colors {styles[variant]} {disabled ? 'opacity-50' : ''}"\n  {disabled}\n  on:click\n>\n  <slot />\n</button>`,
  },
  vanilla: {
    button: `class Button {\n  constructor(container, options = {}) {\n    this.variant = options.variant || 'primary';\n    this.text = options.text || 'Button';\n    this.onClick = options.onClick || (() => {});\n    this.el = document.createElement('button');\n    this.el.textContent = this.text;\n    this.el.className = 'btn btn-' + this.variant;\n    this.el.addEventListener('click', this.onClick);\n    container.appendChild(this.el);\n  }\n\n  destroy() {\n    this.el.remove();\n  }\n}`,
  },
};

export default function ConstructorWindow({ onAIChat }) {
  const [framework, setFramework] = useState('react');
  const [componentType, setComponentType] = useState('button');
  const [code, setCode] = useState(TEMPLATES.react.button);
  const [componentName, setComponentName] = useState('Button');

  const generateCode = async () => {
    const tmpl = TEMPLATES[framework]?.[componentType];
    if (tmpl) {
      setCode(tmpl);
      setComponentName(componentType.charAt(0).toUpperCase() + componentType.slice(1));
    } else if (onAIChat) {
      setCode('// Generating with AI...');
      try {
        const prompt = `Generate a ${componentType} component for ${framework}. Use best practices, include props, styling, and export. Only output code.`;
        const result = await onAIChat(prompt, 'coding');
        setCode(result?.response || `// AI returned no response for ${framework}/${componentType}`);
      } catch {
        setCode(`// AI generation failed for ${framework}/${componentType}.\n// Check Settings > AI Providers.`);
      }
      setComponentName(componentType.charAt(0).toUpperCase() + componentType.slice(1));
    } else {
      setCode(`// No template for ${framework}/${componentType} yet.\n// Connect an AI provider in Settings to generate.`);
    }
  };

  const copyCode = () => navigator.clipboard.writeText(code);
  const downloadCode = () => {
    const ext = framework === 'react' ? '.jsx' : framework === 'vue' ? '.vue' : framework === 'svelte' ? '.svelte' : '.js';
    const blob = new Blob([code], { type: 'text/plain' });
    const link = document.createElement('a'); link.download = `${componentName}${ext}`; link.href = URL.createObjectURL(blob); link.click();
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold">Constructor</span>
        </div>
        <div className="flex gap-1">
          <button onClick={copyCode} className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={downloadCode} className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><Download className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Config panel */}
        <div className="w-44 border-r border-slate-800 p-3 space-y-3 overflow-y-auto shrink-0">
          <div>
            <label className="text-[9px] text-slate-500 block mb-1">FRAMEWORK</label>
            <div className="space-y-1">
              {FRAMEWORKS.map(f => (
                <button key={f.id} onClick={() => setFramework(f.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 ${framework === f.id ? 'bg-blue-600/30 text-blue-300' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <span>{f.icon}</span>{f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] text-slate-500 block mb-1">COMPONENT</label>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {COMPONENT_TYPES.map(t => (
                <button key={t} onClick={() => setComponentType(t)}
                  className={`w-full text-left px-2 py-1 rounded text-[10px] capitalize ${componentType === t ? 'bg-blue-600/30 text-blue-300' : 'text-slate-400 hover:bg-slate-800'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] text-slate-500 block mb-1">NAME</label>
            <input value={componentName} onChange={e => setComponentName(e.target.value)}
              className="w-full px-2 py-1 bg-black/30 border border-slate-700 rounded text-xs text-white focus:outline-none" />
          </div>
          <button onClick={generateCode}
            className="w-full py-2 bg-blue-600/50 hover:bg-blue-500/50 border border-blue-700 rounded text-xs text-blue-200 flex items-center justify-center gap-1">
            <RefreshCw className="w-3 h-3" /> Generate
          </button>
        </div>

        {/* Code output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 bg-black/20 border-b border-slate-800/50 shrink-0 flex items-center gap-2">
            <FileCode className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-400">{componentName}.{framework === 'react' ? 'jsx' : framework === 'vue' ? 'vue' : framework === 'svelte' ? 'svelte' : 'js'}</span>
            <span className="text-[9px] text-slate-600 ml-auto">{code.split('\n').length} lines</span>
          </div>
          <textarea value={code} onChange={e => setCode(e.target.value)}
            className="flex-1 p-3 bg-transparent font-mono text-xs text-slate-200 resize-none focus:outline-none leading-relaxed"
            spellCheck={false} />
        </div>
      </div>
    </div>
  );
}
