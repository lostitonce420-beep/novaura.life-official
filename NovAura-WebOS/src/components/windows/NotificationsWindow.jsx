import React, { useState } from 'react';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Settings, X,
  MessageSquare, Heart, UserPlus, Star, Coins, ShoppingBag,
  Award, Gamepad2, AlertCircle, Info, Moon
} from 'lucide-react';

const TYPE_CONFIG = {
  message:  { icon: MessageSquare, color: 'bg-blue-500/20 text-blue-400' },
  like:     { icon: Heart, color: 'bg-pink-500/20 text-pink-400' },
  follow:   { icon: UserPlus, color: 'bg-purple-500/20 text-purple-400' },
  sale:     { icon: Coins, color: 'bg-amber-500/20 text-amber-400' },
  purchase: { icon: ShoppingBag, color: 'bg-green-500/20 text-green-400' },
  points:   { icon: Star, color: 'bg-yellow-500/20 text-yellow-400' },
  badge:    { icon: Award, color: 'bg-orange-500/20 text-orange-400' },
  game:     { icon: Gamepad2, color: 'bg-cyan-500/20 text-cyan-400' },
  system:   { icon: Info, color: 'bg-slate-500/20 text-slate-400' },
  alert:    { icon: AlertCircle, color: 'bg-red-500/20 text-red-400' },
};

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', type: 'follow', title: 'New Follower', content: 'CreativeArtist started following you', read: false, createdAt: Date.now() - 5 * 60000 },
  { id: 'n2', type: 'like', title: 'Someone liked your work', content: 'PixelMaster liked your "Cyberpunk City" artwork', read: false, createdAt: Date.now() - 30 * 60000 },
  { id: 'n3', type: 'sale', title: 'Item Sold!', content: 'Your "Character Sprite Pack" sold for 500 points', read: false, createdAt: Date.now() - 2 * 3600000 },
  { id: 'n4', type: 'badge', title: 'New Badge Earned!', content: 'You earned the "Art Master" badge', read: true, createdAt: Date.now() - 24 * 3600000 },
  { id: 'n5', type: 'message', title: 'New Message', content: 'GameDev123: Hey, love your work!', read: true, createdAt: Date.now() - 2 * 86400000 },
  { id: 'n6', type: 'game', title: 'Aetherium Challenge', content: 'NovaCatalyst challenged you to a duel!', read: true, createdAt: Date.now() - 3 * 86400000 },
  { id: 'n7', type: 'points', title: 'Daily Bonus', content: 'You received 100 bonus points!', read: true, createdAt: Date.now() - 4 * 86400000 },
  { id: 'n8', type: 'system', title: 'Platform Update', content: 'New features available! Check out the Script Fusion tool.', read: true, createdAt: Date.now() - 7 * 86400000 },
];

const DEFAULT_SETTINGS = {
  pushEnabled: true, emailEnabled: false,
  categories: { messages: true, social: true, marketplace: true, games: true, system: true },
  quietHours: { enabled: false, start: '22:00', end: '08:00' },
};

function formatTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function isToday(ts) {
  return new Date(ts).toDateString() === new Date().toDateString();
}

