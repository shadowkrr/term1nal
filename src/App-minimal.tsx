import React from 'react';
import './styles.css';

const App: React.FC = () => {
  return (
    <main className="shell">
      <div className="title">
        term1nal <small>v1.0</small>
      </div>

      {/* LEFT */}
      <aside className="col">
        <section className="panel">
          <div className="panel-header">=== HELP ===</div>
          <div className="box">
            <h3>READ ME!</h3>
            <p>
              Yo! Regina told me you were new to the world of netrunning and wanted to get your feet wet…
              Don't reload the page unless you've really messed something up and wanna reset. Any super
              burning questions, hit me up in IRC… but pls try to work it out yourself first, k?
            </p>
          </div>
        </section>
      </aside>

      {/* CENTER */}
      <section className="col">
        <div className="terminal">
          <div className="term-body">
            <div className="term-line">
              <span className="user">shadowkrr</span> $: <span className="cmd">ls</span>
              <br />
              <span className="out">Terminal is working!</span>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT */}
      <aside className="col">
        <section className="panel">
          <div className="panel-header">=== SOFTWARE ===</div>
          <div className="box">
            <h3>THEMES</h3>
            <p style={{ color: '#cbd3da' }}>
              Each netrunner has different preferences for the appearance of their terminal…
            </p>
          </div>
        </section>
      </aside>

      <footer>♪ POWERED BY ZETATECH ∕|\ PROTECTED BY NETWATCH ♪</footer>
    </main>
  );
};

export default App;