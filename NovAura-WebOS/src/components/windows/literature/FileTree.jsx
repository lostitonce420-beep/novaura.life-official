import React, { useState } from 'react';
import {
  FolderOpen, Folder, FileText, ChevronRight, ChevronDown,
  Plus, Trash2, Edit3, FilePlus, FolderPlus,
} from 'lucide-react';

function TreeNode({ node, depth = 0, activeFileId, onSelect, onRename, onDelete, onToggle }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const isFolder = node.type === 'folder';
  const isActive = node.id === activeFileId;

  const handleRename = () => {
    if (editName.trim() && editName !== node.name) {
      onRename(node.id, editName.trim());
    }
    setEditing(false);
  };

  return (
    <>
      <div
        className={`flex items-center gap-1 px-2 py-0.5 cursor-pointer group text-[12px] hover:bg-white/5 ${
          isActive ? 'bg-primary/15 text-primary' : 'text-gray-300'
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => isFolder ? onToggle(node.id) : onSelect(node)}
      >
        {/* Expand/collapse arrow for folders */}
        {isFolder ? (
          node.expanded ? (
            <ChevronDown className="w-3 h-3 flex-shrink-0 text-gray-500" />
          ) : (
            <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-500" />
          )
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}

        {/* Icon */}
        {isFolder ? (
          node.expanded ? (
            <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-yellow-400" />
          ) : (
            <Folder className="w-3.5 h-3.5 flex-shrink-0 text-yellow-400" />
          )
        ) : (
          <FileText className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
        )}

        {/* Name */}
        {editing ? (
          <input
            className="flex-1 bg-black/50 border border-primary/40 rounded px-1 text-[12px] text-white outline-none"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setEditing(false);
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate">{node.name}</span>
        )}

        {/* Actions (show on hover) */}
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); setEditName(node.name); }}
            className="p-0.5 hover:text-primary"
          >
            <Edit3 className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            className="p-0.5 hover:text-red-400"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {isFolder && node.expanded && node.children?.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          activeFileId={activeFileId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

export default function FileTree({ files, activeFileId, onSelect, onUpdate }) {
  const generateId = () => `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const updateNode = (tree, id, updater) => {
    if (tree.id === id) return updater(tree);
    if (tree.children) {
      return { ...tree, children: tree.children.map((c) => updateNode(c, id, updater)) };
    }
    return tree;
  };

  const removeNode = (tree, id) => {
    if (tree.id === id) return null;
    if (tree.children) {
      return { ...tree, children: tree.children.map((c) => removeNode(c, id)).filter(Boolean) };
    }
    return tree;
  };

  const addToFolder = (tree, folderId, newNode) => {
    if (tree.id === folderId && tree.type === 'folder') {
      return { ...tree, expanded: true, children: [...(tree.children || []), newNode] };
    }
    if (tree.children) {
      return { ...tree, children: tree.children.map((c) => addToFolder(c, folderId, newNode)) };
    }
    return tree;
  };

  const handleRename = (id, newName) => {
    onUpdate(updateNode(files, id, (n) => ({ ...n, name: newName })));
  };

  const handleDelete = (id) => {
    if (id === files.id) return; // Don't delete root
    onUpdate(removeNode(files, id));
  };

  const handleToggle = (id) => {
    onUpdate(updateNode(files, id, (n) => ({ ...n, expanded: !n.expanded })));
  };

  const handleNewFile = () => {
    const newFile = { id: generateId(), name: 'Untitled', type: 'file', content: '' };
    onUpdate(addToFolder(files, files.id, newFile));
  };

  const handleNewFolder = () => {
    const newFolder = { id: generateId(), name: 'New Folder', type: 'folder', expanded: true, children: [] };
    onUpdate(addToFolder(files, files.id, newFolder));
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a4a] text-[11px] uppercase tracking-wider text-gray-500">
        <span>Explorer</span>
        <div className="flex gap-1">
          <button onClick={handleNewFile} className="p-0.5 hover:text-primary" title="New File">
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleNewFolder} className="p-0.5 hover:text-primary" title="New Folder">
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto py-1">
        <TreeNode
          node={files}
          activeFileId={activeFileId}
          onSelect={onSelect}
          onRename={handleRename}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}
