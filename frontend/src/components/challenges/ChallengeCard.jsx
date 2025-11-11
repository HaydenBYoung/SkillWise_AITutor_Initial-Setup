import React, { useState, useEffect } from 'react';
import ProgressBar from '../common/ProgressBar';

const ChallengeCard = ({
  challenge,
  onToggleComplete,
  pending = false,
  onUndo,
}) => {
  const title = challenge?.title || 'Untitled Challenge';
  const description = challenge?.description || 'No description provided.';
  const difficulty = challenge?.difficulty || 'Medium';
  const points = challenge?.points || 0;
  const estimatedTime = challenge?.estimatedTime || null;
  const tags = challenge?.tags || [];

  // Local UI state for optimistic updates
  const [completed, setCompleted] = useState(Boolean(challenge?.completed));
  const [progress, setProgress] = useState(() => {
    if (typeof challenge?.progress === 'number') return challenge.progress;
    return completed ? 100 : 0;
  });
  // Keep state in sync if parent updates the challenge prop
  useEffect(() => {
    setCompleted(Boolean(challenge?.completed));
    setProgress(
      typeof challenge?.progress === 'number'
        ? challenge.progress
        : challenge?.completed
          ? 100
          : 0,
    );
  }, [challenge?.completed, challenge?.progress]);
  const [isUpdating, setIsUpdating] = useState(false);

  return (
    <div className="bg-white shadow rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{description}</p>

          <div className="mt-4 flex items-center space-x-4">
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                difficulty === 'Easy'
                  ? 'bg-green-100 text-green-800'
                  : difficulty === 'Hard'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {difficulty}
            </div>

            <div className="text-xs text-gray-500">{points} pts</div>

            {estimatedTime && (
              <div className="text-xs text-gray-500">⏱ {estimatedTime} min</div>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4">
            <ProgressBar value={progress} size="md" showLabel={false} />
            <div className="mt-1 text-xs text-gray-500">
              {progress}% complete
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              completed
                ? 'bg-green-100 text-green-800'
                : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {completed ? 'Completed' : 'Not Completed'}
          </div>

          <div className="mt-4 flex flex-col space-y-2">
            <button className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
              View
            </button>
            <button className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              Start
            </button>

            <div className="space-y-2">
              {!completed && !pending && (
                <button
                  onClick={async () => {
                    if (isUpdating) return;
                    setIsUpdating(true);

                    // Optimistic update
                    setCompleted(true);
                    setProgress(100);

                    const updated = {
                      ...challenge,
                      completed: true,
                      progress: 100,
                    };

                    // Notify other parts of the app
                    window.dispatchEvent(
                      new CustomEvent('challenge:updated', {
                        detail: { challenge: updated },
                      }),
                    );

                    try {
                      if (typeof onToggleComplete === 'function') {
                        await onToggleComplete(challenge.id, updated);
                      }
                    } catch (err) {
                      // Revert optimistic update on failure
                      setCompleted(Boolean(challenge?.completed));
                      setProgress(
                        typeof challenge?.progress === 'number'
                          ? challenge.progress
                          : challenge?.completed
                            ? 100
                            : 0,
                      );
                      // eslint-disable-next-line no-console
                      console.error('Failed to mark challenge complete', err);
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Marking...' : 'Mark Complete'}
                </button>
              )}

              {pending && (
                <button
                  onClick={() => {
                    // Undo the optimistic completion while persistence is pending
                    if (typeof onUndo === 'function') onUndo(challenge.id);
                    // revert local UI state
                    setCompleted(false);
                    setProgress(
                      typeof challenge?.progress === 'number'
                        ? challenge.progress
                        : 0,
                    );
                  }}
                  className="px-3 py-2 bg-yellow-50 text-yellow-800 rounded-md text-sm border border-yellow-200 hover:bg-yellow-100"
                >
                  Undo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;