export default function NotificationsWindow() {
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nova_notifications')) || INITIAL_NOTIFICATIONS; } catch { return INITIAL_NOTIFICATIONS; }
  });
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nova_notification_settings')) || DEFAULT_SETTINGS; } catch { return DEFAULT_SETTINGS; }
  });
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  const save = (updated) => { setNotifications(updated); localStorage.setItem('nova_notifications', JSON.stringify(updated)); };
  const saveSettings = (updated) => { setSettings(updated); localStorage.setItem('nova_notification_settings', JSON.stringify(updated)); };

  const unreadCount = notifications.filter(n => !n.read).length;
  const markRead = (id) => save(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => save(notifications.map(n => ({ ...n, read: true })));
  const deleteOne = (id) => save(notifications.filter(n => n.id !== id));
  const clearAll = () => save([]);

  const filtered = notifications
    .filter(n => filter === 'unread' ? !n.read : true)
    .filter(n => typeFilter === 'all' ? true : n.type === typeFilter);
  const today = filtered.filter(n => isToday(n.createdAt));
  const earlier = filtered.filter(n => !isToday(n.createdAt));

  if (showSettings) {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-cyan-900/30 to-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold">Notification Settings</span>
          </div>
          <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-800 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[['pushEnabled', 'Push Notifications', 'Browser alerts'], ['emailEnabled', 'Email Notifications', 'Important updates']].map(([key, label, desc]) => (
              <button key={key} onClick={() => saveSettings({ ...settings, [key]: !settings[key] })}
                className={`p-3 rounded-lg border text-left transition-all ${settings[key] ? 'border-cyan-600/50 bg-cyan-900/20' : 'border-slate-800 bg-slate-900/30'}`}>
                <div className="text-xs font-medium">{label}</div>
                <div className="text-[9px] text-slate-500">{desc}</div>
                <div className={`mt-1 w-8 h-4 rounded-full transition-all ${settings[key] ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${settings[key] ? 'translate-x-4' : 'translate-x-0.5'} translate-y-[1px]`} />
                </div>
              </button>
            ))}
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-2">Categories</div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(settings.categories).map(([key, val]) => (
                <button key={key} onClick={() => saveSettings({ ...settings, categories: { ...settings.categories, [key]: !val } })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-all ${val ? 'bg-slate-800 text-white' : 'bg-slate-900/30 text-slate-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${val ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                  <span className="capitalize">{key}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
            <button onClick={() => saveSettings({ ...settings, quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled } })}
              className="flex items-center gap-2 w-full text-left">
              <Moon className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-medium flex-1">Quiet Hours</span>
              <div className={`w-8 h-4 rounded-full transition-all ${settings.quietHours.enabled ? 'bg-violet-500' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${settings.quietHours.enabled ? 'translate-x-4' : 'translate-x-0.5'} translate-y-[1px]`} />
              </div>
            </button>
            {settings.quietHours.enabled && (
              <div className="flex gap-3 mt-2 pt-2 border-t border-slate-800">
                {[['start', 'From'], ['end', 'Until']].map(([key, label]) => (
                  <div key={key}>
                    <div className="text-[9px] text-slate-500">{label}</div>
                    <input type="time" value={settings.quietHours[key]}
                      onChange={e => saveSettings({ ...settings, quietHours: { ...settings.quietHours, [key]: e.target.value } })}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-white" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-cyan-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
        </div>
        <div className="flex gap-1">
          <button onClick={markAllRead} disabled={unreadCount === 0}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 disabled:opacity-30" title="Mark all read">
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowSettings(true)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><Settings className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800/50 shrink-0">
        <div className="flex rounded overflow-hidden border border-slate-800">
          {[['all', 'All'], ['unread', `Unread (${unreadCount})`]].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`px-2.5 py-1 text-[10px] ${filter === id ? 'bg-cyan-600/50 text-cyan-200' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}>{label}</button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-400 ml-auto">
          <option value="all">All Types</option>
          {Object.keys(TYPE_CONFIG).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-xs text-slate-500">You're all caught up!</div>
          </div>
        ) : (
          <>
            {today.length > 0 && (
              <div>
                <div className="text-[9px] text-slate-500 uppercase font-semibold mb-1.5">Today</div>
                <div className="space-y-1">{today.map(n => <NotifItem key={n.id} n={n} onRead={markRead} onDelete={deleteOne} />)}</div>
              </div>
            )}
            {earlier.length > 0 && (
              <div>
                <div className="text-[9px] text-slate-500 uppercase font-semibold mb-1.5">Earlier</div>
                <div className="space-y-1">{earlier.map(n => <NotifItem key={n.id} n={n} onRead={markRead} onDelete={deleteOne} />)}</div>
              </div>
            )}
          </>
        )}
        {notifications.length > 0 && (
          <button onClick={clearAll} className="w-full text-center text-[10px] text-red-400/60 hover:text-red-400 py-2">
            <Trash2 className="w-3 h-3 inline mr-1" />Clear All
          </button>
        )}
      </div>
    </div>
  );
}

function NotifItem({ n, onRead, onDelete }) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
  const Icon = cfg.icon;
  return (
    <div className={`group flex items-start gap-2.5 p-2 rounded-lg border transition-all ${n.read ? 'bg-slate-900/30 border-slate-800/30' : 'bg-slate-900/60 border-slate-700 border-l-2 border-l-cyan-500'}`}>
      <div className={`p-1.5 rounded-lg shrink-0 ${cfg.color}`}><Icon className="w-3.5 h-3.5" /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-medium truncate ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.title}</span>
          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />}
        </div>
        <div className="text-[10px] text-slate-500 truncate">{n.content}</div>
        <div className="text-[9px] text-slate-600 mt-0.5">{formatTime(n.createdAt)}</div>
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!n.read && (
          <button onClick={() => onRead(n.id)} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-cyan-400" title="Mark read">
            <Check className="w-3 h-3" />
          </button>
        )}
        <button onClick={() => onDelete(n.id)} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400" title="Delete">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
