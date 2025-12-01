const aiService = require('../../src/services/aiService');

// Helper to build a fake OpenAI client
function makeFakeClient (content) {
  return {
    chat: {
      completions: {
        create: jest.fn(async () => ({
          choices: [ { message: { content } } ],
        })),
      },
    },
  };
}

describe('aiService prompt outputs (snapshot)', () => {
  afterEach(() => {
    // Reset client injection between tests
    if (typeof aiService.resetOpenAIClient === 'function') {
      aiService.resetOpenAIClient();
    }
  });

  test('generateChallenge normalized output', async () => {
    const fakeContent = JSON.stringify({
      title: 'Arrays 101',
      description: 'Practice basic array operations',
      category: 'Programming',
      difficulty: 'Easy',
      points: 50,
      estimatedTime: 20,
      tags: ['arrays','basics'],
    });
    aiService.setOpenAIClient(makeFakeClient(fakeContent));

    const result = await aiService.generateChallenge({ preferences: { topic: 'arrays' } });
    // Prisma may fail in test env; normalize object for snapshot (remove volatile fields)
    const serializable = {
      title: result.title,
      description: result.description,
      category: result.category,
      difficulty: result.difficulty,
      points: result.points,
      estimatedTime: result.estimatedTime,
      tags: result.tags,
      // flag may be present if prisma save failed
      saved: result.saved === false ? false : true,
    };
    expect(serializable).toMatchSnapshot();
  });

  test('suggestNextChallenges normalized array', async () => {
    const fakeArray = JSON.stringify([
      { title: 'Loops Basics', description: 'For/while practice', category: 'Programming', difficulty: 'Easy', points: 40, estimatedTime: 15, tags: [] },
      { title: 'Conditional Logic', description: 'If/else practice', category: 'Programming', difficulty: 'Medium', points: 60, estimatedTime: 25, tags: [] },
      { title: 'Functions', description: 'Write simple functions', category: 'Programming', difficulty: 'Medium', points: 70, estimatedTime: 30, tags: [] }
    ]);
    aiService.setOpenAIClient(makeFakeClient(fakeArray));

    const list = await aiService.suggestNextChallenges({ preferences: { topic: 'basics' }, count: 3, persist: false });
    const serializable = list.map(item => ({
      title: item.title,
      description: item.description,
      category: item.category,
      difficulty: item.difficulty,
      points: item.points,
      estimatedTime: item.estimatedTime,
      tags: item.tags,
    }));
    expect(serializable).toMatchSnapshot();
  });

  test('generateFeedback normalized output', async () => {
    const fakeFeedback = JSON.stringify({
      feedback_text: 'Good job. Improve variable naming.',
      score: 78,
      confidence_score: 0.62,
      strengths: ['logic','syntax'],
      improvements: ['naming'],
      suggestions: ['refactor for readability']
    });
    aiService.setOpenAIClient(makeFakeClient(fakeFeedback));

    const submission = { id: 1, challenge_id: null, submission_text: 'code here' };
    const result = await aiService.generateFeedback(submission);
    const serializable = {
      feedback_text: result.feedback_text,
      score: result.score ?? null,
      confidence_score: result.confidence_score ?? null,
      strengths: result.strengths,
      improvements: result.improvements,
      suggestions: result.suggestions,
    };
    expect(serializable).toMatchSnapshot();
  });

  test('generateHints normalized output', async () => {
    const fakeHints = JSON.stringify({ hints: ['Read problem carefully','Break into steps','Test with examples'] });
    aiService.setOpenAIClient(makeFakeClient(fakeHints));

    const result = await aiService.generateHints({ id: null, title: 'Basic Math', description: 'Add two numbers' });
    const serializable = {
      hints: result.hints,
      ai_model: result.ai_model,
      // processing_time_ms varies; only snapshot structure
      processing_time_ms_type: typeof result.processing_time_ms,
    };
    expect(serializable).toMatchSnapshot();
  });
});
