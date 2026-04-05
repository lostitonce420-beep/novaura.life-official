import React, { useState } from 'react';
import { 
  Clock, Plus, Filter, ChevronDown, ChevronRight, 
  AlertCircle, Users, MapPin, Edit2, Trash2
} from 'lucide-react';
import { EVENT_TYPES } from './StoryTimeline';

export default function TimelinePanel({ storyBible, onUpdateBible, onSelectEvent }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedEvents, setExpandedEvents] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const timeline = storyBible?.timeline || [];
  const characters = storyBible?.characters || [];

  const filteredTimeline = selectedFilter === 'all' 
    ? timeline 
    : timeline.filter(e => e.type === selectedFilter);

  const toggleExpand = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const getEventIcon = (type) => {
    const eventType = EVENT_TYPES[type?.toUpperCase()] || EVENT_TYPES.OTHER;
    return <span title={eventType.label}>{eventType.icon}</span>;
  };

  const getEventColor = (type) => {
    const eventType = EVENT_TYPES[type?.toUpperCase()] || EVENT_TYPES.OTHER;
    return eventType.color;
  };

  const handleAddEvent = (eventData) => {
    const newEvent = {
      id: `evt_${Date.now()}`,
      ...eventData,
      createdAt: Date.now()
    };
    
    onUpdateBible({
      ...storyBible,
      timeline: [...timeline, newEvent].sort((a, b) => a.dateOrder - b.dateOrder)
    });
    
    setShowAddForm(false);
  };

  const handleDeleteEvent = (eventId) => {
    if (confirm('Delete this event?')) {
      onUpdateBible({
        ...storyBible,
        timeline: timeline.filter(e => e.id !== eventId)
      });
    }
  };

  const getSignificanceBadge = (significance) => {
    const colors = {
      high: 'bg-red-400/20 text-red-400',
      medium: 'bg-yellow-400/20 text-yellow-400',
      low: 'bg-gray-400/20 text-gray-400'
    };
    return (
      <span className={`text-[8px] px-1 py-0.5 rounded ${colors[significance] || colors.low}`}>
        {significance}
      </span>
    );
  };

  // Group events by approximate time period
  const groupedEvents = filteredTimeline.reduce((acc, event) => {
    const chapter = event.chapterId || 'Unknown';
    if (!acc[chapter]) acc[chapter] = [];
    acc[chapter].push(event);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Timeline</span>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1 rounded hover:bg-white/10 text-gray-500"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] text-gray-500">
            {timeline.length} events
          </span>
          {storyBible?.lastConsistencyCheck && (
            <span className="text-[9px] text-green-400">
              Last check: {new Date(storyBible.lastConsistencyCheck).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 mt-2">
          <Filter className="w-3 h-3 text-gray-500" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-[#2a2a4a] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none"
          >
            <option value="all">All Events</option>
            {Object.values(EVENT_TYPES).map(type => (
              <option key={type.id} value={type.id}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Event Form */}
      {showAddForm && (
        <AddEventForm 
          characters={characters}
          onSubmit={handleAddEvent}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-2">
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-[11px]">No events recorded</p>
            <p className="text-[10px] text-gray-700 mt-1">
              Events are automatically detected or manually added
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedEvents).map(([chapter, events]) => (
              <div key={chapter}>
                <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 px-1">
                  {chapter === 'Unknown' ? 'Unsorted Events' : chapter}
                </div>
                <div className="space-y-1">
                  {events.map((event, idx) => (
                    <div
                      key={event.id}
                      className="relative pl-4 border-l-2 border-gray-700 hover:border-primary transition-colors"
                    >
                      {/* Event Card */}
                      <div 
                        className="p-2 rounded bg-[#252540] hover:bg-[#2a2a4a] cursor-pointer group"
                        onClick={() => toggleExpand(event.id)}
                      >
                        <div className="flex items-start gap-2">
                          <span 
                            className="text-lg"
                            style={{ color: getEventColor(event.type) }}
                          >
                            {getEventIcon(event.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium truncate">
                                {event.description}
                              </span>
                              {getSignificanceBadge(event.significance)}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                              {event.date && (
                                <span>{event.date}</span>
                              )}
                              {event.charactersInvolved?.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5">
                                    <Users className="w-2.5 h-2.5" />
                                    {event.charactersInvolved.length}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {expandedEvents[event.id] ? (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                          )}
                        </div>

                        {/* Expanded Details */}
                        {expandedEvents[event.id] && (
                          <div className="mt-2 pt-2 border-t border-white/10 space-y-2">
                            {event.impact && (
                              <div>
                                <span className="text-[9px] text-gray-500">Impact:</span>
                                <p className="text-[10px] text-gray-400">{event.impact}</p>
                              </div>
                            )}
                            
                            {event.charactersInvolved?.length > 0 && (
                              <div>
                                <span className="text-[9px] text-gray-500">Characters:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {event.charactersInvolved.map((char, i) => (
                                    <span 
                                      key={i}
                                      className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary"
                                    >
                                      {char}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {event.location && (
                              <div className="flex items-center gap-1 text-[9px] text-gray-500">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectEvent?.(event);
                                }}
                                className="p-1 rounded hover:bg-white/10 text-gray-500"
                                title="View in context"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event.id);
                                }}
                                className="p-1 rounded hover:bg-white/10 text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Add Event Form Component
function AddEventForm({ characters, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'other',
    description: '',
    date: '',
    significance: 'medium',
    charactersInvolved: [],
    location: '',
    impact: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="px-3 py-2 bg-[#252540] border-b border-[#2a2a4a]">
      <p className="text-[10px] text-gray-500 mb-2">Add Event</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full bg-[#1e1e2e] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none"
          >
            {Object.values(EVENT_TYPES).map(type => (
              <option key={type.id} value={type.id}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder="Description..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-[#1e1e2e] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none"
          required
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Date/Chapter..."
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="flex-1 bg-[#1e1e2e] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none"
          />
          <select
            value={formData.significance}
            onChange={(e) => setFormData({ ...formData, significance: e.target.value })}
            className="bg-[#1e1e2e] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <input
          type="text"
          placeholder="Location (optional)..."
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full bg-[#1e1e2e] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none"
        />
        <textarea
          placeholder="Impact on story (optional)..."
          value={formData.impact}
          onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
          className="w-full bg-[#1e1e2e] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none resize-none h-10"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-3 py-1 bg-primary/20 text-primary rounded text-[10px] hover:bg-primary/30"
          >
            Add Event
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 bg-white/10 text-gray-400 rounded text-[10px] hover:bg-white/15"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
