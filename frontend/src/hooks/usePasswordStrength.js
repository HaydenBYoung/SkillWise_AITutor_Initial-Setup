import { useState, useEffect } from 'react';

export const usePasswordStrength = (password) => {
  const [strength, setStrength] = useState({
    score: 0,
    message: '',
    color: 'gray',
  });

  useEffect(() => {
    if (!password) {
      setStrength({
        score: 0,
        message: '',
        color: 'gray',
      });
      return;
    }

    let score = 0;
    let messages = [];

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      messages.push('Use at least 8 characters');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      messages.push('Add uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      messages.push('Add lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      messages.push('Add number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      messages.push('Add special character');
    }

    // Set color and message based on score
    let color = 'red';
    let message = 'Very weak';

    if (score === 5) {
      color = 'green';
      message = 'Strong';
    } else if (score === 4) {
      color = 'blue';
      message = 'Good';
    } else if (score === 3) {
      color = 'yellow';
      message = 'Fair';
    } else if (score === 2) {
      color = 'orange';
      message = 'Weak';
    }

    setStrength({
      score,
      message: messages.length > 0 ? messages.join(', ') : message,
      color,
    });
  }, [password]);

  return strength;
};
