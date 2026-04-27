# Client Integration Examples

This guide shows how to integrate the real-time notification system into your frontend.

---

## Basic Socket.IO Connection (Vanilla JavaScript)

```javascript
// Initialize Socket.IO connection
const token = localStorage.getItem('authToken');
const socket = io('http://localhost:8000', {
  auth: {
    token: token
  }
});

// Connection status
socket.on('connect', () => {
  console.log('Connected to notification server');
  // Request unread notifications
  socket.emit('get-unread-notifications');
});

socket.on('disconnect', () => {
  console.log('Disconnected from notification server');
});

// Listen for real-time task events
socket.on('task:created-realtime', (data) => {
  console.log('New task created:', data);
  showNotification(data.title, 'Task Created', 'success');
});

socket.on('task:updated', (data) => {
  console.log('Task updated:', data);
  updateTaskInUI(data);
});

socket.on('task:deleted', (data) => {
  console.log('Task deleted:', data._id);
  removeTaskFromUI(data._id);
});

// Listen for scheduled notifications
socket.on('task:near-due', (data) => {
  console.log('Task due soon:', data);
  showNotification(
    `"${data.task.title}" is due in less than 24 hours`,
    'Task Due Soon',
    'warning'
  );
});

socket.on('task:overdue', (data) => {
  console.log('Task overdue:', data);
  showNotification(
    `"${data.task.title}" is now overdue`,
    'Task Overdue',
    'error'
  );
});

// Mark notification as read
socket.on('unread-notifications', (notifications) => {
  console.log('Unread notifications:', notifications);
  updateNotificationBadge(notifications.length);
});

// Mark notification as read
function markNotificationAsRead(notificationId) {
  socket.emit('mark-notification-read', notificationId);
}
```

---

## React Integration

### useNotifications Hook

```javascript
// hooks/useNotifications.js
import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

export const useNotifications = () => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get token from auth context or localStorage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.warn('No auth token available');
      return;
    }

    // Connect to Socket.IO
    const newSocket = io('http://localhost:8000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Real-time events
    newSocket.on('task:created-realtime', (data) => {
      addNotification(data, 'CREATED');
    });

    newSocket.on('task:updated', (data) => {
      addNotification(data, 'UPDATED');
    });

    newSocket.on('task:deleted', (data) => {
      addNotification(data, 'DELETED');
    });

    newSocket.on('task:near-due', (data) => {
      addNotification(data, 'NEAR_DUE');
    });

    newSocket.on('task:overdue', (data) => {
      addNotification(data, 'OVERDUE');
    });

    // Fetch unread notifications
    newSocket.on('unread-notifications', (unreadNotifications) => {
      setNotifications(unreadNotifications);
      setUnreadCount(unreadNotifications.filter(n => !n.isRead).length);
    });

    // Request unread on connect
    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('get-unread-notifications');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const addNotification = useCallback((data, type) => {
    const notification = {
      _id: data._id || Date.now(),
      type,
      message: data.message,
      task: data.task || data,
      isRead: false,
      createdAt: new Date(),
    };

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback((notificationId) => {
    if (socket) {
      socket.emit('mark-notification-read', notificationId);
    }
    
    setNotifications(prev =>
      prev.map(n =>
        n._id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [socket]);

  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.filter(n => n._id !== notificationId)
    );
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    socket,
  };
};
```

### Notification Badge Component

```javascript
// components/NotificationBadge.jsx
import { useNotifications } from '../hooks/useNotifications';

export function NotificationBadge() {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <div className="notification-badge">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
}
```

### Notification Center Component

```javascript
// components/NotificationCenter.jsx
import { useNotifications } from '../hooks/useNotifications';
import { useState } from 'react';

export function NotificationCenter() {
  const { notifications, markAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState('all'); // all, unread

  const displayNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CREATED':
        return '➕';
      case 'NEAR_DUE':
        return '⏰';
      case 'OVERDUE':
        return '⚠️';
      case 'UPDATED':
        return '✏️';
      case 'DELETED':
        return '🗑️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h2>Notifications</h2>
        <div className="filters">
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'active' : ''}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={filter === 'unread' ? 'active' : ''}
          >
            Unread
          </button>
        </div>
      </div>

      <div className="notification-list">
        {displayNotifications.length === 0 ? (
          <div className="empty-state">
            {filter === 'unread'
              ? 'No unread notifications'
              : 'No notifications yet'}
          </div>
        ) : (
          displayNotifications.map(notification => (
            <div
              key={notification._id}
              className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>

              <div className="notification-content">
                <p className="message">{notification.message}</p>
                {notification.task && (
                  <p className="task-title">
                    Task: {notification.task.title}
                  </p>
                )}
                <small className="timestamp">
                  {new Date(notification.createdAt).toLocaleString()}
                </small>
              </div>

              <div className="notification-actions">
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification._id)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

### Toast Notification Component

```javascript
// components/Toast.jsx
import { useState, useEffect } from 'react';

