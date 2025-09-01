import React, { useState } from 'react';
import { SidebarLeft } from './components/SidebarLeft';
import { SidebarRight } from './components/SidebarRight';
import WorkingTerminal from './components/WorkingTerminal';
import './styles.css';

const App: React.FC = () => {
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);

  const toggleLeftSidebar = () => setLeftSidebarVisible(!leftSidebarVisible);
  const toggleRightSidebar = () => setRightSidebarVisible(!rightSidebarVisible);

  return (
    <main className={`shell ${!leftSidebarVisible ? 'hide-left' : ''} ${!rightSidebarVisible ? 'hide-right' : ''}`}>
      <div className="title">
        term1nal <small>v1.0</small>
        <div className="sidebar-controls">
          <button 
            className="sidebar-toggle left-toggle" 
            onClick={toggleLeftSidebar}
            title={leftSidebarVisible ? 'Hide left sidebar' : 'Show left sidebar'}
          >
            {leftSidebarVisible ? '◀' : '▶'}
          </button>
          <button 
            className="sidebar-toggle right-toggle" 
            onClick={toggleRightSidebar}
            title={rightSidebarVisible ? 'Hide right sidebar' : 'Show right sidebar'}
          >
            {rightSidebarVisible ? '▶' : '◀'}
          </button>
        </div>
      </div>

      {leftSidebarVisible && <SidebarLeft />}
      <WorkingTerminal />
      {rightSidebarVisible && <SidebarRight />}

      <footer>♪ POWERED BY ZETATECH ∕|\ PROTECTED BY NETWATCH ♪</footer>
    </main>
  );
};

export default App;