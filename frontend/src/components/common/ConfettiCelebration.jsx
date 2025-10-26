import React, { useEffect, useState } from 'react';
import './ConfettiCelebration.css';

const ConfettiCelebration = ({ onComplete }) => {
  const [emojis, setEmojis] = useState([]);

  useEffect(() => {
    // Create 30 smiling face emojis
    const newEmojis = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      emoji: '😊',
      left: Math.random() * 100, // Random horizontal position (0-100%)
      delay: Math.random() * 0.5, // Random start delay (0-0.5s)
      duration: 2 + Math.random() * 2, // Random fall duration (2-4s)
      rotation: Math.random() * 360, // Random rotation
      size: 30 + Math.random() * 30, // Random size (30-60px)
    }));
    
    setEmojis(newEmojis);

    // Clean up after animation completes
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000); // Run for 4 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="confetti-container">
      {emojis.map((emoji) => (
        <div
          key={emoji.id}
          className="confetti-emoji"
          style={{
            left: `${emoji.left}%`,
            fontSize: `${emoji.size}px`,
            animationDelay: `${emoji.delay}s`,
            animationDuration: `${emoji.duration}s`,
          }}
        >
          {emoji.emoji}
        </div>
      ))}
    </div>
  );
};

export default ConfettiCelebration;