export function Toast({ message, type = 'info', duration = 5000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-message">{message}</span>
      <button onClick={() => setVisible(false)} className="toast-close">
        ✕
      </button>
    </div>
  );
}
```

### Toast Container with Real-Time Integration

```javascript
// components/ToastContainer.jsx
import { useState, useCallback } from 'react';
import Toast from './Toast';
import { useNotifications } from '../hooks/useNotifications';

export function ToastContainer() {
  const { notifications } = useNotifications();
  const [toasts, setToasts] = useState([]);

  // Show toast when new notifications arrive
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      const toastMessage = getToastMessage(latest);

      const toast = {
        id: latest._id,
        message: toastMessage.message,
        type: toastMessage.type,
      };

      setToasts(prev => [toast, ...prev].slice(0, 5)); // Keep max 5 toasts

      const timer = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const getToastMessage = (notification) => {
    const taskTitle = notification.task?.title || 'Task';
    
    switch (notification.type) {
      case 'CREATED':
        return {
          message: `✨ New task: "${taskTitle}"`,
          type: 'success',
        };
      case 'NEAR_DUE':
        return {
          message: `⏰ "${taskTitle}" is due in 24 hours`,
          type: 'warning',
        };
      case 'OVERDUE':
        return {
          message: `⚠️ "${taskTitle}" is overdue`,
          type: 'error',
        };
      case 'UPDATED':
        return {
          message: `✏️ "${taskTitle}" was updated`,
          type: 'info',
        };
      case 'DELETED':
        return {
          message: `🗑️ "${taskTitle}" was deleted`,
          type: 'info',
        };
      default:
        return {
          message: notification.message,
          type: 'info',
        };
    }
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={5000}
        />
      ))}
    </div>
  );
}
```

### CSS Styling

```css
/* Toast Styling */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

.toast-success {
  background-color: #10b981;
  color: white;
}

.toast-warning {
  background-color: #f59e0b;
  color: white;
}

.toast-error {
  background-color: #ef4444;
  color: white;
}

