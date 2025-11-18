const aiPrompts = require('../src/services/aiPrompts');
const aiService = require('../src/services/aiService');

describe('AI Prompt Templates', () => {
  test('generateFeedbackPrompt includes category, objectives, and submission', () => {
    const params = {
      category: 'JavaScript',
      difficulty: 'Intermediate',
      learningObjectives: ['use closures', 'write higher-order functions'],
      submissionText: 'function add(a, b) { return a + b; }',
      challengeContext: { title: 'Sum Two Numbers' },
    };

    const prompt = aiPrompts.generateFeedbackPrompt(params);

    expect(prompt).toMatch(/JavaScript/);
    expect(prompt).toMatch(/learning objectives/);
    expect(prompt).toMatch(/function add\(a, b\)/);
    expect(prompt).toMatch(/Sum Two Numbers/);
  });

  test('generateHintsPrompt returns 3 hint instructions in template', () => {
    const hint = aiPrompts.generateHintsPrompt({
      category: 'Algorithms',
      difficulty: 'Hard',
      learningObjectives: ['analyze complexity'],
      challengeTitle: 'Big O Analysis',
      userProgress: 'Attempted but stuck on optimization',
    });

    expect(hint).toMatch(/Provide 3 progressive hints/);
    expect(hint).toMatch(/Big O Analysis/);
  });
});

describe('AI Service integration', () => {
  test('aiService.generateFeedback returns an object with prompt string', async () => {
    const submission = 'const x = [1,2,3].map(n => n * 2);';
    const challengeContext = {
      title: 'Array Mapping',
      category: 'JavaScript',
      difficulty: 'Easy',
      learningObjectives: ['use map', 'avoid mutation'],
    };

    const result = await aiService.generateFeedback(
      submission,
      challengeContext
    );

    expect(result).toHaveProperty('prompt');
    expect(typeof result.prompt).toBe('string');
    expect(result.prompt).toMatch(/Array Mapping/);
    expect(result.prompt).toMatch(/const x = \[1,2,3\]\.map/);
  });
});
