import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressBar, { LinearProgressBar } from '../ProgressBar';

describe('ProgressBar Component', () => {
  test('renders circular progress bar with correct percentage', () => {
    render(<ProgressBar percentage={75} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  test('renders with custom label', () => {
    render(<ProgressBar percentage={50} label="Course Progress" />);

    expect(screen.getByText('Course Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('clamps percentage values correctly', () => {
    render(<ProgressBar percentage={150} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  test('handles negative percentage values', () => {
    render(<ProgressBar percentage={-10} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

describe('LinearProgressBar Component', () => {
  test('renders linear progress bar with correct percentage', () => {
    render(<LinearProgressBar percentage={60} label="Goal Progress" />);

    expect(screen.getByText('Goal Progress')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  test('renders without text when showText is false', () => {
    render(<LinearProgressBar percentage={75} showText={false} />);

    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });

  test('renders without label when not provided', () => {
    render(<LinearProgressBar percentage={40} />);

    // Without a label, the percentage text is not shown
    expect(screen.queryByText('40%')).not.toBeInTheDocument();
  });
});
