import React from 'react';

// Custom Mock Data for a high-volume News CMS
const breakingAlerts = [
  { id: '1', title: 'Global Climate Summit Reaches Accord', section: 'International', timestamp: '4m ago', status: 'Live', impact: 'High' },
  { id: '2', title: 'Tech Giant Announces Quantum Processor Breakthrough', section: 'Technology', timestamp: '18m ago', status: 'Review', impact: 'Medium' }
];

const editorialQueue = [
  { id: '101', title: 'The Future of Urban Transit: Hyperloops vs. High-Speed Rail', author: 'Sarah Jenkins', section: 'Business', progress: 85, status: 'Editing', wordCount: 1420 },
  { id: '102', title: 'Review: The Neo-Minimalism Exhibition at MOMA', author: 'Marcus Vance', section: 'Arts', progress: 100, status: 'Scheduled', wordCount: 890 },
  { id: '103', title: 'Deep Sea Exploration Submersible Loses Signal in Mariana Trench', author: 'Elena Rostova', section: 'Science', progress: 40, status: 'Drafting', wordCount: 610 },
  { id: '104', title: 'How a Small Winery Beat the Global Spirits Conglomerates', author: 'David Chang', section: 'Food', progress: 95, status: 'Legal Review', wordCount: 2100 }
];

const analyticsSummary = [
  { label: 'Real-time Active Readers', value: '142,840', change: '+12% vs last hour', trend: 'up' },
  { label: 'Avg. Engagement Time', value: '4m 32s', change: '+18s vs daily baseline', trend: 'up' },
  { label: 'Paywall Conversion Rate', value: '2.41%', change: '-0.04% this week', trend: 'down' }
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] p-6 font-sans">
      
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-serif font-black tracking-tight text-[var(--color-ink)]">
            Prime Media Editorial Desk
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            System Status: Operational • System Date: July 4, 2026
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button className="px-4 py-2 text-sm font-medium border border-[var(--color-border)] rounded-md bg-[var(--color-canvas)] hover:bg-[var(--color-surface)] transition">
            View Live Site
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[var(--color-south)] hover:bg-[var(--color-south-hover)] transition shadow-sm">
            + File Wire Story
          </button>
        </div>
      </header>

      {/* Breaking News Feed ticker */}
      <section className="mb-8">
        <div className="bg-[var(--color-south-light)] border border-[var(--color-south)]/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[var(--color-south)] animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-south)]">
              Active Flash / Breaking Alerts
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {breakingAlerts.map(alert => (
              <div key={alert.id} className="flex items-start justify-between p-3 rounded bg-[var(--color-canvas)] border border-[var(--color-border)] shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-tight text-[var(--color-east)] bg-[var(--color-east-light)] px-1.5 py-0.5 rounded">
                    {alert.section}
                  </span>
                  <h3 className="text-sm font-semibold mt-1.5 text-[var(--color-ink)] line-clamp-1">
                    {alert.title}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">Updated {alert.timestamp}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  alert.status === 'Live' ? 'bg-[var(--color-west-light)] text-[var(--color-west-dark)]' : 'bg-[var(--color-north-light)] text-[var(--color-north)]'
                }`}>
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Matrix Grid */}
      <section className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">
          Audience & Circulation Analytics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analyticsSummary.map((stat, idx) => (
            <div key={idx} className="bg-[var(--color-canvas)] p-5 rounded-lg border border-[var(--color-border)] shadow-sm">
              <p className="text-xs font-medium text-[var(--color-muted)]">{stat.label}</p>
              <p className="text-2xl font-bold tracking-tight mt-1 text-[var(--color-ink)]">{stat.value}</p>
              <p className={`text-xs mt-2 font-medium ${
                stat.trend === 'up' ? 'text-[var(--color-west-dark)]' : 'text-[var(--color-south)]'
              }`}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Editorial Workspace Divide */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Core Production Queue (Takes up 2 columns) */}
        <section className="lg:col-span-2 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
            <h2 className="font-serif text-lg font-bold">Active Lineup Queue</h2>
            <span className="text-xs text-[var(--color-muted)]">{editorialQueue.length} items in workspace</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                  <th className="p-4">Slug / Working Title</th>
                  <th className="p-4">Desk</th>
                  <th className="p-4">Workflow Status</th>
                  <th className="p-4 text-right">Metrics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-sm">
                {editorialQueue.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--color-surface)]/50 transition">
                    <td className="p-4 max-w-sm">
                      <p className="font-medium text-[var(--color-ink)] line-clamp-1">{item.title}</p>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">By {item.author}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium border border-[var(--color-border)] px-2 py-0.5 rounded bg-[var(--color-surface)]">
                        {item.section}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col w-28">
                        <span className="text-xs font-semibold text-[var(--color-ink)] mb-1">{item.status}</span>
                        <div className="w-full bg-[var(--color-border)] h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-[var(--color-east)] h-1 rounded-full" 
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap text-xs text-[var(--color-muted)]">
                      <div>{item.wordCount} words</div>
                      <button className="text-[var(--color-east)] hover:text-[var(--color-east-hover)] font-medium mt-1 inline-block">
                        Open Desk →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dynamic Section Tally Side Panel */}
        <section className="bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-lg p-4 shadow-sm h-fit">
          <h2 className="font-serif text-lg font-bold border-b border-[var(--color-border)] pb-2 mb-3">
            Front-Page Real Estate
          </h2>
          <p className="text-xs text-[var(--color-muted)] mb-4">
            Current visual slots allocated on home layouts.
          </p>
          
          <div className="space-y-3">
            {[
              { slot: 'Top Hero (A1 Canopy)', current: 'Climate Accord Summit', fill: 'bg-[var(--color-east)]' },
              { slot: 'Opinion Column Left', current: 'The Threat to Decentralized Journalism', fill: 'bg-[var(--color-north)]' },
              { slot: 'Business Spotlight Grid', current: 'Hyperloops vs Rail Analysis', fill: 'bg-[var(--color-east)]' },
              { slot: 'Culture Highlight Panel', current: 'Review: Neo-Minimalism MOMA', fill: 'bg-[var(--color-west)]' }
            ].map((layoutSlot, idx) => (
              <div key={idx} className="p-3 border border-[var(--color-border)] rounded bg-[var(--color-surface)] text-xs">
                <div className="flex justify-between font-bold text-[var(--color-muted)] uppercase mb-1 tracking-tight">
                  <span>{layoutSlot.slot}</span>
                  <span className="text-[var(--color-west-dark)]">Assigned</span>
                </div>
                <div className="text-sm font-medium text-[var(--color-ink)] truncate">
                  {layoutSlot.current}
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-border)] border border-[var(--color-border)] text-xs font-semibold rounded transition text-center">
            Modify Layout Blueprint
          </button>
        </section>

      </div>
    </div>
  );
}