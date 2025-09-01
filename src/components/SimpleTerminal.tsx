import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface Tab {
  id: string;
  title: string;
  terminal: Terminal | null;
  fitAddon: FitAddon | null;
}

const SimpleTerminal: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const createNewTab = () => {
    const id = Date.now().toString();
    const terminal = new Terminal({
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true,
      theme: {
        background: '#0f0a0e',
        foreground: '#d7d7e0',
        cursor: '#ff2e6a',
        selection: '#ff2e6a40'
      }
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    const newTab: Tab = {
      id,
      title: 'Terminal',
      terminal,
      fitAddon
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);

    // Set up terminal event handlers
    terminal.onData((data) => {
      if (window.bridge) {
        window.bridge.write({ tabId: id, data });
      }
    });

    // Create terminal via IPC
    setTimeout(() => {
      const { cols, rows } = terminal;
      if (window.bridge) {
        window.bridge.create({
          tabId: id,
          cols,
          rows,
          shellPath: (typeof navigator !== 'undefined' && navigator.platform.indexOf('Win') !== -1) ? 'powershell.exe' : '/bin/bash'
        });
      }
    }, 100);

    return newTab;
  };

  const closeTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.terminal) {
      tab.terminal.dispose();
      if (window.bridge) {
        window.bridge.close({ tabId });
      }
    }

    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (filtered.length === 0) {
        setTimeout(() => createNewTab(), 100);
        return [];
      }
      return filtered;
    });

    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(t => t.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id);
      }
    }
  };

  // Handle terminal data from main process
  useEffect(() => {
    if (window.bridge) {
      window.bridge.onData(({ tabId, chunk }: { tabId: string; chunk: string }) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab?.terminal) {
          tab.terminal.write(chunk);
        }
      });

      window.bridge.onExit(({ tabId }: { tabId: string }) => {
        closeTab(tabId);
      });
    }
  }, [tabs]);

  // Mount terminals to DOM
  useEffect(() => {
    tabs.forEach(tab => {
      const element = terminalRefs.current.get(tab.id);
      if (element && tab.terminal && !tab.terminal.element) {
        tab.terminal.open(element);
        if (tab.fitAddon) {
          setTimeout(() => {
            tab.fitAddon?.fit();
            const { cols, rows } = tab.terminal!;
            if (window.bridge) {
              window.bridge.resize({ tabId: tab.id, cols, rows });
            }
          }, 100);
        }
      }
    });
  }, [tabs]);

  // Create initial tab
  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey)) {
        if (e.key === 't') {
          e.preventDefault();
          createNewTab();
        } else if (e.key === 'w') {
          e.preventDefault();
          if (tabs.length > 0) {
            closeTab(activeTabId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId]);

  return (
    <section className="col">
      <div className="terminal">
        {/* Tab bar */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--accent-d)',
          borderBottom: '2px solid var(--accent)',
          marginBottom: '10px'
        }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTabId === tab.id ? 'var(--accent)' : 'transparent',
                color: activeTabId === tab.id ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
                borderRight: '1px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontFamily: 'JetBrains Mono, monospace'
              }}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span>{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  fontSize: '16px',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={createNewTab}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              color: 'var(--accent)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            +
          </button>
        </div>

        {/* Terminal containers */}
        <div className="term-body">
          {tabs.map(tab => (
            <div
              key={tab.id}
              ref={(el) => {
                if (el) {
                  terminalRefs.current.set(tab.id, el);
                } else {
                  terminalRefs.current.delete(tab.id);
                }
              }}
              style={{
                display: activeTabId === tab.id ? 'block' : 'none',
                height: '500px',
                width: '100%'
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SimpleTerminal;