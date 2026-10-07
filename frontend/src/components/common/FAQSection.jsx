import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I book a home service on HomeFix?",
      answer:
        "Select a service category (like Plumbing, Electrical, or Cleaning), browse verified local providers, choose your preferred date and time slot, and submit your booking request. Your provider will confirm your appointment shortly.",
    },
    {
      question: "How does payment work for service bookings?",
      answer:
        "Payment is transparent and hassle-free. You pay after your service is completed. Hourly rates are clearly displayed on each provider's profile.",
    },
    {
      question: "How are service providers verified on HomeFix?",
      answer:
        "Every provider undergoes profile verification, identity verification, and background checks by our team before being listed on the platform.",
    },
    {
      question: "Can I choose my preferred date and time for service?",
      answer:
        "Yes! When booking a provider, you can view their real-time schedule and choose an available date and start time that works best for you.",
    },
    {
      question: "How do customer reviews and ratings work?",
      answer:
        "After a service booking is completed, customers can rate their provider on a 5-star scale and leave detailed feedback about their service experience.",
    },
    {
      question: "How can I check the status of my booking?",
      answer:
        "Log into your Customer Dashboard to view all your pending, accepted, completed, or cancelled bookings in real time.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white border-t border-slate-100">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-[#0F766E] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-teal-100 shadow-2xs">
            <HelpCircle className="w-4 h-4 text-[#0F766E]" /> Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2747] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 mt-2 text-base max-w-xl mx-auto">
            Everything you need to know about booking and receiving services on HomeFix.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "bg-slate-50/80 border-teal-200 shadow-sm"
                    : "bg-white border-slate-200/80 hover:border-teal-200 shadow-2xs"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-semibold text-[#172033] text-base sm:text-lg hover:text-[#0F766E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                  aria-expanded={isOpen}
                >
                  <span className="leading-snug">{faq.question}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? "bg-[#0F766E] text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isOpen ? "transform rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 bg-white/60">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
