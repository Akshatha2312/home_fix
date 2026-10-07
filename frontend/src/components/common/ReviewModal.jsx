import { useState } from "react";
import { Star, X, Loader } from "lucide-react";
import { bookingsAPI } from "../../services/api";
import toast from "react-hot-toast";

const ReviewModal = ({ bookingId, providerName, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmitting(true);
      await bookingsAPI.submitReview(bookingId, { rating, review });
      toast.success("Review submitted successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Rate Service</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            How was your experience with <strong>{providerName}</strong>?
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col items-center gap-2 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Select Rating</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none transition-transform hover:scale-125 focus:scale-110 p-1"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`w-9 h-9 ${
                        star <= (hoveredRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      } transition-colors duration-150`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-gray-700 h-4">
                {(hoveredRating || rating) === 1 && "1 Star - Poor"}
                {(hoveredRating || rating) === 2 && "2 Stars - Fair"}
                {(hoveredRating || rating) === 3 && "3 Stars - Good"}
                {(hoveredRating || rating) === 4 && "4 Stars - Very Good"}
                {(hoveredRating || rating) === 5 && "5 Stars - Excellent!"}
                {!(hoveredRating || rating) && "Tap stars to rate"}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Write a Review (Optional)
                </label>
                <span className="text-[11px] text-gray-400">
                  {review.length}/500
                </span>
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value.slice(0, 500))}
                placeholder="Describe your service experience, quality of work, and timeliness..."
                rows="4"
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                "Submit Verified Review"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
