import AIFeedbackForm from '../components/AIFeedbackForm';

export default function AIFeedbackPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">AI Feedback</h1>
      <p className="mb-4">
        Submit text or upload a file to receive AI feedback on your submission.
      </p>
      <AIFeedbackForm />
    </div>
  );
}
//idk what goes here yet
