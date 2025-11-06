// Tailwind-based Challenge Card
// Renders title, description, status and a Start button.
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

const ChallengeCard = ({ challenge = {}, onStart }) => {
  const title = challenge.title || 'Untitled Challenge';
  const description = challenge.description || 'No description provided.';
  const status = challenge.status || challenge.state || 'available';
  const difficulty = challenge.difficulty || 'medium';
  const points = challenge.points ?? 0;

  return (
    <article
      className="challenge-card bg-white shadow-sm rounded-lg p-4 flex flex-col justify-between border border-gray-100"
      data-testid={`challenge-card-${challenge.id || 'no-id'}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-3">
            {description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses(
              status
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
          {challenge.estimatedTime && (
            <span className="inline-flex items-center gap-1">
              ⏱ {challenge.estimatedTime}m
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
            onClick={() => onStart && onStart(challenge.id)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
            data-testid="challenge-start-button"
          >
            Start
          </button>
        </div>
      </div>
    </article>
  );
};

export default ChallengeCard;
