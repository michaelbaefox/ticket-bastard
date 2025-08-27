import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroImage from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground mb-8 leading-tight">
            SECURE
            <br />
            <span className="text-neo-cyan">BLOCKCHAIN</span>
            <br />
            TICKETING
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium">
            Experience fraud-proof event tickets powered by blockchain technology. 
            Transparent, secure, and truly owned by you.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button variant="neo" size="lg" className="text-lg px-8 py-6 h-auto">
              Get Your Tickets
            </Button>
            <Button variant="neo-outline" size="lg" className="text-lg px-8 py-6 h-auto">
              Create Event
            </Button>
          </div>
          
          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <Card className="p-8 bg-card border-2 border-foreground shadow-[4px_4px_0px_0px] shadow-foreground">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-foreground mb-3">100% Secure</h3>
              <p className="text-muted-foreground">
                Blockchain technology ensures your tickets are authentic and fraud-proof
              </p>
            </Card>
            
            <Card className="p-8 bg-card border-2 border-foreground shadow-[4px_4px_0px_0px] shadow-foreground">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-foreground mb-3">Instant Transfer</h3>
              <p className="text-muted-foreground">
                Transfer tickets instantly to friends or resell on our secure marketplace
              </p>
            </Card>
            
            <Card className="p-8 bg-card border-2 border-foreground shadow-[4px_4px_0px_0px] shadow-foreground">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-bold text-foreground mb-3">True Ownership</h3>
              <p className="text-muted-foreground">
                Your tickets are NFTs - you truly own them, not just a license to use
              </p>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Geometric Decorations */}
      <div className="absolute top-20 left-10 w-16 h-16 border-4 border-neo-cyan rotate-45 opacity-60" />
      <div className="absolute bottom-40 right-20 w-12 h-12 bg-neo-cyan opacity-80" />
      <div className="absolute top-1/2 left-5 w-8 h-8 border-2 border-foreground rotate-12" />
      <div className="absolute bottom-20 left-1/4 w-6 h-20 bg-foreground opacity-30" />
    </section>
  );
};

export default HeroSection;