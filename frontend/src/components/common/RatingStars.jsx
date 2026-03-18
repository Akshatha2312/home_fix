import { Star } from "lucide-react";

const RatingStars = ({ rating, size = "sm", showCount = false, count = 0 }) => {
  const sizes = { xs: "w-3 h-3", sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };
  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizes[size]} ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
      <span className={`${textSizes[size]} font-medium text-gray-700 ml-1`}>
        {rating?.toFixed(1)}
      </span>
      {showCount && (
        <span className={`${textSizes[size]} text-gray-400`}>({count})</span>
      )}
    </div>
  );
};

export default RatingStars;
