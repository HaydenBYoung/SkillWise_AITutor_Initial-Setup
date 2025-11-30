import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { apiService } from '../services/api';
import AIFeedbackForm from '../components/AIFeedbackForm';

export default function ChallengeDetailPage() {
  const { id } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenge = async () => {
      setLoading(true);
      try {
        const resp = await apiService.challenges.getById(id);
        const data = resp && resp.data ? resp.data : resp || null;
        setChallenge(data);
      } catch (err) {
        console.error('Failed to load challenge', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id]);

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        {loading ? (
          <LoadingSpinner message="Loading challenge..." />
        ) : !challenge ? (
          <div>
            <h2 className="text-xl font-semibold">Challenge not found</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="col-span-2">
              <h1 className="text-2xl font-bold mb-2">{challenge.title}</h1>
              <p className="text-sm text-gray-600 mb-4">
                {challenge.description}
              </p>
              <div className="mb-4">
                <strong>Difficulty:</strong> {challenge.difficulty}
                {'  '}•{'  '}
                <strong>Estimated Time:</strong>{' '}
                {challenge.estimatedTime || 'N/A'} mins
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Details</h3>
                {/* Render any additional challenge details here */}
                <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {challenge.instructions || ''}
                </pre>
              </div>
            </section>

            <aside className="col-span-1">
              <div className="p-4 border rounded bg-white shadow-sm">
                <h3 className="font-semibold mb-2">Get AI Feedback</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Paste your solution or upload your file below to get AI
                  feedback tailored to this challenge.
                </p>
                <AIFeedbackForm initialText={challenge.description || ''} />
              </div>
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
