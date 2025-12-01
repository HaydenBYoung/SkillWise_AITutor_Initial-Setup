const emailService = require('../../src/services/emailService');

describe('emailService', () => {
  let mockSendMail;

  beforeEach(() => {
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'mock-id' });
    const mockTransporter = { sendMail: mockSendMail };
    emailService.setTransporter(mockTransporter);
  });

  afterEach(() => {
    emailService.resetTransporter();
    jest.clearAllMocks();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const result = await emailService.sendWelcomeEmail('test@example.com', 'Alice');
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('test@example.com');
      expect(call.subject).toContain('Welcome');
      expect(call.html).toContain('Alice');
      expect(result.messageId).toBe('mock-id');
    });

    it('should throw error if email is missing', async () => {
      await expect(emailService.sendWelcomeEmail(null, 'Bob')).rejects.toThrow('User email required');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with token link', async () => {
      const result = await emailService.sendPasswordResetEmail('user@test.com', 'abcd1234');
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('user@test.com');
      expect(call.subject).toContain('Password Reset');
      expect(call.html).toContain('abcd1234');
      expect(result.messageId).toBe('mock-id');
    });

    it('should throw error if token is missing', async () => {
      await expect(emailService.sendPasswordResetEmail('user@test.com', null)).rejects.toThrow('Email and reset token required');
    });
  });

  describe('sendProgressUpdate', () => {
    it('should send progress update email', async () => {
      const progressData = { totalPoints: 500, level: 3, completedChallenges: 12 };
      const result = await emailService.sendProgressUpdate('learner@test.com', progressData);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('learner@test.com');
      expect(call.html).toContain('500');
      expect(call.html).toContain('3');
      expect(call.html).toContain('12');
      expect(result.messageId).toBe('mock-id');
    });

    it('should throw error if email is missing', async () => {
      await expect(emailService.sendProgressUpdate(null, {})).rejects.toThrow('User email required');
    });
  });

  describe('sendAchievementNotification', () => {
    it('should send achievement notification email', async () => {
      const achievement = { title: 'First Challenge', description: 'Completed first challenge!', points: 100 };
      const result = await emailService.sendAchievementNotification('winner@test.com', achievement);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('winner@test.com');
      expect(call.subject).toContain('First Challenge');
      expect(call.html).toContain('First Challenge');
      expect(call.html).toContain('100');
      expect(result.messageId).toBe('mock-id');
    });

    it('should throw error if email is missing', async () => {
      await expect(emailService.sendAchievementNotification(null, {})).rejects.toThrow('User email required');
    });
  });
});
