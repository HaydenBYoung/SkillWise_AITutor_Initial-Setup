import React, { useState } from 'react';
import { apiService } from '../services/api';

// Simple AI feedback submission form. Reads text files client-side and sends
// `submission_text` to backend (JSON) to avoid changing backend multipart handling.
const allowedTypes = [
  'text/plain',
  'text/markdown',
  'application/javascript',
  'application/json',
  'text/x-python',
  'text/x-java-source',
  'text/html',
  'text/css',
];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function AIFeedbackForm({ onResult }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const reset = () => {
    setText('');
    setFile(null);
    setError(null);
    setResult(null);
  };

  const validateFile = (f) => {
    if (!f) return null;
    if (f.size > MAX_FILE_SIZE) {
      return `File too large (max ${Math.round(MAX_FILE_SIZE / 1024)} KB)`;
    }
    if (
      !allowedTypes.includes(f.type) &&
      !f.name.match(/\.(txt|md|js|py|java|json|html|css)$/i)
    ) {
      return 'Unsupported file type. Please upload a text-based file.';
    }
    return null;
  };

  const handleFileChange = (e) => {
    setError(null);
    const f = e.target.files && e.target.files[0];
    const err = validateFile(f);
    if (err) {
      setFile(null);
      setError(err);
      return;
    }
    setFile(f || null);
  };

  const readFileAsText = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(f);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!text && !file) {
      setError('Please provide text or upload a file to submit');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let submissionText = text;
      if (file) {
        // Read file client-side (only text-based files allowed by validation)
        submissionText = await readFileAsText(file);
      }

      if (!submissionText || submissionText.trim().length === 0) {
        setError('Submission text is empty after processing the file');
        setLoading(false);
        return;
      }

      const payload = { submission_text: submissionText };

      const res = await apiService.ai.submitForFeedback(payload);

      setResult(res);
      if (onResult) onResult(res);
    } catch (err) {
      console.error('AIFeedbackForm submit error', err);
      setError(err?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-feedback-form">
      <form onSubmit={handleSubmit}>
        <label htmlFor="ai-text" className="block font-medium mb-1">
          Paste text for AI feedback
        </label>
        <textarea
          id="ai-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="w-full p-2 border rounded mb-2"
          placeholder="Paste your submission text here..."
        />

        <label className="block font-medium mb-1">Or upload a text file</label>
        <input
          type="file"
          accept=".txt,.md,.js,.py,.java,.json,.html,.css,text/*"
          onChange={handleFileChange}
          data-testid="file-input"
        />

        {error && <div className="text-red-600 mt-2">{error}</div>}

        <div className="mt-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit for AI feedback'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="ml-2 px-3 py-2 border rounded"
          >
            Reset
          </button>
        </div>
      </form>

      {result && result.ai && (
        <div className="ai-result mt-4 p-3 border rounded bg-gray-50">
          <h3 className="font-semibold">AI Feedback Summary</h3>
          <p className="mt-2">
            {result.ai.summary || result.ai.parsed || result.ai.raw}
          </p>

          {result.data && result.data.id && (
            <div className="mt-2">
              <a
                href={`/ai/feedback/${result.data.id}`}
                target="_blank"
                rel="noreferrer"
              >
                View full AI report
              </a>
            </div>
          )}

          {result.ai && result.ai.reportUrl && (
            <div className="mt-2">
              <a href={result.ai.reportUrl} target="_blank" rel="noreferrer">
                Open full AI report
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
