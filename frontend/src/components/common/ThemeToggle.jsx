import {} from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  const styles = {
    button: {
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: 'var(--primary)',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.3s ease',
      zIndex: 1000,
    },
    icon: {
      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
    },
  };

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      style={styles.button}
      aria-label="Toggle dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span style={styles.icon}>{isDark ? '☀️' : '🌙'}</span>
    </button>
  );
};

export default ThemeToggle;
