import React from 'react';
import { GitBranch, Circle } from 'lucide-react';
import useBuilderStore from './useBuilderStore';

export default function StatusBar() {
  const { activeTab, findNode, detectLang, openTabs, dirty, flattenFiles, personas } = useBuilderStore();

  const activeNode = activeTab ? findNode(activeTab) : null;
  const language = activeNode ? detectLang(activeNode.name) : '';
  const charCount = activeNode?.content?.length || 0;
  const lineCount = activeNode?.content?.split('\n').length || 0;
  const totalFiles = flattenFiles().length;
  const dirtyCount = Object.values(dirty).filter(Boolean).length;
  const activePersona = personas.find((p) => p.active);

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-[#0a0a14] text-[10px] text-gray-500 select-none cybeni-statusbar">
      <div className="flex items-center gap-3">
        {activeNode && (
          <>
            <span className="text-gray-400">{activeNode.name}</span>
            <span>{language}</span>
            <span>Ln {lineCount}, Ch {charCount}</span>
          </>
        )}
        {dirtyCount > 0 && (
          <span className="flex items-center gap-1 text-primary">
            <Circle className="w-2 h-2 fill-current" />
            {dirtyCount} unsaved
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {activePersona && (
          <span className="text-primary">{activePersona.icon} {activePersona.name}</span>
        )}
        <span>{totalFiles} files</span>
        <span>{openTabs.length} tabs</span>
        <span className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" /> main
        </span>
      </div>
    </div>
  );
}
