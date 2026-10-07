import { Tag, Sparkles } from "lucide-react";

const PromotionalBanner = () => {
  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-800/50">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-4 relative z-10 text-center md:text-left flex-col md:flex-row">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="bg-blue-500/30 text-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-400/30 uppercase tracking-wider">
                  Upcoming Platform Feature
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Promotional Offers & Rewards Program
              </h3>
              <p className="text-blue-200 text-xs md:text-sm mt-1 max-w-xl">
                We are currently building direct promotional discounts and seasonal customer rewards. Stay tuned for special service offers in future updates!
              </p>
            </div>
          </div>

          <div className="relative z-10 shrink-0">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/20 shadow-sm">
              <Tag className="w-4 h-4 text-blue-300" /> Transparent Upfront Pricing Always Guaranteed
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionalBanner;
