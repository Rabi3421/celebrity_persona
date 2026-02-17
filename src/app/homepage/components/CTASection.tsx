export default function CTASection() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="glass-card rounded-3xl p-12 md:p-16">
          <h2 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Join the Celebrity
            <br />
            <span className="text-gradient-gold">Fashion Community</span>
          </h2>
          <p className="font-inter text-lg text-neutral-400 mb-12 max-w-2xl mx-auto">
            Upload your celebrity-inspired outfits, share buying links, and connect with
            thousands of fashion enthusiasts worldwide.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="glass-card px-8 py-4 rounded-full bg-primary hover:bg-primary/90 transition-all w-full sm:w-auto">
              <span className="text-base font-medium text-black">Upload Your Outfit</span>
            </button>
            <button className="glass-card px-8 py-4 rounded-full border-2 border-white/20 hover:border-primary/50 transition-all w-full sm:w-auto">
              <span className="text-base font-medium text-white">Browse More Styles</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}