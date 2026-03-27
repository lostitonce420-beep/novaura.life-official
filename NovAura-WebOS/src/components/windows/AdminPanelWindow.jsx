import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, Users, Search, Crown, AlertTriangle, CheckCircle, XCircle,
  Ban, UserPlus, Key, Eye, Trash2, Edit3, Mail, MoreVertical,
  Activity, FileText, Image, Flag, ChevronDown, ChevronRight,
  Settings, Download, Send, RefreshCw, X, Plus, Clock, Star
} from 'lucide-react';

const OWNER_EMAILS = ['the.lost.catalyst@gmail.com', 'Dillan.Copeland@Novauraverse.com', 'admin@novaura.life'];
import { BACKEND_URL } from '../../services/aiService';

const ROLES = [
  { id: 'admin', label: 'Admin', color: 'text-red-400 bg-red-500/20', desc: 'Full platform control' },
  { id: 'moderator', label: 'Moderator', color: 'text-amber-400 bg-amber-500/20', desc: 'Content review & user management' },
  { id: 'creator', label: 'Creator', color: 'text-purple-400 bg-purple-500/20', desc: 'Can publish to marketplace' },
  { id: 'buyer', label: 'User', color: 'text-cyan-400 bg-cyan-500/20', desc: 'Standard account' },
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'content', label: 'Content Review', icon: Image },
  { id: 'staff', label: 'Staff', icon: Crown },
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Mock data for when backend isn't connected
const MOCK_USERS = [
  { id: '1', username: 'Dillan', email: 'the.lost.catalyst@gmail.com', role: 'admin', membership_tier: 'catalyst', status: 'active', created_at: '2025-12-01', consciousness_coins: 99999 },
  { id: '2', username: 'NeonRider', email: 'neon@example.com', role: 'creator', membership_tier: 'pro', status: 'active', created_at: '2026-01-15', consciousness_coins: 2400 },
  { id: '3', username: 'PixelMaster', email: 'pixel@example.com', role: 'buyer', membership_tier: 'free', status: 'active', created_at: '2026-02-20', consciousness_coins: 150 },
  { id: '4', username: 'ShadowArt', email: 'shadow@example.com', role: 'buyer', membership_tier: 'free', status: 'suspended', created_at: '2026-03-01', consciousness_coins: 0 },
  { id: '5', username: 'CodeBreaker', email: 'code@example.com', role: 'moderator', membership_tier: 'pro', status: 'active', created_at: '2026-01-30', consciousness_coins: 5200 },
];

const MOCK_REPORTS = [
  { id: 'r1', type: 'content', reporter: 'PixelMaster', target: 'Inappropriate image in gallery', status: 'pending', date: '2026-03-20' },
  { id: 'r2', type: 'user', reporter: 'NeonRider', target: 'ShadowArt — spam messages', status: 'resolved', date: '2026-03-18' },
  { id: 'r3', type: 'content', reporter: 'CodeBreaker', target: 'Copyrighted asset uploaded', status: 'pending', date: '2026-03-21' },
];

