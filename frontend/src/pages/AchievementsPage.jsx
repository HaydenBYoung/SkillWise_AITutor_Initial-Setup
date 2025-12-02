import { useEffect, useState } from 'react';

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      try {
        // Use explicit backend base URL from environment (fallback to /api)
        const base =
          (process.env.REACT_APP_API_URL &&
            process.env.REACT_APP_API_URL.replace(/\/$/, '')) ||
          '/api';
        const res = await fetch(`${base}/achievements`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAchievements(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  if (loading) return <div>Loading achievements...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="achievements-page">
      <h1>Achievements</h1>
      {achievements.length === 0 ? (
        <p>No achievements found.</p>
      ) : (
        <ul>
          {achievements.map((a) => (
            <li key={a.id}>
              <strong>{a.title}</strong> — {a.description}{' '}
              {a.points ? `(+${a.points} pts)` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AchievementsPage;
