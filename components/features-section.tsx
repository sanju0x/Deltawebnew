import {
  Headphones,
  Zap,
  ListMusic,
  Volume2,
  Disc3,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Headphones,
    title: "Crystal Clear Audio",
    description:
      "Experience lossless audio streaming with support for multiple sources including YouTube, Spotify, and SoundCloud.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Instant response times with optimized performance. No lag, no delays, just pure music.",
  },
  {
    icon: ListMusic,
    title: "Smart Playlists",
    description:
      "Create, save, and share playlists with your server. Queue management made simple.",
  },
  {
    icon: Volume2,
    title: "Audio Effects",
    description:
      "Bass boost, nightcore, vaporwave, and more. Customize your listening experience.",
  },
  {
    icon: Disc3,
    title: "24/7 Mode",
    description:
      "Keep the music playing around the clock. Perfect for lofi streams and background music.",
  },
  {
    icon: Users,
    title: "DJ Mode",
    description:
      "Control who can manage the queue. Perfect for parties and events.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Everything you need for the
            <span className="text-primary"> perfect vibe</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Packed with features that make Delta the most powerful music bot for
            your Discord server.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-[2rem] bg-card border border-border p-8 hover:border-primary/50 transition-all duration-300"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
