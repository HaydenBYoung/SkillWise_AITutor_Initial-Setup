import {} from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Toggle dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <style jsx>{`
        .theme-toggle {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--primary);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .theme-toggle:hover {
          transform: scale(1.1) rotate(10deg);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }

        .theme-toggle:active {
          transform: scale(0.95);
        }

        .theme-icon {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        @media (max-width: 768px) {
          .theme-toggle {
            bottom: 1rem;
            right: 1rem;
            width: 50px;
            height: 50px;
            font-size: 1.25rem;
          }
        }
      `}</style>

      <span className="theme-icon">{isDark ? '☀️' : '🌙'}</span>
    </button>
  );
};

export default ThemeToggle;
