# Quick Start: WebSocket Real-Time Notifications

## What You've Built

A production-ready real-time notification system with:
- **Socket.IO** for WebSocket communication
- **node-cron** for scheduled task checks
- **MongoDB** for persistent notifications
- **JWT** authentication for secure connections
- **REST API** for notification management

## Getting Started

### 1. Start Your Server

```bash
npm start
# Server runs on http://localhost:8000
```

The following happens on startup:
- Socket.IO server initializes with JWT auth middleware
- Task notification scheduler starts (checks every minute)
- All existing routes continue working

### 2. Connect a Client

```javascript
const socket = io('http://localhost:8000', {
  auth: {
    token: yourJWTToken  // Your authentication token
  }
});

// Listen for notifications
socket.on('task:created-realtime', (data) => {
  console.log('Task created:', data);
});

socket.on('task:near-due', (data) => {
  console.log('Task due soon:', data);
});

socket.on('task:overdue', (data) => {
  console.log('Task overdue:', data);
});
```

### 3. Create a Task

```bash
POST /api/v1/tasks/create
Content-Type: application/json
Authorization: Bearer yourJWTToken

{
  "title": "Build UI",
  "description": "Create React components",
  "priority": "high",
  "dueDate": "2026-05-15",
  "status": "pending"
}
```

**What happens:**
1. Task is saved to MongoDB
2. Notification is created immediately
3. Connected clients get real-time `task:created-realtime` event
4. Scheduler watches for near-due and overdue notifications

---

## Notification Types

### 1. Task Created (Real-Time)
Sent immediately when task is created via API.

```javascript
socket.on('task:created-realtime', (data) => {
  // {
  //   _id: "...",
  //   title: "Build UI",
  //   dueDate: "2026-05-15",
  //   priority: "high",
  //   message: "Task 'Build UI' has been created"
  // }
});
```

### 2. Task Near Due (Scheduled)
Sent when task is within 24 hours of due date. Checks every minute.

```javascript
socket.on('task:near-due', (data) => {
  // {
  //   _id: "...",
  //   taskId: "...",
  //   type: "NEAR_DUE",
  //   message: "Task 'Build UI' is due in less than 24 hours",
  //   task: { title, dueDate, priority, status }
  // }
});
```

### 3. Task Overdue (Scheduled)
Sent when task passes its due date. Checks every minute.

```javascript
socket.on('task:overdue', (data) => {
  // {
  //   _id: "...",
  //   taskId: "...",
  //   type: "OVERDUE",
  //   message: "Task 'Build UI' is 2 day(s) overdue",
  //   task: { title, dueDate, priority, status }
  // }
});
```

---

## Manage Notifications

### Mark as Read (WebSocket)
```javascript
socket.emit('mark-notification-read', notificationId);
```

### Get Unread (WebSocket)
```javascript
socket.emit('get-unread-notifications');

socket.on('unread-notifications', (notifications) => {
  console.log('Unread:', notifications);
});
```

### REST API Endpoints

Get all notifications:
```bash
GET /api/v1/notifications?page=1&limit=20
Authorization: Bearer token
```

Get unread only:
```bash
GET /api/v1/notifications/unread
Authorization: Bearer token
```

Mark as read:
```bash
PATCH /api/v1/notifications/:notificationId/read
Authorization: Bearer token
```

Mark all as read:
```bash
PATCH /api/v1/notifications/read/all
Authorization: Bearer token
```

Delete notification:
```bash
DELETE /api/v1/notifications/:notificationId
Authorization: Bearer token
```

---

## File Overview

| File | Purpose |
|------|---------|
| `src/socket/index.js` | Socket.IO server with JWT auth |
| `src/models/notifications.js` | MongoDB notification schema |
| `src/services/notificationService.js` | Notification logic (create, broadcast, fetch) |
| `src/services/taskNotificationScheduler.js` | Cron jobs for scheduled checks |
| `src/controllers/tasks.controller.js` | Updated to emit WebSocket events |
| `src/controllers/notifications.controller.js` | REST API for notifications |
| `src/routes/notifications.routes.js` | Notification endpoints |
| `index.js` | Entry point with Socket.IO init |

---

## Architecture

```
Client connects → Socket.IO middleware verifies JWT → User room created
                                      ↓
                     (Real-Time Path)  │  (Scheduled Path)
                           ↓           │           ↓
                  Task created event  │   Check every minute
                           ↓           │           ↓
                  Broadcast to room   │   Find near-due/overdue
                           ↓           │           ↓
                 Save to DB + emit    │  Save to DB + emit
                           ↓           │           ↓
                    Client receives ← ← ← Client receives
```

---

## Debug Mode

Enable logging in your client:

```javascript
// Browser console
localStorage.debug = 'socket.io-client:*';
```

Check server logs for `[v0]` prefix:
```bash
# Server will log:
# [v0] User <userId> connected with socket ID: <socketId>
# [v0] Checking near-due tasks: found X tasks
# [v0] Notification broadcasted to user:<userId>: task:near-due
```

---

## Common Tasks

### Display notification count badge
```javascript
let unreadCount = 0;

socket.on('task:created-realtime', () => unreadCount++);
socket.on('task:near-due', () => unreadCount++);
socket.on('task:overdue', () => unreadCount++);

socket.on('notification-marked-read', () => unreadCount--);
```

### Handle offline users
```javascript
// Fetch unread when reconnecting
socket.on('connect', () => {
  socket.emit('get-unread-notifications');
});

socket.on('unread-notifications', (notifications) => {
  // Show missed notifications
});
```

### Update UI in real-time
```javascript
socket.on('task:created-realtime', (newTask) => {
  taskList.push(newTask);
  updateUI();
  showToast(`New task: ${newTask.title}`, 'success');
});

socket.on('task:updated', (updatedTask) => {
  const index = taskList.findIndex(t => t._id === updatedTask._id);
  taskList[index] = updatedTask;
  updateUI();
});

socket.on('task:deleted', ({_id}) => {
  taskList = taskList.filter(t => t._id !== _id);
  updateUI();
});
```

---

## Production Checklist

- [ ] Set `CLIENT_URL` env var for CORS
- [ ] Update `JWT_SECRET` in environment
- [ ] Test with real MongoDB instance
- [ ] Configure firewall for WebSocket port
- [ ] Add error handling for failed notifications
- [ ] Implement notification UI components
- [ ] Test offline/reconnection behavior
- [ ] Monitor cron job performance
- [ ] Add notification persistence preferences
- [ ] Consider Redis adapter for multi-server setup

---

## Next Steps

1. **Frontend**: Build notification UI components
2. **Testing**: Test WebSocket with real tasks
3. **Monitoring**: Set up logging and error tracking
4. **Scaling**: Add Redis adapter if needed
5. **Features**: Add notification preferences, sounds, browser alerts

---

For detailed documentation, see `WEBSOCKET_NOTIFICATIONS_GUIDE.md`
