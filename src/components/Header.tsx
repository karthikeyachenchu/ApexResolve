/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldCheck, Activity, Moon, Sun, LayoutDashboard, Terminal, GitBranch, FileSearch, Cog, Plug, Globe, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export type TabKey = 'site-monitor' | 'dashboard' | 'logs' | 'pipeline' | 'log-analysis' | 'automation' | 'integrations' | 'ai-lab';

const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: "site-monitor", label: "Sites", icon: Globe },
  { key: "dashboard", label: "Infrastructure", icon: LayoutDashboard },
  { key: "logs", label: "Diagnostics", icon: Terminal },
  { key: "pipeline", label: "CI/CD", icon: GitBranch },
  { key: "log-analysis", label: "Log Analysis", icon: FileSearch },
  { key: "automation", label: "Automation", icon: Cog },
  { key: "integrations", label: "Integrations", icon: Plug },
  { key: "ai-lab", label: "AI Lab", icon: Sparkles },
];

export default function Header({ activeTab, onTabChange }: { activeTab: TabKey, onTabChange: (tab: TabKey) => void }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">
            <span className="text-[var(--accent)]">Apex</span>
            <span className="text-[var(--ink)]">Resolve</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-0.5 border-l border-[var(--border)] pl-5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${activeTab === tab.key ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-white/5'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg hover:bg-[var(--panel-hover)] border border-[var(--border)] transition-all text-[var(--ink-muted)] hover:text-[var(--accent)]"
        >
          {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
        <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-[var(--border)]">
          <Activity className="w-3.5 h-3.5 text-[var(--success)]" />
          <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--ink-muted)]">Online</span>
        </div>
        <div className="w-7 h-7 rounded-full bg-[var(--border)] flex items-center justify-center text-[9px] font-bold border border-white/5">
          AR
        </div>
      </div>
    </header>
  );
}
