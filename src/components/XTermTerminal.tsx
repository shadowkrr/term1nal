import React, { useEffect, useRef, useState, useContext } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { useTheme } from '../lib/theme';

interface Tab {
  id: string;
  title: string;
  terminal: Terminal | null;
  fitAddon: FitAddon | null;
}

const XTermTerminal: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { currentTheme } = useTheme();

  // Theme color mapping
  const getThemeColors = (currentTheme: string) => {
    const themes = {
      red: {
        background: '#0b0b14',
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
        white: '#d7d7e0',
        brightBlack: '#9aa0a6',
        brightRed: '#ff5577',
        brightGreen: '#5fffcc',
        brightYellow: '#ffdd33',
        brightBlue: '#77f5ff',
        brightMagenta: '#ff5577',
        brightCyan: '#77f5ff',
        brightWhite: '#ffffff'
      },
      yellow: {
        background: '#1a1a0a',
        foreground: '#e0e0d7',
        cursor: '#ffcc02',
        selection: '#ffcc0240',
        black: '#1a1a0a',
        red: '#ff6b47',
        green: '#3cffb0',
        yellow: '#ffcc02',
        blue: '#48f0ff',
        magenta: '#ffcc02',
        cyan: '#48f0ff',
        white: '#e0e0d7',
        brightBlack: '#a6a096',
        brightRed: '#ff8866',
        brightGreen: '#5fffcc',
        brightYellow: '#ffdd33',
        brightBlue: '#77f5ff',
        brightMagenta: '#ffdd33',
        brightCyan: '#77f5ff',
        brightWhite: '#ffffff'
      },
      green: {
        background: '#0a140b',
        foreground: '#d7e0d7',
        cursor: '#3cffb0',
        selection: '#3cffb040',
        black: '#0a140b',
        red: '#ff6b47',
        green: '#3cffb0',
        yellow: '#ffcc02',
        blue: '#48f0ff',
        magenta: '#3cffb0',
        cyan: '#48f0ff',
        white: '#d7e0d7',
        brightBlack: '#96a696',
        brightRed: '#ff8866',
        brightGreen: '#5fffcc',
        brightYellow: '#ffdd33',
        brightBlue: '#77f5ff',
        brightMagenta: '#5fffcc',
        brightCyan: '#77f5ff',
        brightWhite: '#ffffff'
      },
      blue: {
        background: '#0a0b14',
        foreground: '#d7d7e0',
        cursor: '#48f0ff',
        selection: '#48f0ff40',
        black: '#0a0b14',
        red: '#ff6b47',
        green: '#3cffb0',
        yellow: '#ffcc02',
        blue: '#48f0ff',
        magenta: '#48f0ff',
        cyan: '#48f0ff',
        white: '#d7d7e0',
        brightBlack: '#9696a6',
        brightRed: '#ff8866',
        brightGreen: '#5fffcc',
        brightYellow: '#ffdd33',
        brightBlue: '#77f5ff',
        brightMagenta: '#77f5ff',
        brightCyan: '#77f5ff',
        brightWhite: '#ffffff'
      },
      white: {
        background: '#f8f8f8',
        foreground: '#2d2d2d',
        cursor: '#2d2d2d',
        selection: '#2d2d2d40',
        black: '#2d2d2d',
        red: '#cc0000',
        green: '#4e9a06',
        yellow: '#c4a000',
        blue: '#3465a4',
        magenta: '#75507b',
        cyan: '#06989a',
        white: '#d3d7cf',
        brightBlack: '#555753',
        brightRed: '#ef2929',
        brightGreen: '#8ae234',
        brightYellow: '#fce94f',
        brightBlue: '#729fcf',
        brightMagenta: '#ad7fa8',
        brightCyan: '#34e2e2',
        brightWhite: '#eeeeec'
      }
    };
    return themes[currentTheme as keyof typeof themes] || themes.red;
  };

  const createNewTab = () => {
    const id = Date.now().toString();
    const terminal = new Terminal({
      theme: getThemeColors(currentTheme),
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon((event, uri) => {
      window.electronAPI?.openExternal(uri);
    });

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

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
      window.electronAPI?.terminalInput(id, data);
    });

    terminal.onTitleChange((title) => {
      setTabs(prev => prev.map(tab => 
        tab.id === id ? { ...tab, title } : tab
      ));
    });

    // Request terminal creation from main process
    const { cols, rows } = terminal;
    window.electronAPI?.createTerminal({
      tabId: id,
      cols,
      rows,
      shellPath: (typeof navigator !== 'undefined' && navigator.platform.indexOf('Win') !== -1) ? 'powershell.exe' : '/bin/bash',
      cwd: '~' // ブラウザ環境では環境変数にアクセスできないためデフォルト値を使用
    });

    return newTab;
  };

  const closeTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.terminal) {
      tab.terminal.dispose();
      window.electronAPI?.closeTerminal(tabId);
    }

    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (filtered.length === 0) {
        // Create a new tab if we're closing the last one
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

  const switchToTab = (tabId: string) => {
    setActiveTabId(tabId);
    // Re-fit terminal when switching tabs
    setTimeout(() => {
      const tab = tabs.find(t => t.id === tabId);
      if (tab?.fitAddon && tab?.terminal) {
        tab.fitAddon.fit();
        const { cols, rows } = tab.terminal;
        window.electronAPI?.resizeTerminal(tabId, cols, rows);
      }
    }, 100);
  };

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
        } else if (e.key === 'k') {
          e.preventDefault();
          const activeTab = tabs.find(t => t.id === activeTabId);
          if (activeTab?.terminal) {
            activeTab.terminal.clear();
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const currentIndex = tabs.findIndex(t => t.id === activeTabId);
          if (currentIndex !== -1) {
            const nextIndex = e.shiftKey 
              ? (currentIndex - 1 + tabs.length) % tabs.length
              : (currentIndex + 1) % tabs.length;
            switchToTab(tabs[nextIndex].id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId]);

  // Handle terminal data from main process
  useEffect(() => {
    const handleTerminalData = (tabId: string, data: string) => {
      const tab = tabs.find(t => t.id === tabId);
      if (tab?.terminal) {
        tab.terminal.write(data);
      }
    };

    const handleTerminalExit = (tabId: string) => {
      closeTab(tabId);
    };

    if (window.electronAPI) {
      window.electronAPI.onTerminalData(handleTerminalData);
      window.electronAPI.onTerminalExit(handleTerminalExit);
    }

    return () => {
      // Cleanup listeners would go here if electronAPI provided cleanup methods
    };
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
            window.electronAPI?.resizeTerminal(tab.id, cols, rows);
          }, 100);
        }
      }
    });
  }, [tabs]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      tabs.forEach(tab => {
        if (tab.fitAddon && tab.terminal) {
          setTimeout(() => {
            tab.fitAddon?.fit();
            const { cols, rows } = tab.terminal!;
            window.electronAPI?.resizeTerminal(tab.id, cols, rows);
          }, 100);
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tabs]);

  // Create initial tab
  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab();
    }
  }, []);

  // Update terminal themes when theme changes
  useEffect(() => {
    const themeColors = getThemeColors(currentTheme);
    tabs.forEach(tab => {
      if (tab.terminal) {
        tab.terminal.options.theme = themeColors;
      }
    });
  }, [currentTheme, tabs]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className="terminal">
      {/* Tab bar */}
      <div className="tab-bar" style={{
        display: 'flex',
        backgroundColor: 'var(--accent-d)',
        borderBottom: '2px solid var(--accent)',
        marginBottom: '10px'
      }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
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
            onClick={() => switchToTab(tab.id)}
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
              height: '600px',
              width: '100%'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default XTermTerminal;