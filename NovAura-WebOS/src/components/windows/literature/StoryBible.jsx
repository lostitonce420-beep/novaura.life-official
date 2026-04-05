import React, { useState } from 'react';
import { Users, MapPin, BookOpen, GitBranch, Plus, Trash2, Edit3, ChevronDown, ChevronRight, Save, Clock, Heart, Target } from 'lucide-react';
import { EVENT_TYPES } from './StoryTimeline';

const TABS = [
  { id: 'characters', label: 'Characters', icon: Users, color: 'text-purple-400' },
  { id: 'settings', label: 'Settings', icon: MapPin, color: 'text-green-400' },
  { id: 'rules', label: 'Rules', icon: BookOpen, color: 'text-yellow-400' },
  { id: 'plotThreads', label: 'Plot Threads', icon: GitBranch, color: 'text-cyan-400' },
  { id: 'timeline', label: 'Timeline', icon: Clock, color: 'text-pink-400' },
  { id: 'relationships', label: 'Relationships', icon: Heart, color: 'text-red-400' },
];

function EntryEditor({ entry, onSave, onCancel, type }) {
  const [name, setName] = useState(entry?.name || '');
  const [description, setDescription] = useState(entry?.description || '');
  const [traits, setTraits] = useState(entry?.traits || '');
  const [notes, setNotes] = useState(entry?.notes || '');
  const [currentState, setCurrentState] = useState(entry?.currentState || '');
  const [arc, setArc] = useState(entry?.arc || '');

  const handleSave = () => {
    const data = { 
      ...entry, 
      name, 
      description, 
      traits, 
      notes,
      id: entry?.id || `sb_${Date.now()}` 
    };
    
    if (type === 'characters') {
      data.currentState = currentState;
      data.arc = arc;
    }
    
    onSave(data);
  };

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
      
      {type === 'characters' && (
        <>
          <input
            value={currentState}
            onChange={(e) => setCurrentState(e.target.value)}
            placeholder="Current State (e.g., Active, Injured, Deceased)"
            className="w-full bg-[#1a1a2e] text-white text-[11px] rounded px-2 py-1 border border-gray-700 outline-none"
          />
          <input
            value={arc}
            onChange={(e) => setArc(e.target.value)}
            placeholder="Character Arc"
            className="w-full bg-[#1a1a2e] text-white text-[11px] rounded px-2 py-1 border border-gray-700 outline-none"
          />
        </>
      )}
      
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
          onClick={handleSave}
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

function EntryCard({ entry, onEdit, onDelete, type }) {
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
        {entry.currentState && (
          <span className={`text-[8px] px-1.5 py-0.5 rounded ${
            entry.currentState === 'Deceased' ? 'bg-red-400/20 text-red-400' :
            entry.currentState === 'Injured' ? 'bg-orange-400/20 text-orange-400' :
            'bg-green-400/20 text-green-400'
          }`}>
            {entry.currentState}
          </span>
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
          {entry.arc && (
            <div className="text-gray-400">
              <span className="text-gray-500">Arc:</span> {entry.arc}
            </div>
          )}
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

// Timeline Event Card
function TimelineEventCard({ event, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const eventType = EVENT_TYPES[event.type?.toUpperCase()] || EVENT_TYPES.OTHER;

  return (
    <div className="border border-[#3a3a5a] rounded bg-[#222238] overflow-hidden">
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-white/5"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
        <span className="text-base" style={{ color: eventType.color }}>{eventType.icon}</span>
        <span className="text-[11px] font-medium text-gray-200 flex-1 truncate">{event.description}</span>
        {event.significance && (
          <span className={`text-[8px] px-1.5 py-0.5 rounded ${
            event.significance === 'high' ? 'bg-red-400/20 text-red-400' :
            event.significance === 'medium' ? 'bg-yellow-400/20 text-yellow-400' :
            'bg-gray-400/20 text-gray-400'
          }`}>
            {event.significance}
          </span>
        )}
        <button onClick={(e) => { e.stopPropagation(); onEdit(event); }} className="text-gray-500 hover:text-primary">
          <Edit3 className="w-2.5 h-2.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(event.id); }} className="text-gray-500 hover:text-red-400">
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
      {expanded && (
        <div className="px-2.5 py-2 border-t border-[#3a3a5a] space-y-1 text-[10px]">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-gray-500">Type:</span>
            <span style={{ color: eventType.color }}>{eventType.label}</span>
          </div>
          {event.date && (
            <div className="text-gray-400">
              <span className="text-gray-500">Date:</span> {event.date}
            </div>
          )}
          {event.charactersInvolved?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-gray-500">Characters:</span>
              {event.charactersInvolved.map((char, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-purple-400/20 text-purple-400 rounded text-[9px]">{char}</span>
              ))}
            </div>
          )}
          {event.location && (
            <div className="text-gray-400">
              <span className="text-gray-500">Location:</span> {event.location}
            </div>
          )}
          {event.impact && (
            <div className="text-gray-400">
              <span className="text-gray-500">Impact:</span> {event.impact}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Relationship Card
function RelationshipCard({ relationship, characters, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border border-[#3a3a5a] rounded bg-[#222238] overflow-hidden">
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-white/5"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
        <span className="text-[11px] font-medium text-gray-200 flex-1">
          {relationship.character1} ↔ {relationship.character2}
        </span>
        <span className={`text-[8px] px-1.5 py-0.5 rounded ${
          relationship.type === 'romance' ? 'bg-pink-400/20 text-pink-400' :
          relationship.type === 'rivalry' ? 'bg-red-400/20 text-red-400' :
          relationship.type === 'friendship' ? 'bg-green-400/20 text-green-400' :
          'bg-blue-400/20 text-blue-400'
        }`}>
          {relationship.type}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(relationship); }} className="text-gray-500 hover:text-red-400">
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
      {expanded && (
        <div className="px-2.5 py-2 border-t border-[#3a3a5a] space-y-1 text-[10px]">
          <div className="text-gray-400">
            <span className="text-gray-500">Status:</span> {relationship.status}
          </div>
          {relationship.evolution?.length > 0 && (
            <div>
              <span className="text-gray-500">Evolution:</span>
              <div className="mt-1 space-y-1">
                {relationship.evolution.map((ev, i) => (
                  <div key={i} className="pl-2 border-l-2 border-gray-600">
                    <span className="text-gray-400">{ev.type}</span>
                    {ev.note && <p className="text-gray-500 italic">{ev.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StoryBible({ bible, onUpdate }) {
  const [activeTab, setActiveTab] = useState('characters');
  const [editing, setEditing] = useState(null);

  const entries = bible[activeTab] || [];
  const relationships = bible.relationships || {};
  const characters = bible.characters || [];

  const handleSave = (entry) => {
    if (activeTab === 'relationships') {
      // Handle relationship separately
      return;
    }
    
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

  const handleDeleteRelationship = (rel) => {
    const key = [rel.char1Id, rel.char2Id].sort().join('_');
    const updated = { ...relationships };
    delete updated[key];
    onUpdate({ ...bible, relationships: updated });
  };

  const renderContent = () => {
    if (activeTab === 'relationships') {
      const relList = Object.values(relationships);
      return (
        <>
          {relList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <Heart className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-[11px]">No relationships tracked</p>
              <p className="text-[10px] text-gray-700">Relationships are auto-detected</p>
            </div>
          ) : (
            relList.map((rel) => (
              <RelationshipCard
                key={`${rel.char1Id}_${rel.char2Id}`}
                relationship={rel}
                characters={characters}
                onDelete={handleDeleteRelationship}
              />
            ))
          )}
        </>
      );
    }

    if (activeTab === 'timeline') {
      const timeline = bible.timeline || [];
      const sortedTimeline = [...timeline].sort((a, b) => (a.dateOrder || 0) - (b.dateOrder || 0));
      
      return (
        <>
          {editing ? (
            <div className="p-2 bg-[#2a2a4a] rounded border border-gray-700 space-y-1.5">
              <p className="text-[10px] text-gray-500">Add Timeline Event</p>
              {/* Simplified event editor */}
              <button onClick={() => setEditing(null)} className="px-2 py-0.5 text-[10px] text-gray-500">
                Cancel
              </button>
            </div>
          ) : sortedTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <Clock className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-[11px]">No events in timeline</p>
              <p className="text-[10px] text-gray-700">Events are auto-detected or use Timeline panel</p>
            </div>
          ) : (
            sortedTimeline.map((event) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            ))
          )}
        </>
      );
    }

    return (
      <>
        {editing ? (
          <EntryEditor
            entry={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            type={activeTab}
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
              type={activeTab}
            />
          ))
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[11px] uppercase tracking-wider text-gray-500">Story Bible</span>
        </div>

        {/* Tabs - 2 rows for better fit */}
        <div className="grid grid-cols-3 gap-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = (bible[tab.id] || []).length;
            const relCount = tab.id === 'relationships' ? Object.keys(relationships).length : 0;
            const displayCount = tab.id === 'relationships' ? relCount : count;
            
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setEditing(null); }}
                className={`flex items-center justify-center gap-1 px-1.5 py-1 rounded text-[9px] transition-colors ${
                  activeTab === tab.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className={`w-3 h-3 ${tab.color}`} />
                <span className="truncate">{tab.label}</span>
                {displayCount > 0 && <span className="text-[8px] text-gray-600">({displayCount})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {renderContent()}
      </div>

      {/* Add button - hide for tabs that are auto-managed */}
      {!editing && activeTab !== 'timeline' && activeTab !== 'relationships' && (
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
