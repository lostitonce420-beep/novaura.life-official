import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight, ChevronDown, FileCode, Folder, FolderOpen,
  Plus, FilePlus, FolderPlus, Trash2, Pencil, MoreHorizontal,
} from 'lucide-react';
import useBuilderStore from './useBuilderStore';

// ── Icon by file extension ──────────────────────────────────
function fileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  const colors = {
    js: 'text-yellow-400', jsx: 'text-cyan-400', ts: 'text-blue-400', tsx: 'text-blue-300',
    html: 'text-orange-400', css: 'text-purple-400', scss: 'text-pink-400',
    json: 'text-green-400', md: 'text-gray-300', py: 'text-green-300',
    rs: 'text-orange-300', go: 'text-cyan-300', env: 'text-yellow-300',
  };
  return colors[ext] || 'text-gray-400';
}

// ── Inline rename input ─────────────────────────────────────
function InlineInput({ defaultValue, onSubmit, onCancel }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.select(); }, []);

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      const val = ref.current.value.trim();
      if (val) onSubmit(val);
      else onCancel();
    }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <input
      ref={ref}
      defaultValue={defaultValue}
      onKeyDown={handleKey}
      onBlur={() => {
        const val = ref.current?.value.trim();
        if (val && val !== defaultValue) onSubmit(val);
        else onCancel();
      }}
      className="bg-white/10 border border-primary/40 rounded px-1 text-xs text-white outline-none w-full"
      autoFocus
    />
  );
}

// ── Context Menu ────────────────────────────────────────────
function ContextMenu({ x, y, node, onClose }) {
  const { createFile, renameNode, deleteNode } = useBuilderStore();
  const ref = useRef(null);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [];

  if (node.type === 'folder') {
    items.push({ label: 'New File', icon: FilePlus, action: () => { createFile(node.id, 'untitled.js', 'file'); onClose(); } });
    items.push({ label: 'New Folder', icon: FolderPlus, action: () => { createFile(node.id, 'new-folder', 'folder'); onClose(); } });
    items.push(null); // separator
  }

  if (node.id !== 'root') {
    items.push({ label: 'Rename', icon: Pencil, action: () => { setRenaming(true); } });
    items.push({ label: 'Delete', icon: Trash2, action: () => { deleteNode(node.id); onClose(); }, danger: true });
  }

  if (renaming) {
    return (
      <div ref={ref} className="fixed z-[100] bg-[#1e1e2e] border border-white/10 rounded-lg shadow-xl p-2 min-w-[160px]" style={{ left: x, top: y }}>
        <InlineInput
          defaultValue={node.name}
          onSubmit={(val) => { renameNode(node.id, val); onClose(); }}
          onCancel={onClose}
        />
      </div>
    );
  }

  return (
    <div ref={ref} className="fixed z-[100] bg-[#1e1e2e] border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]" style={{ left: x, top: y }}>
      {items.map((item, i) =>
        item === null ? (
          <div key={i} className="border-t border-white/10 my-1" />
        ) : (
          <button
            key={item.label}
            onClick={item.action}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 transition-colors ${item.danger ? 'text-red-400 hover:text-red-300' : 'text-gray-300 hover:text-white'}`}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

// ── Tree Node ───────────────────────────────────────────────
function TreeNode({ node, depth = 0 }) {
  const { openFile, activeTab, toggleFolder, dirty } = useBuilderStore();
  const [ctx, setCtx] = useState(null);

  const isFolder = node.type === 'folder';
  const isActive = activeTab === node.id;
  const isDirty = dirty[node.id];

  const handleClick = () => {
    if (isFolder) toggleFolder(node.id);
    else openFile(node.id);
  };

  const handleContext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={handleContext}
        className={`flex items-center gap-1 px-1 py-[3px] cursor-pointer text-xs select-none rounded transition-colors ${
          isActive ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
        }`}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        {isFolder ? (
          <>
            {node.expanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
            {node.expanded ? <FolderOpen className="w-3.5 h-3.5 text-yellow-400 shrink-0" /> : <Folder className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            <FileCode className={`w-3.5 h-3.5 shrink-0 ${fileIcon(node.name)}`} />
          </>
        )}
        <span className="truncate flex-1">{node.name}</span>
        {isDirty && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
      </div>

      {isFolder && node.expanded && node.children?.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}

      {ctx && (
        <ContextMenu x={ctx.x} y={ctx.y} node={node} onClose={() => setCtx(null)} />
      )}
    </>
  );
}

// ── File Explorer Panel ─────────────────────────────────────
export default function FileExplorer() {
  const { tree, projectName, setProjectName, createFile } = useBuilderStore();
  const [editingName, setEditingName] = useState(false);

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Project header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        {editingName ? (
          <InlineInput
            defaultValue={projectName}
            onSubmit={(val) => { setProjectName(val); setEditingName(false); }}
            onCancel={() => setEditingName(false)}
          />
        ) : (
          <span
            className="text-gray-300 font-semibold uppercase tracking-wider truncate cursor-pointer hover:text-white"
            onDoubleClick={() => setEditingName(true)}
          >
            {projectName}
          </span>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => createFile('root', 'untitled.js', 'file')}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => createFile('root', 'new-folder', 'folder')}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {tree.children?.map((child) => (
          <TreeNode key={child.id} node={child} depth={0} />
        ))}
      </div>
    </div>
  );
}
