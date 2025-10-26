import { useState } from 'react';

const Tooltip = ({ message, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 w-48 px-2 py-1 -mt-1 text-sm text-white transform -translate-y-full bg-gray-900 rounded-lg shadow-sm top-0 left-1/2 -translate-x-1/2">
          {message}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -translate-x-1/2 left-1/2 -bottom-1" />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
