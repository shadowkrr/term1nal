import React, { useState } from 'react';
import { useTheme } from '../lib/theme';
import TerminalSettings from './TerminalSettings';

export const SidebarRight: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();
  
  // Terminal settings state
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('terminal-font-size');
    return saved ? Number(saved) : 14;
  });
  
  const [cursorStyle, setCursorStyle] = useState<'block' | 'underline' | 'bar'>(() => {
    const saved = localStorage.getItem('terminal-cursor-style') as 'block' | 'underline' | 'bar';
    return saved || 'block';
  });
  
  const [shell, setShell] = useState(() => {
    const saved = localStorage.getItem('terminal-shell');
    // Browser環境では navigator.platform を使用
    const isWindows = typeof navigator !== 'undefined' && navigator.platform.indexOf('Win') !== -1;
    return saved || (isWindows ? 'powershell.exe' : '/bin/zsh');
  });

  // Save settings to localStorage
  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem('terminal-font-size', size.toString());
  };

  const handleCursorStyleChange = (style: 'block' | 'underline' | 'bar') => {
    setCursorStyle(style);
    localStorage.setItem('terminal-cursor-style', style);
  };

  const handleShellChange = (shellPath: string) => {
    setShell(shellPath);
    localStorage.setItem('terminal-shell', shellPath);
  };


  const themes = [
    { name: 'red (by shade)', value: 'red' },
    { name: 'yellow (by ERROR:{YPD5q0pepnHF_028})', value: 'yellow' },
    { name: 'Biotechnica Green', value: 'green' },
    { name: 'Netwatch Blue', value: 'blue' },
    { name: 'Night City White', value: 'white' }
  ];


  const handleThemeClick = (themeValue: string) => {
    setTheme(themeValue);
  };

  return (
    <aside className="col">
      <section className="panel">
        <div className="panel-header">=== SOFTWARE ===</div>
        <div className="box">
          <h3>read me!</h3>
        </div>
        <div className="box">
          <h3>notes</h3>
        </div>
        <div className="box">
          <h3>themes</h3>
          <p style={{ color: '#cbd3da' }}>
            Each netrunner has different preferences for the appearance of their terminal…
          </p>
          <ul className="list">
            {themes.map((theme, index) => (
              <li 
                key={index}
                onClick={() => handleThemeClick(theme.value)}
                style={{ 
                  backgroundColor: currentTheme === theme.value ? 'rgba(255, 46, 106, 0.2)' : undefined 
                }}
              >
                {theme.name}
              </li>
            ))}
          </ul>
        </div>
        <TerminalSettings
          fontSize={fontSize}
          setFontSize={handleFontSizeChange}
          cursorStyle={cursorStyle}
          setCursorStyle={handleCursorStyleChange}
          shell={shell}
          setShell={handleShellChange}
        />
      </section>
    </aside>
  );
};