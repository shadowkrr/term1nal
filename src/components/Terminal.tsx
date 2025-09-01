import React, { useEffect, useRef, useState } from 'react';

interface TerminalLine {
  user: string;
  command: string;
  output: string;
}

export const Terminal: React.FC = () => {
  const [currentInput, setCurrentInput] = useState('');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    {
      user: 'shadowkrr',
      command: 'steghide steghide',
      output: 'well done. You\'ve successfully used steghide!'
    },
    {
      user: 'shadowkrr',
      command: 'cat steghide',
      output: 'data hidden within a file'
    },
    {
      user: 'shadowkrr',
      command: 'cat irc',
      output: 'Internet Relay Chat client'
    },
    {
      user: 'shadowkrr',
      command: 'cat ssh',
      output: 'Secure Shell: securely log onto remote systems to execute commands on a remote server'
    },
    {
      user: 'shadowkrr',
      command: 'cat file',
      output: 'prints the metadata of a file'
    },
    {
      user: 'shadowkrr',
      command: 'cat cat',
      output: 'print the contents of a file'
    },
    {
      user: 'shadowkrr',
      command: 'ls',
      output: 'cd cl ear cm d etc file irc ls scp ssh steghide'
    },
    {
      user: 'shadowkrr',
      command: 'cd commands',
      output: 'commands'
    }
  ]);

  const terminalRef = useRef<HTMLDivElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newLine: TerminalLine = {
        user: 'shadowkrr',
        command: currentInput,
        output: `Command '${currentInput}' executed`
      };
      
      setTerminalLines(prev => [...prev, newLine]);
      setCurrentInput('');
    }
  };

  useEffect(() => {
    // Scroll to bottom when new lines are added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  return (
    <section className="col">
      <div className="prompt-bar">
        <span className="prompt-label">shadowkrr</span>
        <span>$:</span>
        <input 
          className="prompt-input" 
          placeholder="type your commands here"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>

      <div className="dir">
        <div>PARENT DIRECTORY: <b>home</b></div>
        <div>CURRENT DIRECTORY: <b>commands</b></div>
        <div>CHILD DIRECTORIES:</div>
      </div>

      <div className="term-body" ref={terminalRef}>
        {terminalLines.map((line, index) => (
          <div key={index} className="term-line">
            <span className="user">{line.user}</span> $: <span className="cmd">{line.command}</span>
            <br />
            <span className="out">{line.output}</span>
          </div>
        ))}
        <div className="ascii" aria-label="skull ascii art placeholder"></div>
      </div>
    </section>
  );
};