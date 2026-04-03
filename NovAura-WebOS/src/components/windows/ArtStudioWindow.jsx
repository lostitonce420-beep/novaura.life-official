import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paintbrush, Eraser, Square, Circle, Minus, Download, Trash2, Palette, Undo2, Redo2, Pipette, Move, Save } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

const COLORS = ['#00d9ff','#a855f7','#ff00ff','#00ffaa','#ff6b6b','#fbbf24','#f472b6','#34d399','#60a5fa','#ffffff','#94a3b8','#000000'];
const BRUSH_SIZES = [2, 4, 8, 14, 24, 40];
const CANVAS_W = 512;
const CANVAS_H = 384;

export default function ArtStudioWindow() {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('brush'); // brush | eraser | line | rect | circle | fill | eyedropper
  const [color, setColor] = useState('#00d9ff');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const lastPos = useRef(null);
  const customColorRef = useRef(null);
  const shapeStart = useRef(null);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    saveSnapshot();
  }, []);

  const getCtx = () => canvasRef.current?.getContext('2d');

  const saveSnapshot = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    setHistory(prev => {
      const next = prev.slice(0, historyIdx + 1);
      next.push(data);
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIdx(prev => Math.min(prev + 1, 49));
  };

  const undo = () => {
    if (historyIdx <= 0) return;
    const newIdx = historyIdx - 1;
    getCtx()?.putImageData(history[newIdx], 0, 0);
    setHistoryIdx(newIdx);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const newIdx = historyIdx + 1;
    getCtx()?.putImageData(history[newIdx], 0, 0);
    setHistoryIdx(newIdx);
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    const pos = getPos(e);
    setIsDrawing(true);
    lastPos.current = pos;

    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      shapeStart.current = pos;
      return;
    }

    if (tool === 'eyedropper') {
      const ctx = getCtx();
      const pixel = ctx.getImageData(Math.round(pos.x), Math.round(pos.y), 1, 1).data;
      setColor(`#${[pixel[0],pixel[1],pixel[2]].map(v => v.toString(16).padStart(2,'0')).join('')}`);
      setTool('brush');
      return;
    }

    if (tool === 'fill') {
      floodFill(Math.round(pos.x), Math.round(pos.y));
      saveSnapshot();
      setIsDrawing(false);
      return;
    }

    const ctx = getCtx();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (tool === 'eraser' ? brushSize * 2 : brushSize) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#0f0f1a' : color;
    ctx.fill();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = getCtx();

    if (tool === 'line' || tool === 'rect' || tool === 'circle') return; // drawn on release

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#0f0f1a' : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 2 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = getCtx();

    if (shapeStart.current && (tool === 'line' || tool === 'rect' || tool === 'circle')) {
      const pos = getPos(e);
      const s = shapeStart.current;
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';

      if (tool === 'line') {
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(s.x, s.y, pos.x - s.x, pos.y - s.y);
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - s.x) / 2, ry = Math.abs(pos.y - s.y) / 2;
        const cx = s.x + (pos.x - s.x) / 2, cy = s.y + (pos.y - s.y) / 2;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      }
      shapeStart.current = null;
    }
    saveSnapshot();
  };

  const floodFill = (startX, startY) => {
    const ctx = getCtx();
    const imgData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const data = imgData.data;
    const targetIdx = (startY * CANVAS_W + startX) * 4;
    const targetR = data[targetIdx], targetG = data[targetIdx+1], targetB = data[targetIdx+2];

    // Parse fill color
    const temp = document.createElement('canvas').getContext('2d');
    temp.fillStyle = color;
    temp.fillRect(0,0,1,1);
    const fc = temp.getImageData(0,0,1,1).data;
    if (targetR === fc[0] && targetG === fc[1] && targetB === fc[2]) return;

    const stack = [[startX, startY]];
    const visited = new Set();
    while (stack.length > 0 && stack.length < 200000) {
      const [x, y] = stack.pop();
      const key = y * CANVAS_W + x;
      if (x < 0 || x >= CANVAS_W || y < 0 || y >= CANVAS_H || visited.has(key)) continue;
      const idx = key * 4;
      if (Math.abs(data[idx] - targetR) > 30 || Math.abs(data[idx+1] - targetG) > 30 || Math.abs(data[idx+2] - targetB) > 30) continue;
      visited.add(key);
      data[idx] = fc[0]; data[idx+1] = fc[1]; data[idx+2] = fc[2]; data[idx+3] = 255;
      stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const clearCanvas = () => {
    const ctx = getCtx();
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    saveSnapshot();
  };

  const downloadCanvas = () => {
    const link = document.createElement('a');
    link.download = 'novaura-art.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const saveToGallery = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const gallery = JSON.parse(kernelStorage.getItem('art_gallery_custom') || '[]');
    gallery.push({ id: `art-${Date.now()}`, title: `Artwork ${gallery.length + 1}`, dataUrl, createdAt: new Date().toISOString() });
    kernelStorage.setItem('art_gallery_custom', JSON.stringify(gallery));
  };

  const tools = [
    { id: 'brush', icon: Paintbrush, label: 'Brush' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rect', icon: Square, label: 'Rect' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'eyedropper', icon: Pipette, label: 'Pick' },
    { id: 'fill', icon: Palette, label: 'Fill' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-black/40 border-b border-slate-800 shrink-0 flex-wrap">
        {tools.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
              className={`p-1.5 rounded transition-all ${tool === t.id ? 'bg-cyan-600/40 text-cyan-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
        <div className="w-px h-5 bg-slate-700 mx-1" />
        <button onClick={undo} title="Undo" className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><Undo2 className="w-3.5 h-3.5" /></button>
        <button onClick={redo} title="Redo" className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><Redo2 className="w-3.5 h-3.5" /></button>
        <div className="w-px h-5 bg-slate-700 mx-1" />
        <button onClick={clearCanvas} title="Clear" className="p-1.5 rounded text-slate-400 hover:bg-red-900/40 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
        <button onClick={downloadCanvas} title="Download PNG" className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><Download className="w-3.5 h-3.5" /></button>
        <button onClick={saveToGallery} title="Save to Gallery" className="p-1.5 rounded text-slate-400 hover:bg-green-900/40 hover:text-green-300"><Save className="w-3.5 h-3.5" /></button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-slate-900/30 p-2 overflow-hidden">
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
            className="border border-slate-700 rounded cursor-crosshair max-w-full max-h-full"
            style={{ imageRendering: 'pixelated' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} />
        </div>

        {/* Right Panel */}
        <div className="w-36 border-l border-slate-800 p-2 space-y-3 overflow-y-auto shrink-0">
          {/* Color Palette */}
          <div>
            <div className="text-[9px] text-slate-500 mb-1">COLOR</div>
            <div className="flex flex-wrap gap-1">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-sm border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-slate-700'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input ref={customColorRef} type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-5 h-5 rounded-sm cursor-pointer border-0 p-0 bg-transparent" />
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-6 h-6 rounded border border-slate-700" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-slate-400">{color}</span>
            </div>
          </div>

          {/* Brush Size */}
          <div>
            <div className="text-[9px] text-slate-500 mb-1">SIZE</div>
            <div className="flex flex-wrap gap-1">
              {BRUSH_SIZES.map(s => (
                <button key={s} onClick={() => setBrushSize(s)}
                  className={`w-7 h-7 rounded flex items-center justify-center text-[10px] transition-all ${brushSize === s ? 'bg-cyan-600/40 text-cyan-300' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center mt-1.5">
              <div className="rounded-full bg-current" style={{ width: Math.min(brushSize, 30), height: Math.min(brushSize, 30), color }} />
            </div>
          </div>

          {/* Quick Info */}
          <div className="text-[9px] text-slate-600 space-y-0.5">
            <div>Tool: {tool}</div>
            <div>Canvas: {CANVAS_W}x{CANVAS_H}</div>
            <div>History: {historyIdx + 1}/{history.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
