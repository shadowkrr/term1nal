import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

declare global {
  interface Window {
    bridge: {
      create: (args: { tabId: string; shellPath?: string; cols?: number; rows?: number }) => Promise<void>;
      write: (args: { tabId: string; data: string }) => void;
      resize: (args: { tabId: string; cols: number; rows: number }) => void;
      close: (args: { tabId: string }) => void;
      onData: (callback: (data: { tabId: string; chunk: string }) => void) => void;
      onExit: (callback: (data: { tabId: string; code: number }) => void) => void;
      openExternal: (url: string) => void;
    };
  }
}

interface Tab {
  id: string;
  title: string;
  terminal: Terminal | null;
  fitAddon: FitAddon | null;
}

const SystemTerminal: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const createNewTab = async () => {
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
        selection: '#ff2e6a40',
        black: '#0b0b14',
        red: '#ff2e6a',
        green: '#3cffb0',
        yellow: '#ffcc02',
        blue: '#48f0ff',
        magenta: '#ff2e6a',
        cyan: '#48f0ff',
        white: '#d7d7e0'
      }
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Handle user input
    terminal.onData(data => {
      if (window.bridge) {
        window.bridge.write({ tabId: id, data });
      }
    });

    const newTab: Tab = {
      id,
      title: 'Terminal',
      terminal,
      fitAddon
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);

    // Create the real terminal process
    if (window.bridge) {
      await window.bridge.create({ tabId: id, cols: 120, rows: 34 });
    }

    return newTab;
  };

  const closeTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.terminal) {
      tab.terminal.dispose();
    }

    // Close the backend process
    if (window.bridge) {
      window.bridge.close({ tabId });
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

  // Handle data from backend
  useEffect(() => {
    if (window.bridge) {
      window.bridge.onData(({ tabId, chunk }) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab?.terminal) {
          tab.terminal.write(chunk);
        }
      });

      window.bridge.onExit(({ tabId, code }) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab?.terminal) {
          tab.terminal.write(`\r\n[Process exited with code ${code}]\r\n`);
        }
      });
    }
  }, [tabs]);

  // Fallback if bridge is not available
  useEffect(() => {
    if (!window.bridge) {
      console.warn('Bridge not available, using WorkingTerminal fallback');
      // Import and use WorkingTerminal as fallback
      import('./WorkingTerminal').then((module) => {
        // This is just for debugging - in practice we'll fix the bridge
      });
    }
  }, []);

  // Mount terminals to DOM
  useEffect(() => {
    tabs.forEach(tab => {
      const element = terminalRefs.current.get(tab.id);
      if (element && tab.terminal && !tab.terminal.element) {
        tab.terminal.open(element);
        if (tab.fitAddon) {
          setTimeout(() => {
            tab.fitAddon?.fit();
          }, 100);
        }
      }
    });
  }, [tabs]);

  // Create initial tab
  useEffect(() => {
    if (tabs.length === 0) {
      // Check if bridge is available before creating tab
      if (window.bridge) {
        createNewTab();
      } else {
        // Create a fallback terminal if bridge is not available
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
            selection: '#ff2e6a40',
            black: '#0b0b14',
            red: '#ff2e6a',
            green: '#3cffb0',
            yellow: '#ffcc02',
            blue: '#48f0ff',
            magenta: '#ff2e6a',
            cyan: '#48f0ff',
            white: '#d7d7e0'
          }
        });
        
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        
        const id = Date.now().toString();
        const newTab = {
          id,
          title: 'Terminal',
          terminal,
          fitAddon
        };
        
        setTabs([newTab]);
        setActiveTabId(id);
      }
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

export default SystemTerminal;