export default function AdminPanelWindow() {
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState(MOCK_USERS);
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [staffInviteEmail, setStaffInviteEmail] = useState('');
  const [staffInviteTitle, setStaffInviteTitle] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [actionLog, setActionLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_action_log') || '[]'); } catch { return []; }
  });

  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user_data') || '{}'); } catch { return {}; }
  }, []);

  const isOwner = OWNER_EMAILS.includes(currentUser?.email);
  const isAdmin = currentUser?.role === 'admin' || isOwner;

  const logAction = (action) => {
    const entry = { id: `log-${Date.now()}`, action, by: currentUser?.username || 'Admin', at: new Date().toISOString() };
    const updated = [entry, ...actionLog].slice(0, 100);
    setActionLog(updated);
    localStorage.setItem('admin_action_log', JSON.stringify(updated));
  };

  // Try to load real users from backend
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    fetch(`${BACKEND_URL}/api/auth/staff-allowlist`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.allowlist) setStaffList(data.allowlist);
    }).catch(() => {});
  }, []);

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => roleFilter === 'all' || u.role === roleFilter)
      .filter(u => !userSearch || u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));
  }, [users, userSearch, roleFilter]);

  const updateUserRole = (userId, newRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    logAction(`Changed ${users.find(u => u.id === userId)?.username}'s role to ${newRole}`);
    // API call
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      }).catch(() => {});
    }
  };

  const toggleBan = (userId) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u));
    const user = users.find(u => u.id === userId);
    logAction(`${user?.status === 'suspended' ? 'Unbanned' : 'Banned'} ${user?.username}`);
  };

  const resetPassword = (userId) => {
    const user = users.find(u => u.id === userId);
    logAction(`Reset password for ${user?.username}`);
    // Would send reset email via API
  };

  const inviteStaff = () => {
    if (!staffInviteEmail.trim()) return;
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch(`${BACKEND_URL}/api/auth/staff-invite`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staffInviteEmail, firstName: 'Staff', lastName: 'Member', title: staffInviteTitle || 'Team Member' })
      }).then(r => r.json()).then(data => {
        if (data.ok) {
          logAction(`Invited ${staffInviteEmail} as staff`);
          setStaffInviteEmail(''); setStaffInviteTitle('');
        }
      }).catch(() => {
        logAction(`Invited ${staffInviteEmail} as staff (offline)`);
        setStaffInviteEmail(''); setStaffInviteTitle('');
      });
    }
  };

  const resolveReport = (reportId) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    logAction(`Resolved report ${reportId}`);
  };

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <Shield className="w-12 h-12 text-red-400 mb-3" />
        <div className="text-sm font-semibold">Access Denied</div>
        <div className="text-[10px] text-slate-500 mt-1">Admin privileges required</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <Shield className="w-4 h-4 text-red-400" />
        <span className="text-sm font-semibold">Admin Panel</span>
        {isOwner && <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">Owner</span>}
        <span className="text-[9px] text-slate-500 ml-auto">{currentUser?.username || 'Admin'}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 shrink-0 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 px-3 py-2 text-[9px] font-medium border-b-2 whitespace-nowrap transition-all ${tab === t.id ? 'border-red-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              <Icon className="w-3 h-3" />{t.label}
              {t.id === 'reports' && reports.filter(r => r.status === 'pending').length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* Overview */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-4 gap-2">
              {[
                ['Total Users', users.length, Users, 'text-cyan-400'],
                ['Active', users.filter(u => u.status === 'active').length, CheckCircle, 'text-emerald-400'],
                ['Suspended', users.filter(u => u.status === 'suspended').length, Ban, 'text-red-400'],
                ['Reports', reports.filter(r => r.status === 'pending').length, Flag, 'text-amber-400'],
              ].map(([label, count, Icon, color]) => (
                <div key={label} className="p-2.5 bg-slate-900/50 border border-slate-800 rounded-lg text-center">
                  <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-[8px] text-slate-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                <div className="text-[9px] text-slate-500 uppercase mb-2">Role Distribution</div>
                {ROLES.map(r => {
                  const count = users.filter(u => u.role === r.id).length;
                  return (
                    <div key={r.id} className="flex items-center justify-between py-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${r.color}`}>{r.label}</span>
                      <span className="text-[10px] text-slate-400">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                <div className="text-[9px] text-slate-500 uppercase mb-2">Recent Actions</div>
                {actionLog.length === 0 ? (
                  <div className="text-[10px] text-slate-600">No actions yet</div>
                ) : (
                  actionLog.slice(0, 5).map(log => (
                    <div key={log.id} className="py-1 border-b border-slate-800/50 last:border-0">
                      <div className="text-[9px] text-slate-300 truncate">{log.action}</div>
                      <div className="text-[8px] text-slate-600">{log.by} · {new Date(log.at).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Users */}
        {tab === 'users' && (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..."
                  className="w-full pl-7 pr-2 py-1.5 bg-black/30 border border-slate-800 rounded text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-red-600/50" />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[9px] text-slate-400">
                <option value="all">All Roles</option>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div className="text-[9px] text-slate-500">{filteredUsers.length} users</div>
            {filteredUsers.map(u => {
              const role = ROLES.find(r => r.id === u.role) || ROLES[3];
              return (
                <div key={u.id} className={`p-2.5 rounded-lg border transition-all ${u.status === 'suspended' ? 'bg-red-950/20 border-red-900/30' : 'bg-slate-900/40 border-slate-800'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {u.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium truncate">{u.username}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded ${role.color}`}>{role.label}</span>
                        {u.status === 'suspended' && <span className="text-[8px] px-1 py-0.5 rounded bg-red-500/20 text-red-400">Banned</span>}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">{u.email}</div>
                      <div className="text-[8px] text-slate-600">Joined {new Date(u.created_at).toLocaleDateString()} · {u.consciousness_coins} coins · {u.membership_tier}</div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <button onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white" title="Details">
                        <Eye className="w-3 h-3" />
                      </button>
                      <button onClick={() => toggleBan(u.id)}
                        className={`p-1 rounded ${u.status === 'suspended' ? 'hover:bg-emerald-900/30 text-emerald-500' : 'hover:bg-red-900/30 text-slate-500 hover:text-red-400'}`}
                        title={u.status === 'suspended' ? 'Unban' : 'Ban'}>
                        <Ban className="w-3 h-3" />
                      </button>
                      <button onClick={() => resetPassword(u.id)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-amber-400" title="Reset Password">
                        <Key className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {selectedUser?.id === u.id && (
                    <div className="mt-2 pt-2 border-t border-slate-800 space-y-2">
                      <div className="text-[9px] text-slate-500 uppercase">Change Role</div>
                      <div className="flex gap-1">
                        {ROLES.map(r => (
                          <button key={r.id} onClick={() => updateUserRole(u.id, r.id)}
                            className={`px-2 py-1 rounded text-[8px] transition-all ${u.role === r.id ? `${r.color} border border-current` : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-600'}`}>
                            {r.label}
                          </button>
                        ))}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase mt-1">Quick Actions</div>
                      <div className="flex gap-1">
                        <button className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[8px] text-slate-400 hover:text-white flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5" /> Email
                        </button>
                        <button className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[8px] text-slate-400 hover:text-white flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" /> View Activity
                        </button>
                        {isOwner && (
                          <button onClick={() => { setUsers(prev => prev.filter(x => x.id !== u.id)); logAction(`Deleted account: ${u.username}`); setSelectedUser(null); }}
                            className="px-2 py-1 bg-red-900/20 border border-red-800/30 rounded text-[8px] text-red-400 hover:text-red-300 flex items-center gap-1">
                            <Trash2 className="w-2.5 h-2.5" /> Delete Account
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Content Review */}
        {tab === 'content' && (
          <>
            <div className="text-center py-6">
              <Image className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <div className="text-xs text-slate-400 mb-1">Content Moderation Queue</div>
              <div className="text-[9px] text-slate-600">Review flagged images, assets, and user-generated content</div>
            </div>
            <div className="space-y-2">
              {reports.filter(r => r.type === 'content').map(r => (
                <div key={r.id} className={`p-3 rounded-lg border ${r.status === 'pending' ? 'bg-amber-950/10 border-amber-800/30' : 'bg-slate-900/30 border-slate-800'}`}>
                  <div className="flex items-center gap-2">
                    <Flag className={`w-3.5 h-3.5 shrink-0 ${r.status === 'pending' ? 'text-amber-400' : 'text-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium">{r.target}</div>
                      <div className="text-[9px] text-slate-500">Reported by {r.reporter} · {r.date}</div>
                    </div>
                    {r.status === 'pending' ? (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => resolveReport(r.id)} className="p-1 bg-emerald-900/30 hover:bg-emerald-800/30 rounded text-emerald-400" title="Approve"><CheckCircle className="w-3 h-3" /></button>
                        <button onClick={() => { resolveReport(r.id); logAction(`Removed content: ${r.target}`); }} className="p-1 bg-red-900/30 hover:bg-red-800/30 rounded text-red-400" title="Remove"><XCircle className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <span className="text-[8px] text-emerald-400">Resolved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Staff */}
        {tab === 'staff' && (
          <>
            {isOwner && (
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
                <div className="text-[9px] text-slate-500 uppercase">Invite Staff Member</div>
                <div className="flex gap-2">
                  <input value={staffInviteEmail} onChange={e => setStaffInviteEmail(e.target.value)} placeholder="Email address"
                    className="flex-1 px-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-red-600/50" />
                  <input value={staffInviteTitle} onChange={e => setStaffInviteTitle(e.target.value)} placeholder="Title"
                    className="w-28 px-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white placeholder-slate-500 focus:outline-none" />
                  <button onClick={inviteStaff} disabled={!staffInviteEmail.trim()}
                    className="px-3 py-1.5 bg-red-600/50 hover:bg-red-500/50 rounded text-[10px] text-red-200 disabled:opacity-30">
                    <UserPlus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            <div className="text-[9px] text-slate-500 uppercase">Current Staff</div>
            {users.filter(u => u.role === 'admin' || u.role === 'moderator').map(u => {
              const role = ROLES.find(r => r.id === u.role) || ROLES[0];
              return (
                <div key={u.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                  <Crown className={`w-4 h-4 shrink-0 ${u.role === 'admin' ? 'text-amber-400' : 'text-cyan-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium">{u.username}</div>
                    <div className="text-[9px] text-slate-500">{u.email}</div>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded ${role.color}`}>{role.label}</span>
                </div>
              );
            })}
            {staffList.length > 0 && (
              <>
                <div className="text-[9px] text-slate-500 uppercase mt-2">Pending Invites</div>
                {staffList.filter(s => !s.used).map(s => (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/30 border border-dashed border-slate-800">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] truncate">{s.email}</div>
                      <div className="text-[8px] text-slate-600">{s.title} · Invited {new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className="text-[8px] text-amber-400">Pending</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-[9px] text-slate-500 uppercase">{reports.length} Reports</div>
              <div className="flex gap-1">
                <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">{reports.filter(r => r.status === 'pending').length} Pending</span>
                <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">{reports.filter(r => r.status === 'resolved').length} Resolved</span>
              </div>
            </div>
            {reports.map(r => (
              <div key={r.id} className={`p-3 rounded-lg border ${r.status === 'pending' ? 'bg-amber-950/10 border-amber-800/30' : 'bg-slate-900/30 border-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <Flag className={`w-3.5 h-3.5 shrink-0 ${r.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium">{r.target}</span>
                      <span className="text-[7px] px-1 py-0.5 bg-slate-800 text-slate-400 rounded uppercase">{r.type}</span>
                    </div>
                    <div className="text-[9px] text-slate-500">Reported by {r.reporter} · {r.date}</div>
                  </div>
                  {r.status === 'pending' ? (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => resolveReport(r.id)} className="px-2 py-1 bg-emerald-900/30 hover:bg-emerald-800/30 rounded text-[8px] text-emerald-400">Resolve</button>
                      <button onClick={() => { resolveReport(r.id); logAction(`Escalated report: ${r.target}`); }} className="px-2 py-1 bg-red-900/30 hover:bg-red-800/30 rounded text-[8px] text-red-400">Escalate</button>
                    </div>
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Settings */}
        {tab === 'settings' && (
          <>
            <div className="text-[9px] text-slate-500 uppercase">Platform Settings</div>
            {[
              ['Staff Registration', 'Allow new staff to register via invite', true],
              ['Content Auto-Moderation', 'AI-powered content screening', false],
              ['Maintenance Mode', 'Show maintenance page to non-admins', false],
              ['New User Registration', 'Allow public signups', true],
              ['Marketplace Submissions', 'Accept new marketplace submissions', true],
            ].map(([label, desc, defaultVal]) => (
              <ToggleSetting key={label} label={label} desc={desc} defaultVal={defaultVal} />
            ))}
            <div className="text-[9px] text-slate-500 uppercase mt-2">Danger Zone</div>
            <div className="p-3 bg-red-950/10 border border-red-900/20 rounded-lg space-y-2">
              <button className="w-full py-2 bg-red-900/30 hover:bg-red-800/30 border border-red-800/30 rounded text-[10px] text-red-400 flex items-center justify-center gap-1">
                <Download className="w-3 h-3" /> Export All User Data
              </button>
              <button className="w-full py-2 bg-red-900/30 hover:bg-red-800/30 border border-red-800/30 rounded text-[10px] text-red-400 flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3" /> Reset Platform Cache
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ToggleSetting({ label, desc, defaultVal }) {
  const [enabled, setEnabled] = useState(defaultVal);
  return (
    <div className="flex items-center justify-between p-2.5 bg-slate-900/40 border border-slate-800 rounded-lg">
      <div>
        <div className="text-[10px] font-medium">{label}</div>
        <div className="text-[8px] text-slate-500">{desc}</div>
      </div>
      <button onClick={() => setEnabled(!enabled)}
        className={`w-9 h-5 rounded-full transition-all ${enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4.5' : 'translate-x-0.5'} translate-y-[2px]`} />
      </button>
    </div>
  );
}
