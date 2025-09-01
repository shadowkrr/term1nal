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

const RealTerminal: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const executeSystemCommand = async (terminal: Terminal, command: string) => {
    if (!command.trim()) {
      showPrompt(terminal);
      return;
    }

    try {
      // Electronのbridge経由でコマンドを実行
      if (window.bridge && window.bridge.executeCommand) {
        const result = await window.bridge.executeCommand(command);
        if (result.error) {
          terminal.writeln(`\r\n\x1b[31m${result.error}\x1b[0m`);
        } else {
          if (result.stdout) {
            terminal.write(`\r\n${result.stdout}`);
          }
          if (result.stderr) {
            terminal.writeln(`\r\n\x1b[31m${result.stderr}\x1b[0m`);
          }
        }
      } else {
        // フォールバック: シミュレートされたコマンド実行
        await simulateCommand(terminal, command);
      }
    } catch (error) {
      terminal.writeln(`\r\n\x1b[31mError: ${error}\x1b[0m`);
    }

    showPrompt(terminal);
  };

  const simulateCommand = async (terminal: Terminal, command: string): Promise<void> => {
    const parts = command.trim().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    // 少し遅延を入れて実行感を演出
    await new Promise(resolve => setTimeout(resolve, 50));

    switch (cmd.toLowerCase()) {
      case 'ls':
        if (args.includes('-la') || args.includes('-al')) {
          terminal.writeln('\r\n\x1b[36mdrwxr-xr-x  10 grishnak  staff   320 Sep  1 17:30 .\x1b[0m');
          terminal.writeln('\x1b[36mdrwxr-xr-x   5 grishnak  staff   160 Sep  1 16:00 ..\x1b[0m');
          terminal.writeln('\x1b[34mdrwxr-xr-x   3 grishnak  staff    96 Sep  1 17:25 Desktop\x1b[0m');
          terminal.writeln('\x1b[34mdrwxr-xr-x   4 grishnak  staff   128 Sep  1 17:28 Documents\x1b[0m');
          terminal.writeln('\x1b[34mdrwxr-xr-x   2 grishnak  staff    64 Sep  1 16:45 Downloads\x1b[0m');
          terminal.writeln('\x1b[34mdrwxr-xr-x   8 grishnak  staff   256 Sep  1 17:30 commands\x1b[0m');
        } else {
          terminal.writeln('\r\n\x1b[34mDesktop\x1b[0m    \x1b[34mDocuments\x1b[0m    \x1b[34mDownloads\x1b[0m    \x1b[34mcommands\x1b[0m');
        }
        break;

      case 'pwd':
        terminal.writeln('\r\n/home/grishnak');
        break;

      case 'whoami':
        terminal.writeln('\r\n\x1b[32mgrishnak\x1b[0m');
        break;

      case 'hostname':
        terminal.writeln('\r\n\x1b[32mzetatech_619007\x1b[0m');
        break;

      case 'uname':
        if (args.includes('-a')) {
          terminal.writeln('\r\n\x1b[36mLinux zetatech_619007 5.15.0-netwatch #1 SMP PREEMPT Wed Sep 1 17:30:00 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux\x1b[0m');
        } else {
          terminal.writeln('\r\n\x1b[36mLinux\x1b[0m');
        }
        break;

      case 'ps':
        terminal.writeln('\r\n\x1b[33m  PID TTY          TIME CMD\x1b[0m');
        terminal.writeln(' 1234 pts/0    00:00:01 bash');
        terminal.writeln(' 1456 pts/0    00:00:00 netrunner');
        terminal.writeln(' 1789 pts/0    00:00:00 ps');
        break;

      case 'df':
        terminal.writeln('\r\n\x1b[33mFilesystem     1K-blocks     Used Available Use% Mounted on\x1b[0m');
        terminal.writeln('/dev/sda1       98234576 45678912  47234176  50% /');
        terminal.writeln('tmpfs            8192000  1024000   7168000  13% /tmp');
        terminal.writeln('zetatech-net   512000000 256000000 256000000  50% /net');
        break;

      case 'top':
        terminal.writeln('\r\n\x1b[33mTop - ZetaTech Network Monitor\x1b[0m');
        terminal.writeln('\x1b[32mTasks: 127 total, 3 running, 124 sleeping\x1b[0m');
        terminal.writeln('\x1b[32mCPU: 12.5% usr, 3.2% sys, 0.1% net, 84.2% idle\x1b[0m');
        terminal.writeln('\x1b[32mMem: 16384MB total, 8192MB used, 8192MB free\x1b[0m');
        terminal.writeln('');
        terminal.writeln('\x1b[33m  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND\x1b[0m');
        terminal.writeln(' 1001 grishnak  20   0  157892  12456   8234 S   5.2  0.1   0:12.34 netrunner');
        terminal.writeln(' 1234 grishnak  20   0   24568   4321   3456 S   2.1  0.0   0:05.67 terminal');
        terminal.writeln('(Press \'q\' to quit)');
        break;

      case 'cat':
        if (args.length === 0) {
          terminal.writeln('\r\n\x1b[31mUsage: cat <filename>\x1b[0m');
        } else {
          const filename = args[0];
          switch (filename) {
            case '/etc/hosts':
              terminal.writeln('\r\n\x1b[36m127.0.0.1       localhost\x1b[0m');
              terminal.writeln('\x1b[36m192.168.1.1     zetatech-gateway\x1b[0m');
              terminal.writeln('\x1b[36m10.0.0.1        netwatch-hub\x1b[0m');
              break;
            case '/etc/passwd':
              terminal.writeln('\r\n\x1b[36mroot:x:0:0:root:/root:/bin/bash\x1b[0m');
              terminal.writeln('\x1b[36mgrishnak:x:1000:1000:Grishnak:/home/grishnak:/bin/zsh\x1b[0m');
              terminal.writeln('\x1b[36mnetwatch:x:1001:1001:NetWatch Service:/var/netwatch:/bin/false\x1b[0m');
              break;
            default:
              terminal.writeln(`\r\n\x1b[31mcat: ${filename}: No such file or directory\x1b[0m`);
          }
        }
        break;

      case 'netstat':
        terminal.writeln('\r\n\x1b[33mActive Internet connections\x1b[0m');
        terminal.writeln('\x1b[33mProto Recv-Q Send-Q Local Address           Foreign Address         State\x1b[0m');
        terminal.writeln('tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN');
        terminal.writeln('tcp        0      0 127.0.0.1:5173          0.0.0.0:*               LISTEN');
        terminal.writeln('tcp        0      0 10.0.0.15:443           netwatch.corp:80        ESTABLISHED');
        terminal.writeln('tcp        0      0 10.0.0.15:2077          zetatech.net:443        ESTABLISHED');
        break;

      case 'curl':
        if (args.length === 0) {
          terminal.writeln('\r\n\x1b[31mUsage: curl <url>\x1b[0m');
        } else {
          const url = args[0];
          terminal.writeln(`\r\nConnecting to ${url}...`);
          await new Promise(resolve => setTimeout(resolve, 800));
          if (url.includes('netwatch') || url.includes('zetatech')) {
            terminal.writeln('\x1b[32m200 OK\x1b[0m');
            terminal.writeln('\x1b[36m{"status":"connected","node":"zetatech_619007","access_level":"netrunner"}\x1b[0m');
          } else {
            terminal.writeln('\x1b[31mConnection refused - ICE detected\x1b[0m');
          }
        }
        break;

      case 'ssh':
        if (args.length === 0) {
          terminal.writeln('\r\n\x1b[31mUsage: ssh <host>\x1b[0m');
        } else {
          const host = args[0];
          terminal.writeln(`\r\nConnecting to ${host}...`);
          await new Promise(resolve => setTimeout(resolve, 1200));
          terminal.writeln('\x1b[31mConnection refused - Target is behind BlackIce\x1b[0m');
          terminal.writeln('\x1b[33mRecommend using steganography or alternate routes\x1b[0m');
        }
        break;

      case 'ping':
        if (args.length === 0) {
          terminal.writeln('\r\n\x1b[31mUsage: ping <host>\x1b[0m');
        } else {
          const host = args[0];
          terminal.writeln(`\r\nPINGING ${host}...`);
          for (let i = 1; i <= 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const time = Math.floor(Math.random() * 50) + 10;
            terminal.writeln(`\x1b[32m64 bytes from ${host}: icmp_seq=${i} time=${time}ms\x1b[0m`);
          }
        }
        break;

      case 'clear':
        terminal.clear();
        return; // Don't show prompt after clear

      case 'history':
        terminal.writeln('\r\n    1  ls -la');
        terminal.writeln('    2  pwd');
        terminal.writeln('    3  netstat');
        terminal.writeln('    4  curl netwatch.corp/api');
        terminal.writeln('    5  history');
        break;

      case 'env':
        terminal.writeln('\r\n\x1b[36mUSER=grishnak\x1b[0m');
        terminal.writeln('\x1b[36mHOME=/home/grishnak\x1b[0m');
        terminal.writeln('\x1b[36mSHELL=/bin/zsh\x1b[0m');
        terminal.writeln('\x1b[36mTERM=xterm-256color\x1b[0m');
        terminal.writeln('\x1b[36mPATH=/usr/local/bin:/usr/bin:/bin\x1b[0m');
        terminal.writeln('\x1b[36mNETWATCH_NODE=zetatech_619007\x1b[0m');
        break;

      case 'help':
        terminal.writeln('\r\n\x1b[33mNetWatch Terminal - Available Commands:\x1b[0m');
        terminal.writeln('\x1b[32mls\x1b[0m [-la]  - list directory contents');
        terminal.writeln('\x1b[32mpwd\x1b[0m        - print working directory');
        terminal.writeln('\x1b[32mwhoami\x1b[0m     - current user');
        terminal.writeln('\x1b[32mps\x1b[0m         - running processes');
        terminal.writeln('\x1b[32mnetstat\x1b[0m    - network connections');
        terminal.writeln('\x1b[32mcurl\x1b[0m       - network requests');
        terminal.writeln('\x1b[32mssh\x1b[0m        - secure shell (experimental)');
        terminal.writeln('\x1b[32mping\x1b[0m       - network ping');
        terminal.writeln('\x1b[32mcat\x1b[0m        - view file contents');
        terminal.writeln('\x1b[32mclear\x1b[0m      - clear terminal');
        break;

      default:
        terminal.writeln(`\r\n\x1b[31mzsh: command not found: ${cmd}\x1b[0m`);
        terminal.writeln('\x1b[33mType \'help\' for available commands\x1b[0m');
    }
  };

  const showPrompt = (terminal: Terminal) => {
    terminal.write('\r\n\x1b[36mshadowkrr\x1b[0m:\x1b[34m~\x1b[0m$ ');
  };

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
        executeSystemCommand(terminal, currentCommand.trim());
        currentCommand = '';
        
      } else if (code === 127) { // Backspace
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (code === 3) { // Ctrl+C
        terminal.writeln('\r\n^C');
        showPrompt(terminal);
        currentCommand = '';
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

  // Mount terminals to DOM and show initial prompt
  useEffect(() => {
    tabs.forEach(tab => {
      const element = terminalRefs.current.get(tab.id);
      if (element && tab.terminal && !tab.terminal.element) {
        tab.terminal.open(element);
        if (tab.fitAddon) {
          setTimeout(() => {
            tab.fitAddon?.fit();
            // Show welcome message and prompt
            tab.terminal?.writeln('\x1b[36mWelcome to NetWatch Terminal v1.15.7\x1b[0m');
            tab.terminal?.writeln('\x1b[33mType \'help\' for available commands\x1b[0m');
            showPrompt(tab.terminal!);
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

export default RealTerminal;