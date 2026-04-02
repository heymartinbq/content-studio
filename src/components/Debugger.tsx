/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useEditor } from "../core/EditorContext";
import { motion } from "motion/react";
import { Terminal, Activity, X, Hash, Clock, Database, Braces } from "lucide-react";

export default function Debugger() {
  const { state, actions } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"journal" | "state">("journal");

  // Shortcut to toggle debugger: Ctrl + Shift + D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: 20 }}
      className="fixed top-8 right-8 z-[999] w-96 h-[600px] bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <Terminal size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Core Debugger</h3>
            <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest">Traceability & State</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-white/10 rounded-full text-white/20 hover:text-white transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-1 bg-black/20 mx-6 mt-4 rounded-2xl border border-white/5">
        <button
          onClick={() => setActiveTab("journal")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "journal" ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
          }`}
        >
          <Activity size={12} />
          Journal
        </button>
        <button
          onClick={() => setActiveTab("state")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "state" ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
          }`}
        >
          <Database size={12} />
          Raw State
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeTab === "journal" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Last 50 Events</span>
              <button 
                onClick={actions.clearJournal}
                className="text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear Log
              </button>
            </div>
            {state.journal.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/10 italic">
                <Activity size={32} className="mb-4 opacity-10" />
                <span className="text-xs">No events logged yet</span>
              </div>
            ) : (
              state.journal.map((entry) => (
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  key={entry.id} 
                  className="group bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                      {entry.action}
                    </span>
                    <span className="text-[8px] font-mono text-white/10 group-hover:text-white/40 transition-colors">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  {entry.payload && (
                    <div className="text-[9px] font-mono text-white/30 truncate max-w-full">
                      {typeof entry.payload === 'object' ? JSON.stringify(entry.payload) : String(entry.payload)}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Current Config Snapshot</span>
              <Braces size={12} className="text-green-400 opacity-40" />
            </div>
            <pre className="text-[10px] font-mono text-green-400/80 bg-black/40 p-4 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar">
              {JSON.stringify(state.config, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Hash size={10} className="text-white/20" />
            <span className="text-[9px] font-black text-white/40">{state.config.layers.length} Layers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={10} className="text-white/20" />
            <span className="text-[9px] font-black text-white/40">{state.isPreview ? "PREVIEW_MODE" : "EDIT_MODE"}</span>
          </div>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
      </div>
    </motion.div>
  );
}
