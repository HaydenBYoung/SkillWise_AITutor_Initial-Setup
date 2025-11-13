// Loading spinner component (simple placeholder). Consider adding variants and animations.
import {} from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  // Simple spinner UI; can be enhanced with different sizes and animations
  return (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner"></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
