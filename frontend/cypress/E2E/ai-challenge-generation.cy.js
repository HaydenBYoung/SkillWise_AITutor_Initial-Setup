/**
 * End-to-End Tests for AI Challenge Generation
 * Story 3.1 & 3.2: Test AI challenge generation flow
 */

describe('AI Challenge Generation', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should open AI challenge generation modal', () => {
    cy.visit('/challenges');
    
    // Click the "Generate with AI" button
    cy.contains('button', /generate.*ai/i).click();
    
    // Modal should be visible
    cy.get('.ai-modal-overlay').should('be.visible');
    cy.contains('Generate AI Challenge').should('be.visible');
  });

  it('should generate a challenge with AI', () => {
    cy.visit('/challenges');
    cy.contains('button', /generate.*ai/i).click();

    // Fill out the form
    cy.get('#category').select('JavaScript');
    cy.get('#difficulty').select('medium');
    cy.get('#focusAreas').type('async/await, promises');
    cy.get('#count').clear().type('1');

    // Intercept the API call
    cy.intercept('POST', '/api/ai/generateChallenge', {
      statusCode: 200,
      body: {
        success: true,
        challenges: [{
          title: 'Master Async JavaScript',
          description: 'Learn to work with promises and async/await',
          instructions: '1. Create async functions\n2. Handle promises\n3. Error handling',
          category: 'JavaScript',
          difficulty_level: 'medium',
          estimated_time_minutes: 90,
          points_reward: 10,
          learning_objectives: ['Understand async/await', 'Handle promises'],
          tags: ['javascript', 'async', 'promises']
        }],
        processing_time_ms: 1500
      }
    }).as('generateChallenge');

    // Submit the form
    cy.contains('button', /generate/i).click();

    // Wait for API response
    cy.wait('@generateChallenge');

    // Verify the generated challenge is displayed
    cy.contains('Master Async JavaScript').should('be.visible');
    cy.contains('90 min').should('be.visible');
    cy.contains('10 points').should('be.visible');
  });

  it('should allow editing generated challenge before saving', () => {
    cy.visit('/challenges');
    cy.contains('button', /generate.*ai/i).click();

    cy.get('#category').select('Python');
    cy.get('#difficulty').select('easy');

    cy.intercept('POST', '/api/ai/generateChallenge', {
      statusCode: 200,
      body: {
        success: true,
        challenges: [{
          title: 'Python Basics',
          description: 'Learn Python fundamentals',
          instructions: 'Follow the tutorial',
          category: 'Python',
          difficulty_level: 'easy',
          estimated_time_minutes: 30,
          points_reward: 5,
          learning_objectives: ['Python syntax'],
          tags: ['python']
        }]
      }
    }).as('generateChallenge');

    cy.contains('button', /generate/i).click();
    cy.wait('@generateChallenge');

    // Click edit button
    cy.contains('button', /edit/i).click();

    // Edit the title
    cy.get('input[value="Python Basics"]').clear().type('Advanced Python Basics');

    // Save edits
    cy.contains('button', /done/i).click();

    // Verify the updated title
    cy.contains('Advanced Python Basics').should('be.visible');
  });

  it('should save generated challenge to database', () => {
    cy.visit('/challenges');
    cy.contains('button', /generate.*ai/i).click();

    cy.get('#category').select('React');

    cy.intercept('POST', '/api/ai/generateChallenge', {
      statusCode: 200,
      body: {
        success: true,
        challenges: [{
          title: 'Build React Components',
          description: 'Create reusable React components',
          instructions: 'Build components',
          category: 'React',
          difficulty_level: 'medium',
          estimated_time_minutes: 60,
          points_reward: 10,
          learning_objectives: ['Component creation'],
          tags: ['react']
        }]
      }
    }).as('generateChallenge');

    cy.intercept('POST', '/api/ai/challenges/save', {
      statusCode: 201,
      body: {
        success: true,
        challenge: {
          id: 1,
          title: 'Build React Components',
          is_ai_generated: true
        }
      }
    }).as('saveChallenge');

    cy.contains('button', /generate/i).click();
    cy.wait('@generateChallenge');

    // Click save button
    cy.contains('button', /save/i).click();
    cy.wait('@saveChallenge');

    // Modal should close
    cy.get('.ai-modal-overlay').should('not.exist');

    // Success message should appear
    cy.contains(/saved|success/i).should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    cy.visit('/challenges');
    cy.contains('button', /generate.*ai/i).click();

    cy.get('#category').select('JavaScript');

    cy.intercept('POST', '/api/ai/generateChallenge', {
      statusCode: 500,
      body: {
        success: false,
        error: 'Failed to generate challenges'
      }
    }).as('generateChallengeError');

    cy.contains('button', /generate/i).click();
    cy.wait('@generateChallengeError');

    // Error message should be displayed
    cy.contains(/failed|error/i).should('be.visible');
  });

  it('should validate form before submission', () => {
    cy.visit('/challenges');
    cy.contains('button', /generate.*ai/i).click();

    // Try to submit without selecting category
    cy.contains('button', /generate/i).click();

    // Error message should appear
    cy.contains(/category.*required/i).should('be.visible');
  });
});
