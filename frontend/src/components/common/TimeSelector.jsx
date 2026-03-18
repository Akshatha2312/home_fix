import React from "react";

const TimeSelector = ({
  selectedTime,
  onSelect,
  bookedSlots = [],
  selectedDate,
  selectedDuration = 1,
}) => {
  // Generate static times: 09:00 to 18:00 (10 slots)
  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  // Helper to check if a slot is booked (considering existing bookings' duration)
  const isSlotBooked = (time) => {
    return bookedSlots.some((booking) => {
      const [bHour, bMin] = booking.time.split(":").map(Number);
      const [cHour, cMin] = time.split(":").map(Number);

      // Existing booking range: [start, end)
      const bookingStartMins = bHour * 60 + bMin;
      const bookingEndMins = bookingStartMins + booking.duration * 60;

      // Current slot (just the start time for visual check)
      const currentSlotMins = cHour * 60 + cMin;

      // If existing booking covers this slot's start time
      return (
        currentSlotMins >= bookingStartMins && currentSlotMins < bookingEndMins
      );
    });
  };

  // Helper to check if selecting this time would cause an overlap given the selected duration
  const wouldOverlap = (time) => {
    if (selectedDuration <= 1) return false; // Basic check covered by isSlotBooked

    const [cHour, cMin] = time.split(":").map(Number);
    const newBookingStart = cHour * 60 + cMin;
    const newBookingEnd = newBookingStart + selectedDuration * 60;

    return bookedSlots.some((booking) => {
      const [bHour, bMin] = booking.time.split(":").map(Number);
      const existingStart = bHour * 60 + bMin;
      const existingEnd = existingStart + booking.duration * 60;

      // Check for range overlap: (StartA < EndB) && (EndA > StartB)
      return newBookingStart < existingEnd && newBookingEnd > existingStart;
    });
  };

  // Check if a time slot is in the past (only if selectedDate is today)
  const isSlotPast = (time) => {
    if (!selectedDate) return false;

    const today = new Date();
    const selected = new Date(selectedDate);

    // Reset loop time components to compare just dates
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const selectedDateObj = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate(),
    );

    // If selected date is in the past (shouldn't happen with min date), return true
    if (selectedDateObj < todayDate) return true;

    // If selected date is future, return false
    if (selectedDateObj > todayDate) return false;

    // If selected date is today, check time
    const [slotHour, slotMin] = time.split(":").map(Number);
    const currentHour = today.getHours();
    const currentMin = today.getMinutes();

    if (slotHour < currentHour) return true;
    if (slotHour === currentHour && slotMin < currentMin) return true;

    return false;
  };

  const formatTime = (time) => {
    const [hour, min] = time.split(":").map(Number);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${min.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {timeSlots.map((time) => {
        const isBooked = isSlotBooked(time);
        const isPast = isSlotPast(time);
        const overlaps = wouldOverlap(time);
        const isDisabled = isBooked || isPast || overlaps;
        const isSelected = selectedTime === time;

        return (
          <button
            key={time}
            type="button"
            disabled={isDisabled}
            onClick={() => onSelect(time)}
            className={`
              py-3 px-2 rounded-lg text-sm font-medium transition-all border
              ${
                isDisabled
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed box-decoration-slice"
                  : isSelected
                    ? "bg-blue-500 text-white border-blue-500 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }
            `}
          >
            {formatTime(time)}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSelector;
