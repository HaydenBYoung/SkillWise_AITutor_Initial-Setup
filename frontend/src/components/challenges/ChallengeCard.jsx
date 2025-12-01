// Tailwind-based Challenge Card
// Renders title, description, status and a Start button.
import { useState } from 'react';

const statusClasses = (status) => {
  switch ((status || '').toLowerCase()) {
  case 'open':
  case 'available':
    return 'bg-green-100 text-green-800';
  case 'in-progress':
  case 'started':
    return 'bg-yellow-100 text-yellow-800';
  case 'closed':
  case 'completed':
    return 'bg-gray-100 text-gray-700';
  case 'locked':
    return 'bg-red-100 text-red-800';
  default:
    return 'bg-indigo-100 text-indigo-800';
  }
};

const ChallengeCard = ({ challenge = {}, onStart, onDelete, onSkip, onReopenSkipped }) => {
  const [showDetails, setShowDetails] = useState(false);
  const title = challenge.title || 'Untitled Challenge';
  const description = challenge.description || 'No description provided.';
  const status = challenge.status || challenge.state || 'available';
  const difficulty = challenge.difficulty_level || challenge.difficulty || 'medium';
  const points = challenge.points_reward || challenge.points || 0;
  
  // Create a short summary (first 100 characters)
  const summary = description.length > 100 ? description.substring(0, 100) + '...' : description;

  return (
    <>
      <article
        className="challenge-card bg-white shadow-sm rounded-lg p-4 flex flex-col justify-between border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setShowDetails(true)}
        data-testid={`challenge-card-${challenge.id || 'no-id'}`}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">
              {summary}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses(
                status,
              )}`}
              data-testid="challenge-status"
            >
              {status}
            </span>
            <div className="text-right text-sm text-gray-500">
              <div>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </div>
              <div className="font-medium text-gray-800">+{points} pts</div>
            </div>
          </div>
        </header>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {challenge.estimated_time_minutes && (
              <span className="inline-flex items-center gap-1">
                ⏱ {challenge.estimated_time_minutes}m
              </span>
            )}
            {challenge.tags && challenge.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {challenge.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
              data-testid="challenge-start-button"
            >
              View Details
            </button>
          </div>
        </div>
      </article>

      {/* Challenge Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClasses(status)}`}>
                  {status}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  +{points} pts
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
                </div>

                {challenge.instructions && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{challenge.instructions}</p>
                  </div>
                )}

                {challenge.learning_objectives && challenge.learning_objectives.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Learning Objectives</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {challenge.learning_objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {challenge.tags && challenge.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {challenge.tags.map((tag, i) => (
                        <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {challenge.estimated_time_minutes && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-semibold">Estimated Time:</span>
                    <span>{challenge.estimated_time_minutes} minutes</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex gap-3">
                  {status.toLowerCase() === 'skipped' && onReopenSkipped ? (
                    <button
                      onClick={() => {
                        onReopenSkipped(challenge.id);
                        setShowDetails(false);
                      }}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
                    >
                      Reopen Challenge
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        if (onStart) onStart(challenge.id);
                      }}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md"
                    >
                      Start Challenge
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md"
                  >
                    Close
                  </button>
                </div>
                {status.toLowerCase() !== 'skipped' && (
                  <div className="flex gap-3">
                    {onSkip && (
                      <button
                        onClick={() => {
                          if (window.confirm('Mark this challenge as skipped (no points)?')) {
                            onSkip(challenge.id);
                            setShowDetails(false);
                          }
                        }}
                        className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md"
                      >
                        Skip (No Points)
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this challenge?')) {
                            onDelete(challenge.id);
                            setShowDetails(false);
                          }
                        }}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md"
                      >
                        Delete Challenge
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChallengeCard;
