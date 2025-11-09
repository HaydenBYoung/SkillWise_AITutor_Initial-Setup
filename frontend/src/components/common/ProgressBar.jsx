import React, { useEffect, useRef, useState } from 'react';

/**
 * ProgressBar
 * Props:
 * - value: number (0-100)
 * - size: 'sm' | 'md' | 'lg'
 * - showLabel: boolean
 * - className: additional classes
 */
const ProgressBar = ({ value = 0, size = 'md', showLabel = true, className = '' }) => {
  const [internal, setInternal] = useState(0);
  const barRef = useRef(null);

  useEffect(() => {
    // animate internal value for a smooth transition
    const start = internal;
    const end = Math.max(0, Math.min(100, Number(value) || 0));
    if (start === end) return setInternal(end);

    const duration = 500; // ms
    const startTime = performance.now();

    let rafId;
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad-ish
      const next = Math.round(start + (end - start) * eased);
      setInternal(next);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  const heightClass = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={`w-full ${className}`}>
      <div className={`relative bg-gray-100 rounded-full overflow-hidden ${heightClass}`} aria-hidden>
        <div
          ref={barRef}
          className={'absolute left-0 top-0 bottom-0 bg-indigo-500'}
          style={{ width: `${Math.min(100, Math.max(0, internal))}%`, transition: 'width 200ms linear' }}
        />
      </div>

      {showLabel && (
        <div className="mt-1 text-xs text-gray-500 flex justify-between">
          <span>Progress</span>
          <span>{Math.min(100, Math.max(0, internal))}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
