import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const Notifications = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const rows = await apiService.notifications.getAll();
      // Ensure rows is always an array
      setNotifications(Array.isArray(rows) ? rows : []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch notifications', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
    // Close on outside click
    function handleClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [user]);

  const unreadCount = (notifications || []).filter((n) => !n.isRead).length;

  const handleToggle = async () => {
    setOpen(!open);
    if (!open) {
      await fetchNotifications();
    }
  };

  const dismiss = async (id) => {
    try {
      await apiService.notifications.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark as read', err);
    }
  };

  const markAll = async () => {
    try {
      await apiService.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        className="notif-btn"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={open}
      >
        🔔{unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      {open &&
        createPortal(
          <div className="notif-popup-overlay">
            <div
              className="notif-dropdown"
              ref={dropdownRef}
              style={{
                position: 'fixed',
                top: buttonRef.current
                  ? `${buttonRef.current.getBoundingClientRect().bottom + 8}px`
                  : '60px',
                left: buttonRef.current
                  ? `${buttonRef.current.getBoundingClientRect().left}px`
                  : '20px',
              }}
            >
              <div className="notif-header">
                <strong>Notifications</strong>
                <button className="btn-link" onClick={markAll}>
                  Mark all as read
                </button>
              </div>
              <div className="notif-body">
                {loading && <div>Loading...</div>}
                {!loading && notifications.length === 0 && <div>No notifications</div>}
                {!loading &&
                  notifications.map((n) => (
                    <div className={`notif-item ${n.isRead ? 'read' : 'unread'}`} key={n.id}>
                      <div className="notif-message">{n.message}</div>
                      <div className="notif-meta">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                      <div className="notif-actions">
                        {!n.isRead && (
                          <button className="btn-link" onClick={() => dismiss(n.id)}>
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Notifications;
