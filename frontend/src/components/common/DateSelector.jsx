import React, { useRef } from "react";
import { format, addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DateSelector = ({ selectedDate, onSelect }) => {
  const scrollContainerRef = useRef(null);

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      fullDate: format(date, "yyyy-MM-dd"),
      day: format(date, "EEE").toUpperCase(), // WED
      dateNum: format(date, "d"), // 18
      month: format(date, "MMM").toUpperCase(), // FEB
    };
  });

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 200;
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="w-full relative flex items-center">
      <button
        onClick={() => scroll("left")}
        className="p-1 rounded-full hover:bg-gray-100 hidden sm:block mx-1"
        type="button"
      >
        <ChevronLeft className="w-5 h-5 text-gray-500" />
      </button>

      <div
        ref={scrollContainerRef}
        className="flex space-x-3 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x flex-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {dates.map((item) => {
          const isSelected = selectedDate === item.fullDate;
          return (
            <button
              key={item.fullDate}
              type="button"
              onClick={() => onSelect(item.fullDate)}
              className={`flex-shrink-0 w-20 h-24 rounded-lg flex flex-col items-center justify-center transition-all snap-start border ${
                isSelected
                  ? "bg-blue-500 text-white border-blue-500 shadow-lg scale-105"
                  : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <span
                className={`text-xs font-semibold ${isSelected ? "text-blue-100" : "text-gray-400"}`}
              >
                {item.day}
              </span>
              <span
                className={`text-2xl font-bold my-1 ${isSelected ? "text-white" : "text-gray-700"}`}
              >
                {item.dateNum}
              </span>
              <span
                className={`text-xs font-semibold ${isSelected ? "text-blue-100" : "text-gray-400"}`}
              >
                {item.month}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scroll("right")}
        className="p-1 rounded-full hover:bg-gray-100 hidden sm:block mx-1"
        type="button"
      >
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  );
};

export default DateSelector;
