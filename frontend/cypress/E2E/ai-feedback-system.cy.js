/**
 * End-to-End Tests for AI Feedback System
 * Story 3.4 & 3.5: Test AI feedback submission flow
 */

describe('AI Feedback System', () => {
  beforeEach(() => {
    // Login
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should display AI feedback panel on challenge page', () => {
    cy.visit('/challenges/1');
    
    cy.contains('AI Feedback Assistant').should('be.visible');
    cy.get('textarea[id="submissionText"]').should('be.visible');
    cy.get('select[id="submissionType"]').should('be.visible');
  });

  it('should submit work for AI feedback', () => {
    cy.visit('/challenges/1');

    // Select submission type
    cy.get('select[id="submissionType"]').select('code');

    // Enter submission
    const codeSubmission = 'function hello() { console.log("Hello World"); }';
    cy.get('textarea[id="submissionText"]').type(codeSubmission);

    // Mock the API response
    cy.intercept('POST', '/api/ai/submitForFeedback', {
      statusCode: 200,
      body: {
        success: true,
        feedback: {
          id: 1,
          score: 85,
          feedback_text: 'Great work! Your function is well-structured.',
          strengths: ['Clean syntax', 'Proper naming'],
          improvements: ['Add error handling', 'Include documentation'],
          suggestions: ['Use arrow functions', 'Add type checking'],
          confidence_score: 0.92,
          processing_time_ms: 1200
        }
      }
    }).as('submitFeedback');

    // Submit for feedback
    cy.contains('button', /get.*feedback/i).click();
    cy.wait('@submitFeedback');

    // Verify feedback is displayed
    cy.contains('Feedback Results').should('be.visible');
    cy.contains('85').should('be.visible');
    cy.contains('Great work!').should('be.visible');
    cy.contains('Clean syntax').should('be.visible');
    cy.contains('Add error handling').should('be.visible');
  });

  it('should display confidence score', () => {
    cy.visit('/challenges/1');

    cy.get('select[id="submissionType"]').select('text');
    cy.get('textarea[id="submissionText"]').type('This is my solution explanation');

    cy.intercept('POST', '/api/ai/submitForFeedback', {
      statusCode: 200,
      body: {
        success: true,
        feedback: {
          id: 1,
          score: 75,
          feedback_text: 'Good effort',
          strengths: ['Clear explanation'],
          improvements: ['More detail needed'],
          suggestions: ['Add examples'],
          confidence_score: 0.88
        }
      }
    }).as('submitFeedback');

    cy.contains('button', /get.*feedback/i).click();
    cy.wait('@submitFeedback');

    // Check confidence score display
    cy.contains('Confidence: 88%').should('be.visible');
  });

  it('should allow follow-up questions about feedback', () => {
    cy.visit('/challenges/1');

    cy.get('textarea[id="submissionText"]').type('My code here');

    cy.intercept('POST', '/api/ai/submitForFeedback', {
      statusCode: 200,
      body: {
        success: true,
        feedback: {
          id: 1,
          score: 80,
          feedback_text: 'Good work',
          strengths: ['Working code'],
          improvements: ['Optimize loops'],
          suggestions: ['Use map instead'],
          confidence_score: 0.9
        }
      }
    }).as('submitFeedback');

    cy.intercept('POST', '/api/ai/feedback/1/followup', {
      statusCode: 200,
      body: {
        success: true,
        answer: 'Using map() is more efficient for array transformations because it creates a new array and is more functional in style.'
      }
    }).as('followUp');

    cy.contains('button', /get.*feedback/i).click();
    cy.wait('@submitFeedback');

    // Ask follow-up question
    cy.get('input[placeholder*="follow-up"]').type('Why should I use map instead?');
    cy.contains('button', /ask/i).click();
    cy.wait('@followUp');

    // Verify answer is displayed
    cy.contains('Using map() is more efficient').should('be.visible');
  });

  it('should display feedback history for submission', () => {
    cy.intercept('GET', '/api/ai/feedback/1', {
      statusCode: 200,
      body: {
        success: true,
        history: [
          {
            id: 1,
            feedback_text: 'First feedback',
            confidence_score: 0.85,
            strengths: ['Good start'],
            ai_model: 'gemini-2.0-flash',
            created_at: '2024-01-15T10:00:00Z'
          },
          {
            id: 2,
            feedback_text: 'Second feedback',
            confidence_score: 0.9,
            strengths: ['Much improved'],
            ai_model: 'gemini-2.0-flash',
            created_at: '2024-01-16T10:00:00Z'
          }
        ]
      }
    }).as('getFeedbackHistory');

    cy.visit('/challenges/1?submissionId=1');
    cy.wait('@getFeedbackHistory');

    // Verify history is displayed
    cy.contains('Feedback History').should('be.visible');
    cy.contains('First feedback').should('be.visible');
    cy.contains('Second feedback').should('be.visible');
  });

  it('should handle different submission types', () => {
    cy.visit('/challenges/1');

    // Test with link submission
    cy.get('select[id="submissionType"]').select('link');
    cy.get('textarea[id="submissionText"]').should('have.attr', 'placeholder').and('include', 'URL');

    // Test with code submission
    cy.get('select[id="submissionType"]').select('code');
    cy.get('textarea[id="submissionText"]').should('have.attr', 'placeholder').and('include', 'code');

    // Test with text submission
    cy.get('select[id="submissionType"]').select('text');
    cy.get('textarea[id="submissionText"]').should('have.attr', 'placeholder').and('include', 'solution');
  });

  it('should validate submission before sending', () => {
    cy.visit('/challenges/1');

    // Try to submit empty form
    cy.contains('button', /get.*feedback/i).click();

    // Error should be displayed
    cy.contains(/enter.*submission/i).should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    cy.visit('/challenges/1');

    cy.get('textarea[id="submissionText"]').type('Some code');

    cy.intercept('POST', '/api/ai/submitForFeedback', {
      statusCode: 500,
      body: {
        success: false,
        error: 'Failed to generate feedback'
      }
    }).as('submitFeedbackError');

    cy.contains('button', /get.*feedback/i).click();
    cy.wait('@submitFeedbackError');

    // Error message should be displayed
    cy.contains(/failed|error/i).should('be.visible');
  });

  it('should show loading state during feedback generation', () => {
    cy.visit('/challenges/1');

    cy.get('textarea[id="submissionText"]').type('Code here');

    cy.intercept('POST', '/api/ai/submitForFeedback', (req) => {
      req.reply((res) => {
        res.delay(2000);
        res.send({
          success: true,
          feedback: {
            id: 1,
            score: 80,
            feedback_text: 'Good',
            strengths: [],
            improvements: [],
            suggestions: [],
            confidence_score: 0.8
          }
        });
      });
    }).as('submitFeedback');

    cy.contains('button', /get.*feedback/i).click();

    // Loading state should be visible
    cy.contains(/analyzing/i).should('be.visible');
    cy.contains('button', /get.*feedback/i).should('be.disabled');
  });
});
