// Cypress E2E tests for AI Feedback Submission (Story 3.4, 3.5)
describe('AI Feedback Submission', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Register and login
    cy.visit('/');
    cy.get('a[href="/register"]').click();

    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;

    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.get('input[name="confirmPassword"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/home');
  });

  it('should display AI feedback form on submission page', () => {
    // Navigate to a challenge submission page
    cy.visit('/challenges/1/submit');

    // Should see feedback form
    cy.contains('🤖 Get AI Feedback').should('be.visible');
    cy.get('textarea[placeholder*="Paste your code"]').should('be.visible');
  });

  it('should handle file upload', () => {
    cy.visit('/challenges/1/submit');

    // Create a test file
    const fileName = 'test.js';
    const fileContent = 'const x = 10;';

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: 'text/javascript',
    });

    // Should display file name
    cy.contains('📄 test.js').should('be.visible');

    // Code should be loaded into textarea
    cy.get('textarea').should('have.value', fileContent);
  });

  it('should accept code via textarea', () => {
    cy.visit('/challenges/1/submit');

    const code = 'function test() { return true; }';
    cy.get('textarea[placeholder*="Paste your code"]').type(code);

    cy.get('textarea').should('have.value', code);
  });

  it('should not submit empty code', () => {
    cy.visit('/challenges/1/submit');

    // Try to submit without code
    cy.contains('button', '✨ Get AI Feedback').should('be.disabled');
  });

  it('should submit code and display feedback', () => {
    cy.intercept('POST', '/api/ai/submitForFeedback', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          feedbackText: 'Great code! Well structured and efficient.',
          confidenceScore: 0.95,
          strengths: [
            'Clean and readable code',
            'Proper error handling',
            'Good variable naming',
          ],
          improvements: [
            'Consider adding comments',
            'Could use more descriptive function names',
          ],
          suggestions: ['Add unit tests', 'Consider edge cases'],
          aiModel: 'gpt-3.5-turbo',
          processingTime: 1200,
        },
      },
    }).as('submitFeedback');

    cy.visit('/challenges/1/submit');

    cy.get('textarea[placeholder*="Paste your code"]').type('const x = 10;');
    cy.contains('button', '✨ Get AI Feedback').click();

    cy.wait('@submitFeedback');

    // Should display feedback results
    cy.contains('📊 AI Feedback Results').should('be.visible');
    cy.contains('Great code! Well structured and efficient.').should(
      'be.visible'
    );
  });

  it('should display confidence score with progress bar', () => {
    cy.intercept('POST', '/api/ai/submitForFeedback', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          feedbackText: 'Good work',
          confidenceScore: 0.85,
          strengths: [],
          improvements: [],
          suggestions: [],
        },
      },
    }).as('submitFeedback');

    cy.visit('/challenges/1/submit');

    cy.get('textarea').type('code here');
    cy.contains('button', '✨ Get AI Feedback').click();

    cy.wait('@submitFeedback');

    // Should show confidence score
    cy.contains('85%').should('be.visible');
    cy.get('.score-fill').should('have.css', 'width', '85%');
  });

  it('should display categorized feedback lists', () => {
    cy.intercept('POST', '/api/ai/submitForFeedback', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          feedbackText: 'Overall feedback',
          confidenceScore: 0.9,
          strengths: ['Strength 1', 'Strength 2'],
          improvements: ['Improvement 1', 'Improvement 2'],
          suggestions: ['Suggestion 1', 'Suggestion 2'],
        },
      },
    }).as('submitFeedback');

    cy.visit('/challenges/1/submit');

    cy.get('textarea').type('test code');
    cy.contains('button', '✨ Get AI Feedback').click();

    cy.wait('@submitFeedback');

    // Should show all sections
    cy.contains('💪 Strengths').should('be.visible');
    cy.contains('Strength 1').should('be.visible');
    cy.contains('Strength 2').should('be.visible');

    cy.contains('🎯 Areas for Improvement').should('be.visible');
    cy.contains('Improvement 1').should('be.visible');
    cy.contains('Improvement 2').should('be.visible');

    cy.contains('💡 Suggestions').should('be.visible');
    cy.contains('Suggestion 1').should('be.visible');
    cy.contains('Suggestion 2').should('be.visible');
  });

  it('should show loading state during feedback generation', () => {
    cy.intercept('POST', '/api/ai/submitForFeedback', (req) => {
      req.reply((res) => {
        res.delay = 2000;
        res.send({
          success: true,
          data: {
            feedbackText: 'Test feedback',
            confidenceScore: 0.8,
            strengths: [],
            improvements: [],
            suggestions: [],
          },
        });
      });
    }).as('slowFeedback');

    cy.visit('/challenges/1/submit');

    cy.get('textarea').type('code');
    cy.contains('button', '✨ Get AI Feedback').click();

    // Should show loading
    cy.contains('🔄 Analyzing...').should('be.visible');
    cy.contains('button', '✨ Get AI Feedback').should('be.disabled');

    cy.wait('@slowFeedback');
  });

  it('should display error message on failure', () => {
    cy.intercept('POST', '/api/ai/submitForFeedback', {
      statusCode: 500,
      body: {
        success: false,
        message: 'Failed to generate feedback',
      },
    }).as('failedFeedback');

    cy.visit('/challenges/1/submit');

    cy.get('textarea').type('code');
    cy.contains('button', '✨ Get AI Feedback').click();

    cy.wait('@failedFeedback');

    // Should show error
    cy.contains('Failed to generate feedback').should('be.visible');
  });

  it('should allow submitting another after receiving feedback', () => {
    cy.intercept('POST', '/api/ai/submitForFeedback', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          feedbackText: 'First feedback',
          confidenceScore: 0.9,
          strengths: [],
          improvements: [],
          suggestions: [],
        },
      },
    }).as('submitFeedback');

    cy.visit('/challenges/1/submit');

    cy.get('textarea').type('first code');
    cy.contains('button', '✨ Get AI Feedback').click();

    cy.wait('@submitFeedback');

    // Should show results
    cy.contains('📊 AI Feedback Results').should('be.visible');

    // Click "Submit Another"
    cy.contains('button', '← Submit Another').click();

    // Should show form again
    cy.get('textarea[placeholder*="Paste your code"]').should('be.visible');
    cy.contains('📊 AI Feedback Results').should('not.exist');
  });

  it('should handle multiple file types', () => {
    const fileTypes = [
      { name: 'test.js', mime: 'text/javascript' },
      { name: 'test.py', mime: 'text/x-python' },
      { name: 'test.java', mime: 'text/x-java' },
      { name: 'test.cpp', mime: 'text/x-c++src' },
    ];

    fileTypes.forEach((fileType) => {
      cy.visit('/challenges/1/submit');

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('test code'),
        fileName: fileType.name,
        mimeType: fileType.mime,
      });

      cy.contains(`📄 ${fileType.name}`).should('be.visible');
    });
  });

  it('should display AI model and processing time', () => {
    cy.intercept('POST', '/api/ai/submitForFeedback', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          feedbackText: 'Feedback',
          confidenceScore: 0.9,
          strengths: [],
          improvements: [],
          suggestions: [],
          aiModel: 'gpt-3.5-turbo',
          processingTime: 1500,
        },
      },
    }).as('submitFeedback');

    cy.visit('/challenges/1/submit');

    cy.get('textarea').type('code');
    cy.contains('button', '✨ Get AI Feedback').click();

    cy.wait('@submitFeedback');

    // Should show metadata
    cy.contains('Generated by gpt-3.5-turbo in 1500ms').should('be.visible');
  });

  it('should handle authentication errors', () => {
    cy.clearLocalStorage();

    cy.intercept('POST', '/api/ai/submitForFeedback', {
      statusCode: 401,
      body: {
        success: false,
        message: 'Authentication required',
      },
    }).as('unauthorizedFeedback');

    cy.visit('/challenges/1/submit');

    cy.get('textarea').type('code');
    cy.contains('button', '✨ Get AI Feedback').click();

    cy.wait('@unauthorizedFeedback');

    // Should redirect to login or show error
    cy.url().should('include', '/login');
  });

  it('should validate file size limits', () => {
    cy.visit('/challenges/1/submit');

    // Create a large file (> 1MB)
    const largeContent = 'x'.repeat(1024 * 1024 * 2); // 2MB

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from(largeContent),
        fileName: 'large.js',
        mimeType: 'text/javascript',
      },
      { force: true }
    );

    // Should show error or reject file
    cy.contains(/file too large|size limit/i).should('be.visible');
  });
});
