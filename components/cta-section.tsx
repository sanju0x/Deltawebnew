import { Button } from "@/components/ui/button";
import { Play, MessageCircle } from "lucide-react";

export function CTASection() {
  return (
    <section id="support" className="py-24 px-4 bg-secondary/30">
      <div className="max-w-4xl mx-auto text-center">
        <div className="rounded-[2.5rem] bg-card border border-border p-12 md:p-16">
          {/* Icon */}
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <svg
                className="h-7 w-7 text-primary-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Ready to bring the
            <span className="text-primary"> music</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10 text-pretty">
            Add Delta to your server in seconds and start playing your favorite
            tracks right away.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg gap-2"
            >
              <Play className="h-5 w-5" />
              Add to Discord
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-border text-foreground hover:bg-secondary px-8 py-6 text-lg gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              Join Support Server
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