.toast-info {
  background-color: #3b82f6;
  color: white;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 18px;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Notification Center */
.notification-center {
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.notification-list {
  max-height: 600px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-message {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #1f2937;
}

.task-title {
  margin: 4px 0;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.timestamp {
  font-size: 12px;
  color: #9ca3af;
}

.notification-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.notification-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.notification-actions button:hover {
  background-color: #e5e7eb;
}
```

---

## Next.js / React Server Components Integration

```javascript
// app/layout.jsx
import { NotificationProvider } from '@/providers/NotificationProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
```

```javascript
// providers/NotificationProvider.jsx
'use client';

import { createContext, useContext } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const notifications = useNotifications();

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};
```

---

## Vue Integration

```vue
<!-- components/NotificationCenter.vue -->
<template>
  <div class="notification-center">
    <h2>Notifications ({{ unreadCount }} unread)</h2>
    
    <div v-if="notifications.length === 0" class="empty">
      No notifications yet
    </div>
    
    <div v-else class="notification-list">
      <div
        v-for="notification in notifications"
        :key="notification._id"
        class="notification-item"
        :class="{ unread: !notification.isRead }"
      >
        <span class="icon">{{ getIcon(notification.type) }}</span>
        <div class="content">
          <p>{{ notification.message }}</p>
          <small>{{ formatDate(notification.createdAt) }}</small>
        </div>
        <button @click="markAsRead(notification._id)">Mark as read</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import io from 'socket.io-client';

const socket = ref(null);
const notifications = ref([]);
const unreadCount = ref(0);

onMounted(() => {
  const token = localStorage.getItem('authToken');
  
  socket.value = io('http://localhost:8000', {
    auth: { token }
  });

  socket.value.on('task:created-realtime', (data) => {
    notifications.value.unshift({
      _id: data._id,
      type: 'CREATED',
      message: data.message,
      task: data.task,
      isRead: false,
      createdAt: new Date(),
    });
    unreadCount.value++;
  });

  socket.value.on('unread-notifications', (unread) => {
    notifications.value = unread;
    unreadCount.value = unread.filter(n => !n.isRead).length;
  });

  socket.value.emit('get-unread-notifications');
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});

const markAsRead = (notificationId) => {
  socket.value.emit('mark-notification-read', notificationId);
  const notification = notifications.value.find(n => n._id === notificationId);
  if (notification) {
    notification.isRead = true;
    unreadCount.value--;
  }
};

const getIcon = (type) => {
  const icons = {
    'CREATED': '➕',
    'NEAR_DUE': '⏰',
    'OVERDUE': '⚠️',
    'UPDATED': '✏️',
    'DELETED': '🗑️',
  };
  return icons[type] || 'ℹ️';
};

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};
</script>
```

---

## Svelte Integration

```svelte
<!-- components/NotificationCenter.svelte -->
<script>
  import { onMount } from 'svelte';
  import io from 'socket.io-client';

  let socket;
  let notifications = [];
  let unreadCount = 0;

  onMount(() => {
    const token = localStorage.getItem('authToken');
    
    socket = io('http://localhost:8000', {
      auth: { token }
    });

    socket.on('task:created-realtime', (data) => {
      notifications = [
        {
          _id: data._id,
          type: 'CREATED',
          message: data.message,
          task: data.task,
          isRead: false,
          createdAt: new Date(),
        },
        ...notifications,
      ];
      unreadCount++;
    });

    socket.on('unread-notifications', (unread) => {
      notifications = unread;
      unreadCount = unread.filter(n => !n.isRead).length;
    });

    socket.emit('get-unread-notifications');

    return () => {
      socket?.disconnect();
    };
  });

  const markAsRead = (notificationId) => {
    socket.emit('mark-notification-read', notificationId);
    notifications = notifications.map(n =>
      n._id === notificationId ? { ...n, isRead: true } : n
    );
    unreadCount = Math.max(0, unreadCount - 1);
  };

  const getIcon = (type) => {
    const icons = {
      CREATED: '➕',
      NEAR_DUE: '⏰',
      OVERDUE: '⚠️',
      UPDATED: '✏️',
      DELETED: '🗑️',
    };
    return icons[type] || 'ℹ️';
  };
</script>

<div class="notification-center">
  <h2>Notifications ({unreadCount} unread)</h2>
  
  {#if notifications.length === 0}
    <div class="empty">No notifications yet</div>
  {:else}
    <div class="notification-list">
      {#each notifications as notification (notification._id)}
        <div class="notification-item" class:unread={!notification.isRead}>
          <span class="icon">{getIcon(notification.type)}</span>
          <div class="content">
            <p>{notification.message}</p>
            <small>{new Date(notification.createdAt).toLocaleString()}</small>
          </div>
          {#if !notification.isRead}
            <button on:click={() => markAsRead(notification._id)}>
              Mark as read
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Same CSS as React version */
</style>
```

---

## Testing Your Integration

```javascript
// test.js - Simple test script
async function testNotifications() {
  console.log('Testing WebSocket notifications...');

  // 1. Test connection
  const socket = io('http://localhost:8000', {
    auth: {
      token: 'your_jwt_token'
    }
  });

  socket.on('connect', () => {
    console.log('✓ Connected');
    
    // 2. Request unread
    socket.emit('get-unread-notifications');
  });

  // 3. Listen for events
  socket.on('unread-notifications', (data) => {
    console.log('✓ Received unread:', data.length);
  });

  socket.on('task:created-realtime', (data) => {
    console.log('✓ Real-time event received:', data);
  });

  // 4. Test marking as read
  setTimeout(() => {
    const testNotifId = 'some_notification_id';
    socket.emit('mark-notification-read', testNotifId);
    console.log('✓ Marked as read');
  }, 2000);
}

testNotifications();
```

---

## Summary

You now have complete examples for integrating the WebSocket notification system into:
- Vanilla JavaScript/HTML
- React with hooks
- Next.js with Server Components
- Vue 3
- Svelte

Start with the React example if you're building a modern SPA, or the vanilla JavaScript example if you need something lightweight and framework-agnostic.
