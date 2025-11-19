import React, { useState } from 'react';
import GenerateChallengeModal from './GenerateChallengeModal';

const GenerateChallengeButton = ({ className = '' }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={`generate-challenge-button ${className}`}
        onClick={() => setOpen(true)}
      >
        Generate Challenge
      </button>
      {open && <GenerateChallengeModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default GenerateChallengeButton;
