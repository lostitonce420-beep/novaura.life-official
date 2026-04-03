import React, { useState } from 'react';
import { BookOpen, Search, Plus, Download, Trash2, FileText, Clock, SortAsc, ArrowLeft, Edit3, Save, Copy } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

export default function WritingLibraryWindow() {
  const [docs, setDocs] = useState(() => {
    try { return JSON.parse(kernelStorage.getItem('writing_library') || '[]'); } catch { return []; }
  });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [editing, setEditing] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  const saveDocs = (updated) => { setDocs(updated); kernelStorage.setItem('writing_library', JSON.stringify(updated)); };

  const createDoc = () => {
    const doc = { id: `doc-${Date.now()}`, title: 'Untitled', content: '', format: 'text', wordCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    saveDocs([doc, ...docs]);
    openDoc(doc);
  };

  const openDoc = (doc) => { setEditing(doc); setEditTitle(doc.title); setEditContent(doc.content); };

  const saveDoc = () => {
    if (!editing) return;
    const updated = docs.map(d => d.id === editing.id ? { ...d, title: editTitle, content: editContent, wordCount: editContent.trim().split(/\s+/).filter(Boolean).length, updatedAt: new Date().toISOString() } : d);
    saveDocs(updated);
    setEditing(null);
  };

  const deleteDoc = (id) => { if (confirm('Delete this document?')) saveDocs(docs.filter(d => d.id !== id)); };

  const exportDoc = (doc, format) => {
    const blob = new Blob([format === 'md' ? `# ${doc.title}\n\n${doc.content}` : doc.content], { type: 'text/plain' });
    const link = document.createElement('a'); link.download = `${doc.title}.${format}`; link.href = URL.createObjectURL(blob); link.click();
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); };

  const filtered = docs.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'recent' ? new Date(b.updatedAt) - new Date(a.updatedAt) : sortBy === 'oldest' ? new Date(a.updatedAt) - new Date(b.updatedAt) : a.title.localeCompare(b.title));

  // Editor view
  if (editing) {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border-b border-slate-800 shrink-0">
          <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-800 rounded"><ArrowLeft className="w-4 h-4" /></button>
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm font-semibold text-white focus:outline-none" placeholder="Document title" />
          <span className="text-[9px] text-slate-500">{editContent.trim().split(/\s+/).filter(Boolean).length} words</span>
          <button onClick={() => copyToClipboard(editContent)} title="Copy" className="p-1 hover:bg-slate-800 rounded text-slate-400"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={saveDoc} className="px-2.5 py-1 bg-cyan-600/50 hover:bg-cyan-500/50 rounded text-[10px] text-cyan-300 flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
        </div>
        <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Start writing..."
          className="flex-1 p-4 bg-transparent text-sm text-slate-200 leading-relaxed resize-none focus:outline-none placeholder-slate-600"
          autoFocus />
      </div>
    );
  }

  // Library view
  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-emerald-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold">Writing Library</span>
          <span className="text-[10px] text-slate-500">{docs.length} docs</span>
        </div>
        <button onClick={createDoc} className="p-1.5 bg-emerald-600/40 hover:bg-emerald-500/40 rounded text-emerald-300"><Plus className="w-3.5 h-3.5" /></button>
      </div>

      <div className="px-3 py-2 space-y-2 border-b border-slate-800/50 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."
            className="w-full pl-8 pr-3 py-1.5 bg-black/30 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600/50" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500">Sort:</span>
          {[['recent','Recent'],['oldest','Oldest'],['alpha','A-Z']].map(([id, label]) => (
            <button key={id} onClick={() => setSortBy(id)} className={`text-[10px] ${sortBy === id ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-xs text-slate-500 mb-3">{search ? 'No matches' : 'No documents yet'}</div>
            {!search && <button onClick={createDoc} className="px-4 py-2 bg-emerald-600/40 rounded-lg text-xs text-emerald-300">New Document</button>}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 transition-all group">
                <button onClick={() => openDoc(doc)} className="flex-1 text-left min-w-0">
                  <div className="text-xs font-medium truncate">{doc.title}</div>
                  <div className="text-[9px] text-slate-500 truncate">{doc.content.slice(0, 80) || 'Empty document'}</div>
                  <div className="text-[9px] text-slate-600 mt-0.5 flex items-center gap-2">
                    <span>{doc.wordCount} words</span>
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => exportDoc(doc, 'txt')} title="Export TXT" className="p-1 hover:bg-slate-800 rounded text-slate-500"><Download className="w-3 h-3" /></button>
                  <button onClick={() => exportDoc(doc, 'md')} title="Export MD" className="p-1 hover:bg-slate-800 rounded text-slate-500"><FileText className="w-3 h-3" /></button>
                  <button onClick={() => deleteDoc(doc.id)} title="Delete" className="p-1 hover:bg-red-900/30 rounded text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
