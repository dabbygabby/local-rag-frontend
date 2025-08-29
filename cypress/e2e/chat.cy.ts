/**
 * End-to-end tests for Chat functionality
 * Note: This file demonstrates the E2E testing approach.
 * To run these tests, you would need to install and configure Cypress.
 * 
 * Installation: npm install --save-dev cypress
 * Run: npx cypress open
 */

describe('Chat Page', () => {
  beforeEach(() => {
    // Visit the chat page before each test
    cy.visit('/chat');
  });

  it('should display the chat interface correctly', () => {
    // Check page title and main elements
    cy.contains('Knowledge Base Chat').should('be.visible');
    cy.contains('Interactive conversation with your documents').should('be.visible');
    
    // Check navigation
    cy.get('[data-testid="new-session-btn"]').should('be.visible');
    cy.get('[data-testid="settings-btn"]').should('be.visible');
    
    // Check empty state
    cy.contains('Start a conversation').should('be.visible');
    cy.contains('Ask questions about your knowledge base').should('be.visible');
    
    // Check input area
    cy.get('textarea[placeholder*="Ask a question"]').should('be.visible');
    cy.get('button').contains('Send').should('be.visible');
  });

  it('should handle message sending and streaming response', () => {
    // Mock the streaming API response
    cy.intercept('POST', '/api/chat', {
      headers: {
        'content-type': 'text/event-stream',
      },
      body: `data: {"content":"Hello ","is_final":false}

data: {"content":"there! ","is_final":false}

data: {"content":"How can I help you?","is_final":true,"sources":[]}

`,
    }).as('chatStream');

    // Type a message
    const testMessage = 'Hello, can you help me?';
    cy.get('textarea[placeholder*="Ask a question"]').type(testMessage);
    
    // Send the message
    cy.get('button').contains('Send').click();
    
    // Verify user message appears
    cy.contains(testMessage).should('be.visible');
    
    // Wait for the API call
    cy.wait('@chatStream');
    
    // Verify streaming indicator appears and disappears
    cy.contains('Thinking...').should('be.visible');
    
    // Verify assistant response appears
    cy.contains('Hello there! How can I help you?').should('be.visible');
    
    // Verify input is cleared and focused
    cy.get('textarea[placeholder*="Ask a question"]').should('have.value', '');
    cy.get('textarea[placeholder*="Ask a question"]').should('be.focused');
  });

  it('should open and configure settings', () => {
    // Open settings
    cy.get('[data-testid="settings-btn"]').click();
    
    // Verify settings sheet opens
    cy.contains('Chat Settings').should('be.visible');
    
    // Test various settings
    cy.contains('Temperature').should('be.visible');
    cy.contains('Max Tokens').should('be.visible');
    cy.contains('Include Sources').should('be.visible');
    
    // Test slider interaction
    cy.get('[data-testid="temperature-slider"]').should('be.visible');
    
    // Test switch interaction
    cy.get('[data-testid="include-sources-switch"]').click();
    
    // Test knowledge base selection
    cy.contains('Knowledge Bases').should('be.visible');
    
    // Close settings
    cy.get('[data-testid="close-settings"]').click();
    
    // Verify settings closed
    cy.contains('Chat Settings').should('not.exist');
  });

  it('should start a new session', () => {
    // First, send a message to create some history
    cy.get('textarea[placeholder*="Ask a question"]').type('Initial message');
    cy.get('button').contains('Send').click();
    
    // Mock response
    cy.intercept('POST', '/api/chat', {
      body: 'data: {"content":"Response","is_final":true}\n\n'
    });
    
    // Wait a moment for the message to appear
    cy.contains('Initial message').should('be.visible');
    
    // Start new session
    cy.get('[data-testid="new-session-btn"]').click();
    
    // Verify messages are cleared
    cy.contains('Initial message').should('not.exist');
    
    // Verify empty state returns
    cy.contains('Start a conversation').should('be.visible');
    
    // Verify toast notification
    cy.contains('New session started').should('be.visible');
  });

  it('should handle errors gracefully', () => {
    // Mock error response
    cy.intercept('POST', '/api/chat', {
      statusCode: 500,
      body: { detail: 'Internal server error' }
    }).as('chatError');

    // Send a message
    cy.get('textarea[placeholder*="Ask a question"]').type('Test message');
    cy.get('button').contains('Send').click();
    
    // Wait for error
    cy.wait('@chatError');
    
    // Verify error handling
    cy.contains('Error').should('be.visible');
    cy.contains('Internal server error').should('be.visible');
    
    // Verify user message still visible but no assistant response
    cy.contains('Test message').should('be.visible');
  });

  it('should warn when no knowledge bases are selected', () => {
    // Verify warning appears when no knowledge bases selected
    cy.contains('No knowledge bases selected').should('be.visible');
    cy.contains('Please configure your settings').should('be.visible');
  });

  it('should support keyboard shortcuts', () => {
    const textarea = cy.get('textarea[placeholder*="Ask a question"]');
    
    // Test Enter to send
    textarea.type('Message 1{enter}');
    cy.contains('Message 1').should('be.visible');
    
    // Test Shift+Enter for new line
    textarea.type('Line 1{shift+enter}Line 2');
    
    // Verify textarea contains both lines
    textarea.should('contain.value', 'Line 1\nLine 2');
  });

  it('should maintain conversation context', () => {
    // Mock responses for a conversation
    cy.intercept('POST', '/api/chat', (req) => {
      const { messages } = req.body;
      if (messages.length === 1) {
        // First message
        req.reply({
          body: 'data: {"content":"Hello! I\'m here to help.","is_final":true}\n\n'
        });
      } else {
        // Follow-up message - should include context
        expect(messages.length).to.be.greaterThan(1);
        req.reply({
          body: 'data: {"content":"Based on our previous conversation...","is_final":true}\n\n'
        });
      }
    }).as('chatConversation');

    // Send first message
    cy.get('textarea[placeholder*="Ask a question"]').type('Hello');
    cy.get('button').contains('Send').click();
    cy.wait('@chatConversation');

    // Send follow-up message
    cy.get('textarea[placeholder*="Ask a question"]').type('Can you elaborate?');
    cy.get('button').contains('Send').click();
    cy.wait('@chatConversation');

    // Verify both messages and responses are visible
    cy.contains('Hello').should('be.visible');
    cy.contains('Hello! I\'m here to help.').should('be.visible');
    cy.contains('Can you elaborate?').should('be.visible');
    cy.contains('Based on our previous conversation...').should('be.visible');
  });

  it('should display sources when available', () => {
    // Mock response with sources
    cy.intercept('POST', '/api/chat', {
      body: `data: {"content":"Here's the answer","is_final":true,"sources":[{"filename":"test.pdf","chunk_index":1,"store_id":"store-123","similarity_score":0.95,"rerank_score":0.90,"content_preview":"Sample content","location":"page 1","source_name":"Test Document","custom_tags":[]}]}

`
    }).as('chatWithSources');

    // Send message
    cy.get('textarea[placeholder*="Ask a question"]').type('Question with sources');
    cy.get('button').contains('Send').click();
    cy.wait('@chatWithSources');

    // Verify sources toggle appears
    cy.contains('1 sources').should('be.visible');
    
    // Click to expand sources
    cy.contains('1 sources').click();
    
    // Verify source details
    cy.contains('test.pdf').should('be.visible');
    cy.contains('Sample content').should('be.visible');
  });
});

// Custom commands that could be added to cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Send a chat message and wait for response
       */
      sendChatMessage(message: string): Chainable<void>;
      
      /**
       * Mock streaming chat response
       */
      mockChatStream(chunks: string[]): Chainable<void>;
    }
  }
}

// Example implementation of custom commands
Cypress.Commands.add('sendChatMessage', (message: string) => {
  cy.get('textarea[placeholder*="Ask a question"]').clear().type(message);
  cy.get('button').contains('Send').click();
});

Cypress.Commands.add('mockChatStream', (chunks: string[]) => {
  const streamBody = chunks.map(chunk => `data: ${JSON.stringify(chunk)}`).join('\n\n') + '\n\n';
  cy.intercept('POST', '/api/chat', {
    headers: { 'content-type': 'text/event-stream' },
    body: streamBody
  });
});
