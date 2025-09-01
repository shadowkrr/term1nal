import React from 'react';

export const SidebarLeft: React.FC = () => {
  const glossaryItems = [
    'IRC',
    'Netrunner',
    'NetWatch',
    'SSH',
    'Z.O.M.B.I.E',
    'MAP'
  ];

  const handleGlossaryClick = (item: string) => {
    console.log(`Clicked on ${item}`);
    // TODO: Implement glossary item functionality
  };

  return (
    <aside className="col">
      <section className="panel">
        <div className="panel-header">=== HELP ===</div>
        <div className="box">
          <h3>read me!</h3>
          <p>
            Yo! Regina told me you were new to the world of netrunning and wanted to get your feet wet…
            Don't reload the page unless you've really messed something up and wanna reset. Any super
            burning questions, hit me up in IRC… but pls try to work it out yourself first, k?
          </p>
        </div>
        <div className="box">
          <h3>glossary</h3>
          <p>It's a big wide world out there. Can't be expected to know everything. That's what data storage is for.</p>
          {glossaryItems.map((item) => (
            <a 
              key={item}
              className="link" 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleGlossaryClick(item);
              }}
            >
              {item}
            </a>
          ))}
        </div>
      </section>
    </aside>
  );
};