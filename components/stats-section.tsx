const stats = [
  { value: "10K+", label: "active servers" },
  { value: "500K", label: "listeners reached" },
  { value: "50M+", label: "tracks played" },
  { value: "99.9%", label: "uptime target" },
];

export function StatsSection() {
  return (
    <section id="stats" className="stats-section">
      <div className="site-container">
        <div className="stats-panel">
          <div className="stats-intro">
            <span className="section-kicker section-kicker-light">At full volume</span>
            <h2>One small bot. A lot of shared moments.</h2>
          </div>
          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
