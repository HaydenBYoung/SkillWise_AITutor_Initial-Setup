// Cypress E2E tests for AI Challenge Generation (Story 3.1, 3.2)
describe('AI Challenge Generation', () => {
  beforeEach(() => {
    // Clear local storage and cookies
    cy.clearLocalStorage();
    cy.clearCookies();

    // Register and login before each test
    cy.visit('/');
    cy.get('a[href="/register"]').click();

    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;

    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.get('input[name="confirmPassword"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();

    // Wait for redirect to home
    cy.url().should('include', '/home');

    // Navigate to challenges page
    cy.contains('Challenges').click();
  });

  it('should open AI challenge modal when clicking generate button', () => {
    // Find and click the AI generate button
    cy.contains('button', 'AI Generate').click();

    // Modal should be visible
    cy.contains('🤖 AI Challenge Generator').should('be.visible');
    cy.contains('Let our AI create a personalized challenge').should(
      'be.visible'
    );
  });

  it('should close modal when clicking close button', () => {
    cy.contains('button', 'AI Generate').click();
    cy.contains('🤖 AI Challenge Generator').should('be.visible');

    // Click close button
    cy.get('.modal-close').click();

    // Modal should not be visible
    cy.contains('🤖 AI Challenge Generator').should('not.exist');
  });

  it('should display form with all required fields', () => {
    cy.contains('button', 'AI Generate').click();

    // Check all form fields are present
    cy.get('select[name="skill"]').should('exist');
    cy.get('select[name="difficulty"]').should('exist');
    cy.get('input[name="topic"]').should('exist');
    cy.get('select[name="type"]').should('exist');
    cy.contains('button', '✨ Generate Challenge').should('exist');
  });

  it('should require topic field before submission', () => {
    cy.contains('button', 'AI Generate').click();

    // Try to submit without filling topic
    cy.get('select[name="skill"]').select('JavaScript');
    cy.get('select[name="difficulty"]').select('medium');
    cy.contains('button', '✨ Generate Challenge').click();

    // Should show validation error or prevent submission
    cy.get('input[name="topic"]:invalid').should('exist');
  });

  it('should generate challenge with valid inputs', () => {
    // Intercept API call
    cy.intercept('POST', '/api/ai/generateChallenge', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          title: 'Array Manipulation Challenge',
          description:
            'Create a function that removes duplicates from an array.',
          difficulty: 'medium',
          category: 'JavaScript',
          estimatedTime: '30 minutes',
          examples: [{ input: '[1, 2, 2, 3]', output: '[1, 2, 3]' }],
          acceptanceCriteria: [
            'Function should handle arrays of any type',
            'Should not mutate original array',
          ],
          aiModel: 'gpt-3.5-turbo',
          processingTime: 1500,
        },
      },
    }).as('generateChallenge');

    cy.contains('button', 'AI Generate').click();

    // Fill out form
    cy.get('select[name="skill"]').select('JavaScript');
    cy.get('select[name="difficulty"]').select('medium');
    cy.get('input[name="topic"]').type('Array Manipulation');
    cy.get('select[name="type"]').select('coding');

    // Submit form
    cy.contains('button', '✨ Generate Challenge').click();

    // Wait for API call
    cy.wait('@generateChallenge');

    // Should display generated challenge
    cy.contains('Array Manipulation Challenge').should('be.visible');
    cy.contains('Create a function that removes duplicates').should(
      'be.visible'
    );
    cy.contains('30 minutes').should('be.visible');
  });

  it('should display loading state during generation', () => {
    // Intercept with delay
    cy.intercept('POST', '/api/ai/generateChallenge', (req) => {
      req.reply((res) => {
        res.delay = 2000;
        res.send({
          success: true,
          data: {
            title: 'Test Challenge',
            description: 'Test description',
            difficulty: 'easy',
            category: 'Python',
          },
        });
      });
    }).as('slowGenerate');

    cy.contains('button', 'AI Generate').click();

    // Fill form
    cy.get('select[name="skill"]').select('Python');
    cy.get('input[name="topic"]').type('Testing');
    cy.contains('button', '✨ Generate Challenge').click();

    // Should show loading state
    cy.contains('🔄 Generating...').should('be.visible');
    cy.contains('button', '✨ Generate Challenge').should('be.disabled');

    // Wait for completion
    cy.wait('@slowGenerate');
  });

  it('should display error message when generation fails', () => {
    cy.intercept('POST', '/api/ai/generateChallenge', {
      statusCode: 500,
      body: {
        success: false,
        message: 'OpenAI API error occurred',
      },
    }).as('failedGenerate');

    cy.contains('button', 'AI Generate').click();

    cy.get('select[name="skill"]').select('Java');
    cy.get('input[name="topic"]').type('Testing');
    cy.contains('button', '✨ Generate Challenge').click();

    cy.wait('@failedGenerate');

    // Should display error message
    cy.contains('OpenAI API error occurred').should('be.visible');
  });

  it('should display all challenge details after generation', () => {
    cy.intercept('POST', '/api/ai/generateChallenge', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          title: 'Complete Challenge',
          description: 'A comprehensive challenge with all details',
          difficulty: 'hard',
          category: 'C++',
          estimatedTime: '60 minutes',
          examples: [
            { input: 'input1', output: 'output1' },
            { input: 'input2', output: 'output2' },
          ],
          acceptanceCriteria: ['Criterion 1', 'Criterion 2', 'Criterion 3'],
          aiModel: 'gpt-3.5-turbo',
          processingTime: 2000,
        },
      },
    }).as('completeChallenge');

    cy.contains('button', 'AI Generate').click();

    cy.get('select[name="skill"]').select('C++');
    cy.get('input[name="topic"]').type('Advanced Topics');
    cy.contains('button', '✨ Generate Challenge').click();

    cy.wait('@completeChallenge');

    // Verify all details are displayed
    cy.contains('Complete Challenge').should('be.visible');
    cy.contains('A comprehensive challenge with all details').should(
      'be.visible'
    );
    cy.contains('hard').should('be.visible');
    cy.contains('C++').should('be.visible');
    cy.contains('60 minutes').should('be.visible');
    cy.contains('input1').should('be.visible');
    cy.contains('output1').should('be.visible');
    cy.contains('Criterion 1').should('be.visible');
    cy.contains('Criterion 2').should('be.visible');
    cy.contains('Criterion 3').should('be.visible');
  });

  it('should allow saving generated challenge', () => {
    cy.intercept('POST', '/api/ai/generateChallenge', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          title: 'Saveable Challenge',
          description: 'Test challenge',
          difficulty: 'easy',
          category: 'Python',
          estimatedTime: '20 minutes',
          examples: [],
          acceptanceCriteria: [],
        },
      },
    }).as('generateChallenge');

    // Mock save endpoint
    cy.intercept('POST', '/api/challenges', {
      statusCode: 201,
      body: {
        success: true,
        data: { id: 1, title: 'Saveable Challenge' },
      },
    }).as('saveChallenge');

    cy.contains('button', 'AI Generate').click();

    cy.get('select[name="skill"]').select('Python');
    cy.get('input[name="topic"]').type('Testing');
    cy.contains('button', '✨ Generate Challenge').click();

    cy.wait('@generateChallenge');

    // Click save button
    cy.contains('button', '💾 Save Challenge').click();

    cy.wait('@saveChallenge');

    // Should show success message or close modal
    cy.contains('Challenge saved successfully').should('be.visible');
  });

  it('should handle authentication errors', () => {
    // Clear auth token
    cy.clearLocalStorage();

    cy.intercept('POST', '/api/ai/generateChallenge', {
      statusCode: 401,
      body: {
        success: false,
        message: 'Authentication required',
      },
    }).as('unauthorizedGenerate');

    cy.visit('/challenges');

    // Should redirect to login or show error
    cy.url().should('include', '/login');
  });
});
