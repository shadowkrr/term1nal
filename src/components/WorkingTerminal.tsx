import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

declare global {
  interface Window {
    bridge?: {
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
  realTerminalId?: string;
}


const WorkingTerminal: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [terminalHeight, setTerminalHeight] = useState<number>(600);
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const getPrompt = () => {
    const username = 'shadowkrr';
    const hostname = 'term1nal';
    return `${username}@${hostname}:~$`;
  };

  const executeRealCommand = async (terminal: Terminal, command: string, args: string[], tabId: string) => {
    const fullCommand = [command, ...args].join(' ');
    
    // Check if bridge exists and has required functions
    if (window.bridge && typeof window.bridge.create === 'function') {
      try {
        // Find the current tab
        const currentTab = tabs.find(tab => tab.id === activeTabId);
        
        // Create real terminal tab if not exists for this specific tab
        if (!currentTab?.realTerminalId) {
          const realTabId = `real_${tabId}_${Date.now()}`;
          // Use current terminal dimensions
          const cols = currentTab?.terminal?.cols || 120;
          const rows = currentTab?.terminal?.rows || 34;
          await window.bridge.create({ tabId: realTabId, cols, rows });
          
          // Update the tab with real terminal ID
          setTabs(prevTabs => prevTabs.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, realTerminalId: realTabId }
              : tab
          ));
          
          // Listen for output from real shell
          window.bridge.onData(({ tabId: responseTabId, chunk }) => {
            if (responseTabId === realTabId) {
              terminal.write(chunk);
            }
          });
          
          // Send command to real shell
          window.bridge.write({ tabId: realTabId, data: fullCommand + '\n' });
        } else {
          // Send command to existing real shell
          window.bridge.write({ tabId: currentTab.realTerminalId, data: fullCommand + '\n' });
        }
        
        return;
      } catch (error) {
        console.error('Bridge error:', error);
        terminal.writeln(`\r\n\x1b[31mBridge not available - real terminal commands require Electron environment\x1b[0m`);
        return;
      }
    }
    
    // Show message if bridge not available
    terminal.writeln(`\r\n\x1b[31mReal terminal not available - please run in Electron environment\x1b[0m`);
  };


  const createNewTab = () => {
    const id = Date.now().toString();
    // Calculate initial terminal size based on current window
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const charWidth = 9;
    const charHeight = 18;
    const padding = 32;
    const availableHeight = Math.max(400, windowHeight - 120);
    const availableWidth = Math.max(800, windowWidth - 100);
    const initialCols = Math.min(Math.floor((availableWidth - padding) / charWidth), 200);
    const initialRows = Math.min(Math.floor((availableHeight - padding) / charHeight), 50);

    const terminal = new Terminal({
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      lineHeight: 1.3,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true,
      convertEol: true,
      cols: initialCols,
      rows: initialRows,
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

    let currentCommand = '';

    terminal.onData(data => {
      const code = data.charCodeAt(0);
      
      if (code === 13) { // Enter
        const parts = currentCommand.trim().split(' ');
        const command = parts[0];
        const args = parts.slice(1);
        
        executeRealCommand(terminal, command, args, id);
        currentCommand = '';
        
        // Show new prompt
        setTimeout(() => {
          terminal.write(`\r\n\x1b[36m${getPrompt()}\x1b[0m `);
        }, 50);
        
      } else if (code === 127) { // Backspace
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (code === 27) { // Escape sequences (arrow keys)
        return;
      } else if (code >= 32) { // Printable characters
        currentCommand += data;
        terminal.write(data);
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

    return newTab;
  };

  const closeTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.terminal) {
      tab.terminal.dispose();
    }
    
    // Close real terminal if exists
    if (tab?.realTerminalId && window.bridge) {
      window.bridge.close({ tabId: tab.realTerminalId });
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

  // Mount terminals to DOM
  useEffect(() => {
    tabs.forEach(tab => {
      const element = terminalRefs.current.get(tab.id);
      if (element && tab.terminal && !tab.terminal.element) {
        tab.terminal.open(element);
        if (tab.fitAddon) {
          setTimeout(() => {
            tab.fitAddon?.fit();
            // Show initial prompt
            tab.terminal?.write(`\x1b[36m${getPrompt()}\x1b[0m `);
          }, 100);
        }
      }
    });
  }, [tabs]);

  // Update terminal height and resize terminals based on window size
  useEffect(() => {
    const updateTerminalSize = () => {
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      
      // Calculate available height - extend to almost full screen
      const availableHeight = Math.max(400, windowHeight - 120);
      setTerminalHeight(availableHeight);
      
      // Calculate optimal terminal dimensions
      const charWidth = 9; // Approximate character width in pixels
      const charHeight = 18; // Approximate character height in pixels
      const padding = 32; // Terminal padding
      
      const availableWidth = Math.max(800, windowWidth - 100); // Account for sidebars
      const cols = Math.floor((availableWidth - padding) / charWidth);
      const rows = Math.floor((availableHeight - padding) / charHeight);
      
      // Update all terminals with new dimensions
      tabs.forEach(tab => {
        if (tab.terminal && tab.fitAddon) {
          tab.terminal.resize(Math.min(cols, 200), Math.min(rows, 50));
          tab.fitAddon.fit();
          
          // Update real terminal size if exists
          if (tab.realTerminalId && window.bridge) {
            window.bridge.resize({ 
              tabId: tab.realTerminalId, 
              cols: Math.min(cols, 200), 
              rows: Math.min(rows, 50) 
            });
          }
        }
      });
    };

    updateTerminalSize();
    window.addEventListener('resize', updateTerminalSize);
    return () => window.removeEventListener('resize', updateTerminalSize);
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
        <div className="term-body" style={{ display: 'flex', flexDirection: 'column', height: `${terminalHeight}px` }}>
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
                height: '100%',
                width: '100%'
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkingTerminal;