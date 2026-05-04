const stats = [
  { value: "10K+", label: "Active Servers" },
  { value: "500K+", label: "Users" },
  { value: "50M+", label: "Songs Played" },
  { value: "99.9%", label: "Uptime" },
];

export function StatsSection() {
  return (
    <section id="stats" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-12 md:p-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Trusted by thousands of
              <span className="text-primary"> Discord servers</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
