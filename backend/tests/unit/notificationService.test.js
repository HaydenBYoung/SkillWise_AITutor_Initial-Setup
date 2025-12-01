describe('notificationService', () => {
  let notificationService;
  beforeEach(() => {
    jest.resetModules();
    notificationService = require('../../src/services/notificationService');
  });

  afterEach(() => jest.restoreAllMocks());

  test('sendNotification creates and returns notification', async () => {
    const fakeCreate = jest.spyOn(require('../../src/models/Notification'), 'create').mockResolvedValue({ id: 1, user_id: 1, type: 'info', message: 'Hi', data: {}, is_read: false });
    const created = await notificationService.sendNotification(1, 'info', 'Hi', {});
    expect(created).toBeDefined();
    expect(created.id).toBe(1);
    expect(fakeCreate).toHaveBeenCalled();
  });

  test('getUserNotifications returns mapped notifications', async () => {
    const fakeRows = [{ id: 2, user_id: 1, type: 'info', message: 'Test', data: {}, is_read: false, created_at: new Date().toISOString() }];
    jest.spyOn(require('../../src/models/Notification'), 'findByUserId').mockResolvedValue(fakeRows);
    const rows = await notificationService.getUserNotifications(1, { limit: 10 });
    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0].id).toBe(2);
  });

  test('markAsRead updates notifications', async () => {
    jest.spyOn(require('../../src/models/Notification'), 'markAsRead').mockResolvedValue({ id: 3, is_read: true });
    const res = await notificationService.markAsRead(3);
    expect(res.id).toBe(3);
    expect(res.is_read).toBe(true);
  });

  test('sendBulkNotifications creates multiple notifications', async () => {
    const createSpy = jest.spyOn(require('../../src/models/Notification'), 'create').mockImplementation(async (d) => ({ id: Math.floor(Math.random() * 1000), ...d }));
    const users = [1, 2, 3];
    const created = await notificationService.sendBulkNotifications(users, { type: 'info', message: 'bulk' });
    expect(created.length).toBeGreaterThanOrEqual(3);
    expect(createSpy).toHaveBeenCalled();
  });
});
