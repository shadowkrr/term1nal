import React from 'react';
import { useTheme } from '../lib/theme';

interface TerminalSettingsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  cursorStyle: 'block' | 'underline' | 'bar';
  setCursorStyle: (style: 'block' | 'underline' | 'bar') => void;
  shell: string;
  setShell: (shell: string) => void;
}

const TerminalSettings: React.FC<TerminalSettingsProps> = ({
  fontSize,
  setFontSize,
  cursorStyle,
  setCursorStyle,
  shell,
  setShell
}) => {
  const { currentTheme, setTheme } = useTheme();

  const themes = [
    { id: 'red', name: 'red (by shade)', color: '#ff2e6a' },
    { id: 'yellow', name: 'yellow (by ERROR:{YPD5q0pepnHF_028})', color: '#ffcc02' },
    { id: 'green', name: 'Biotechnica Green', color: '#3cffb0' },
    { id: 'blue', name: 'Netwatch Blue', color: '#48f0ff' },
    { id: 'white', name: 'Night City White', color: '#ffffff' }
  ];

  // Browser環境での判定
  const isWindows = typeof navigator !== 'undefined' && navigator.platform.indexOf('Win') !== -1;
  const shellOptions = isWindows 
    ? [
        { value: 'powershell.exe', label: 'PowerShell' },
        { value: 'cmd.exe', label: 'Command Prompt' },
        { value: 'pwsh.exe', label: 'PowerShell Core' }
      ]
    : [
        { value: '/bin/zsh', label: 'Zsh' },
        { value: '/bin/bash', label: 'Bash' },
        { value: '/bin/sh', label: 'Shell' }
      ];

  return (
    <div className="box">
      <h3>Terminal Settings</h3>
      
      {/* Font Size */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '6px', 
          color: 'var(--ink)',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          Font Size: {fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="18"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: 'var(--accent)'
          }}
        />
      </div>

      {/* Cursor Style */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '6px', 
          color: 'var(--ink)',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          Cursor Style
        </label>
        <select
          value={cursorStyle}
          onChange={(e) => setCursorStyle(e.target.value as 'block' | 'underline' | 'bar')}
          style={{
            width: '100%',
            padding: '6px 8px',
            backgroundColor: 'var(--bg)',
            color: 'var(--ink)',
            border: '2px solid var(--accent-d)',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          <option value="block">Block</option>
          <option value="underline">Underline</option>
          <option value="bar">Bar</option>
        </select>
      </div>

      {/* Theme Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '6px', 
          color: 'var(--ink)',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          Theme
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {themes.map(themeOption => (
            <button
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id)}
              style={{
                padding: '6px 8px',
                backgroundColor: currentTheme === themeOption.id ? 'var(--accent)' : 'transparent',
                color: currentTheme === themeOption.id ? '#fff' : 'var(--ink)',
                border: '2px solid var(--accent-d)',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: themeOption.color,
                  borderRadius: '2px',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              />
              {themeOption.name}
            </button>
          ))}
        </div>
      </div>

      {/* Shell Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '6px', 
          color: 'var(--ink)',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          Shell
        </label>
        <select
          value={shell}
          onChange={(e) => setShell(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            backgroundColor: 'var(--bg)',
            color: 'var(--ink)',
            border: '2px solid var(--accent-d)',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          {shellOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p style={{ 
        fontSize: '11px', 
        color: 'var(--muted)', 
        margin: 0,
        lineHeight: '1.4'
      }}>
        Settings are saved locally and will persist between sessions.
      </p>
    </div>
  );
};

export default TerminalSettings;