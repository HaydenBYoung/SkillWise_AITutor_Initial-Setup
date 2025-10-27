import React, { useEffect, useState } from 'react';
import './ConfettiCelebration.css';

const TrophyCelebration = ({ onComplete }) => {
  const [trophies, setTrophies] = useState([]);

  useEffect(() => {
    // Create 25 trophy emojis
    const trophyEmojis = ['🏆', '🥇', '🥈', '🥉', '🏅'];
    const newTrophies = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      emoji: trophyEmojis[Math.floor(Math.random() * trophyEmojis.length)],
      left: Math.random() * 100, // Random horizontal position (0-100%)
      delay: Math.random() * 0.5, // Random start delay (0-0.5s)
      duration: 2 + Math.random() * 2, // Random fall duration (2-4s)
      rotation: Math.random() * 360, // Random rotation
      size: 35 + Math.random() * 25, // Random size (35-60px)
    }));
    
    setTrophies(newTrophies);

    // Clean up after animation completes
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000); // Run for 4 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="confetti-container">
      {trophies.map((trophy) => (
        <div
          key={trophy.id}
          className="confetti-emoji"
          style={{
            left: `${trophy.left}%`,
            fontSize: `${trophy.size}px`,
            animationDelay: `${trophy.delay}s`,
            animationDuration: `${trophy.duration}s`,
          }}
        >
          {trophy.emoji}
        </div>
      ))}
    </div>
  );
};

export default TrophyCelebration;