import React, { useState } from 'react';
import { Users, MapPin, BookOpen, GitBranch, Plus, Trash2, Edit3, ChevronDown, ChevronRight, Save } from 'lucide-react';

const TABS = [
  { id: 'characters', label: 'Characters', icon: Users, color: 'text-purple-400' },
  { id: 'settings', label: 'Settings', icon: MapPin, color: 'text-green-400' },
  { id: 'rules', label: 'Rules', icon: BookOpen, color: 'text-yellow-400' },
  { id: 'plotThreads', label: 'Plot Threads', icon: GitBranch, color: 'text-cyan-400' },
];

function EntryEditor({ entry, onSave, onCancel }) {
  const [name, setName] = useState(entry?.name || '');
  const [description, setDescription] = useState(entry?.description || '');
  const [traits, setTraits] = useState(entry?.traits || '');
  const [notes, setNotes] = useState(entry?.notes || '');

  return (
    <div className="p-2 bg-[#2a2a4a] rounded border border-gray-700 space-y-1.5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full bg-[#1a1a2e] text-white text-[11px] rounded px-2 py-1 border border-gray-700 outline-none"
        autoFocus
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full bg-[#1a1a2e] text-white text-[11px] rounded px-2 py-1 border border-gray-700 outline-none resize-none"
      />
      <input
        value={traits}
        onChange={(e) => setTraits(e.target.value)}
        placeholder="Traits / Tags (comma-separated)"
        className="w-full bg-[#1a1a2e] text-white text-[11px] rounded px-2 py-1 border border-gray-700 outline-none"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        rows={2}
        className="w-full bg-[#1a1a2e] text-white text-[11px] rounded px-2 py-1 border border-gray-700 outline-none resize-none"
      />
      <div className="flex gap-1.5">
        <button
          onClick={() => onSave({ ...entry, name, description, traits, notes, id: entry?.id || `sb_${Date.now()}` })}
          className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 hover:bg-primary/30 text-primary text-[10px] rounded"
        >
          <Save className="w-2.5 h-2.5" /> Save
        </button>
        <button onClick={onCancel} className="px-2 py-0.5 text-[10px] text-gray-500 hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  );
}

function EntryCard({ entry, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#3a3a5a] rounded bg-[#222238] overflow-hidden">
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-white/5"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
        <span className="text-[11px] font-medium text-gray-200 flex-1">{entry.name}</span>
        {entry.traits && (
          <span className="text-[9px] text-gray-500 truncate max-w-[100px]">{entry.traits}</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className="text-gray-500 hover:text-primary">
          <Edit3 className="w-2.5 h-2.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} className="text-gray-500 hover:text-red-400">
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
      {expanded && (
        <div className="px-2.5 py-2 border-t border-[#3a3a5a] space-y-1 text-[10px]">
          {entry.description && <p className="text-gray-300">{entry.description}</p>}
          {entry.traits && (
            <div className="flex flex-wrap gap-1">
              {entry.traits.split(',').map((t, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[9px]">{t.trim()}</span>
              ))}
            </div>
          )}
          {entry.notes && <p className="text-gray-500 italic">{entry.notes}</p>}
        </div>
      )}
    </div>
  );
}

export default function StoryBible({ bible, onUpdate }) {
  const [activeTab, setActiveTab] = useState('characters');
  const [editing, setEditing] = useState(null); // null | 'new' | entry object
  const [view, setView] = useState('bible'); // 'bible' | 'graph' (future)

  const entries = bible[activeTab] || [];

  const handleSave = (entry) => {
    const list = bible[activeTab] || [];
    const exists = list.find((e) => e.id === entry.id);
    const updated = exists
      ? list.map((e) => (e.id === entry.id ? entry : e))
      : [...list, entry];
    onUpdate({ ...bible, [activeTab]: updated });
    setEditing(null);
  };

  const handleDelete = (id) => {
    onUpdate({ ...bible, [activeTab]: (bible[activeTab] || []).filter((e) => e.id !== id) });
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[11px] uppercase tracking-wider text-gray-500">Story Bible</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = (bible[tab.id] || []).length;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setEditing(null); }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  activeTab === tab.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className={`w-3 h-3 ${tab.color}`} />
                {tab.label}
                {count > 0 && <span className="text-[8px] text-gray-600">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {editing ? (
          <EntryEditor
            entry={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            {TABS.find((t) => t.id === activeTab)?.icon &&
              React.createElement(TABS.find((t) => t.id === activeTab).icon, { className: 'w-8 h-8 mb-2 opacity-30' })}
            <p className="text-[11px]">No {activeTab} yet</p>
          </div>
        ) : (
          entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Add button */}
      {!editing && (
        <div className="p-2 border-t border-[#2a2a4a]">
          <button
            onClick={() => setEditing('new')}
            className="w-full flex items-center justify-center gap-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] rounded"
          >
            <Plus className="w-3 h-3" /> Add {activeTab.replace(/s$/, '').replace('Thread', ' Thread')}
          </button>
        </div>
      )}
    </div>
  );
}
