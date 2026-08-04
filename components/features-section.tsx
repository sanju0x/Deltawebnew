import {
  AudioLines,
  Gauge,
  ListMusic,
  RadioTower,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";

const features = [
  {
    number: "01",
    icon: AudioLines,
    title: "Audio that feels alive",
    description:
      "Clear, full-range playback tuned for long sessions, from focused lo-fi rooms to packed community events.",
    className: "feature-card feature-card-wide feature-card-red",
  },
  {
    number: "02",
    icon: Gauge,
    title: "Instant response",
    description:
      "Commands react immediately and queues keep moving without awkward pauses.",
    className: "feature-card",
  },
  {
    number: "03",
    icon: ListMusic,
    title: "Queues that make sense",
    description:
      "Build, reorder, loop, and share the room's soundtrack without leaving Discord.",
    className: "feature-card",
  },
  {
    number: "04",
    icon: SlidersHorizontal,
    title: "Shape the sound",
    description:
      "Bass boost, filters, volume controls, and presets for every kind of room.",
    className: "feature-card",
  },
  {
    number: "05",
    icon: RadioTower,
    title: "Stay on 24/7",
    description:
      "Keep radio, ambient sound, or playlists running even when the room goes quiet.",
    className: "feature-card",
  },
  {
    number: "06",
    icon: UsersRound,
    title: "Made for communities",
    description:
      "DJ roles and permission controls keep shared listening fun, fair, and easy to manage.",
    className: "feature-card feature-card-wide feature-card-ink",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="section-space">
      <div className="site-container">
        <div className="section-heading">
          <span className="section-kicker">Built for the room</span>
          <h2>Less bot management. More music.</h2>
          <p>
            Every detail is designed to disappear into the conversation until
            the exact moment you need it.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.number} className={feature.className}>
              <span className="feature-number">{feature.number}</span>
              <feature.icon className="feature-icon" aria-hidden="true" />
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
