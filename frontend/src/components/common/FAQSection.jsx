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
    <section className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-blue-100">
            <HelpCircle className="w-4 h-4" /> Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 mt-2 text-base">
            Everything you need to know about booking and receiving services on HomeFix.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-gray-900 text-base sm:text-lg hover:bg-gray-50/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-expanded={isOpen}
                >
                  <span className="leading-snug">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "transform rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-gray-600 text-sm sm:text-base leading-relaxed border-t border-gray-100/60 bg-gray-50/40">
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
