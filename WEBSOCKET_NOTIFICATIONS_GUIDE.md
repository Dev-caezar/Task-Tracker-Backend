# Real-Time Task Tracking with WebSocket Notifications

This guide explains how the real-time WebSocket notification system works in your Task Tracker Backend.

## Architecture Overview

The system uses **Socket.IO** for WebSocket communication and **node-cron** for background jobs to deliver three types of notifications:

1. **Task Created** - Real-time event when a task is created
2. **Near Due** - Scheduled notification when a task is within 24 hours of due date
3. **Overdue** - Scheduled notification when a task passes its due date

All notifications are persisted in MongoDB for offline retrieval and read/unread tracking.

---

## System Components

### 1. Socket.IO Server (`src/socket/index.js`)

Handles WebSocket connections with JWT authentication and user-scoped rooms.

**Key Features:**
- JWT token validation on connection
- User-specific rooms (`user:${userId}`)
- Auto-disconnect handling
- Mark notification as read
- Fetch unread notifications

**Socket Events:**
```javascript
// Client → Server
socket.emit('mark-notification-read', notificationId)
socket.emit('get-unread-notifications')

// Server → Client
socket.emit('task:created-realtime', taskData)
socket.emit('task:updated', taskData)
socket.emit('task:deleted', {_id, message})
socket.emit('task:near-due', notificationData)
socket.emit('task:overdue', notificationData)
```

### 2. Notifications Model (`src/models/notifications.js`)

MongoDB schema for storing notifications with:
- User reference
- Task reference
- Notification type (CREATED, NEAR_DUE, OVERDUE)
- Message content
- Read/unread status
- Task snapshot data

### 3. Notification Service (`src/services/notificationService.js`)

Core service with methods for:
- Creating notifications in database
- Broadcasting notifications via Socket.IO
- Fetching user notifications with pagination
- Marking notifications as read
- Deleting notifications

### 4. Task Notification Scheduler (`src/services/taskNotificationScheduler.js`)

Background job runner using node-cron that:
- Runs every minute to check task deadlines
- Detects near-due tasks (within 24 hours)
- Detects overdue tasks (past due date)
- Prevents duplicate notifications
- Broadcasts to user-specific rooms

### 5. Task Controller Updates (`src/controllers/tasks.controller.js`)

Enhanced with WebSocket events:
- **createTask()** - Emits `task:created-realtime` event and saves notification
- **updateTask()** - Emits `task:updated` event in real-time
- **deleteTask()** - Emits `task:deleted` event in real-time

### 6. Notification Routes (`src/routes/notifications.routes.js`)

REST API endpoints for notification management:
- `GET /api/v1/notifications` - Get all notifications (paginated)
- `GET /api/v1/notifications/unread` - Get unread notifications
- `PATCH /api/v1/notifications/:notificationId/read` - Mark as read
- `PATCH /api/v1/notifications/read/all` - Mark all as read
- `DELETE /api/v1/notifications/:notificationId` - Delete notification
- `DELETE /api/v1/notifications/delete/all` - Delete all notifications

---

## Client-Side Integration

### Basic Setup

```javascript
import io from 'socket.io-client';

const token = localStorage.getItem('authToken'); // Your JWT token

const socket = io('http://localhost:8000', {
  auth: {
    token: token
  }
});

// Listen for real-time task events
socket.on('task:created-realtime', (data) => {
  console.log('Task created:', data);
  // Update UI, show notification toast
});

socket.on('task:updated', (data) => {
  console.log('Task updated:', data);
  // Refresh task list or update specific task
});

socket.on('task:deleted', (data) => {
  console.log('Task deleted:', data);
  // Remove task from UI
});

socket.on('task:near-due', (data) => {
  console.log('Task due soon:', data);
  // Show warning notification
});

socket.on('task:overdue', (data) => {
  console.log('Task overdue:', data);
  // Show error notification
});

// Mark notification as read
socket.emit('mark-notification-read', notificationId);

// Get unread notifications on connect
socket.on('connect', () => {
  socket.emit('get-unread-notifications');
});

socket.on('unread-notifications', (notifications) => {
  console.log('Unread:', notifications);
  // Update notification badge
});
```

### React Example (with useEffect)

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const newSocket = io('http://localhost:8000', {
      auth: { token }
    });

    newSocket.on('task:created-realtime', (data) => {
      setNotifications(prev => [data, ...prev]);
      showToast(`Task "${data.title}" created!`, 'success');
    });

    newSocket.on('task:near-due', (data) => {
      setNotifications(prev => [data, ...prev]);
      showToast(`Task "${data.task.title}" due soon!`, 'warning');
    });

    newSocket.on('task:overdue', (data) => {
      setNotifications(prev => [data, ...prev]);
      showToast(`Task "${data.task.title}" is overdue!`, 'error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const markAsRead = (notificationId) => {
    socket?.emit('mark-notification-read', notificationId);
  };

  return (
    <div className="notifications">
      {notifications.map(notif => (
        <div key={notif._id} className={notif.isRead ? 'read' : 'unread'}>
          <p>{notif.message}</p>
          <button onClick={() => markAsRead(notif._id)}>Mark as read</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Event Flow Diagrams

### Real-Time Event (Task Creation)

```
Client POST /tasks
    ↓
Task Controller (createTask)
    ↓
✓ Task saved to MongoDB
✓ Notification created & saved
    ↓
emit 'task:created-realtime' → Socket.IO
    ↓
Broadcast to user:${userId} room
    ↓
Connected clients receive event
    ↓
Update UI in real-time
```

### Scheduled Event (Near-Due Detection)

```
Cron Job (every minute)
    ↓
Check near-due tasks
    ↓
For each task within 24 hours:
  ✓ Check if notification already exists
  ✓ Create notification in DB
    ↓
emit 'task:near-due' → Socket.IO
    ↓
Broadcast to user:${userId} room
    ↓
Connected clients receive warning
    ↓
Offline users can fetch via REST API
```

---

## Environment Variables

Ensure these are set in your `.env` file:

```
PORT=8000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000  # For Socket.IO CORS
```

---

## Testing WebSocket Connections

### Using Socket.IO Client Example

```bash
# Install socket.io-client globally if needed
npm install -g socket.io-client

# Test connection with curl + socket.io-client
```

### Using Browser DevTools

```javascript
// Open browser console and test:
const token = 'your_jwt_token';
const socket = io('http://localhost:8000', {
  auth: { token }
});

socket.on('connect', () => console.log('Connected!'));
socket.on('disconnect', () => console.log('Disconnected!'));

// Listen for all events
socket.onAny((event, ...args) => {
  console.log(event, args);
});
```

---

## Notification Types

### CREATED
Emitted immediately when a task is created.
- **Trigger**: Task creation
- **Delay**: None (real-time)
- **Recipient**: Task owner

### NEAR_DUE
Emitted when a task is within 24 hours of due date.
- **Trigger**: Scheduled check (every minute)
- **Delay**: Up to 1 minute
- **Recipient**: Task owner
- **Deduplication**: Only one notification per task

### OVERDUE
Emitted when a task passes its due date.
- **Trigger**: Scheduled check (every minute)
- **Delay**: Up to 1 minute
- **Recipient**: Task owner
- **Deduplication**: Only one notification per task

---

## Troubleshooting

### Connection Issues

**Problem**: "Authentication error"
- Check JWT token is being sent in `auth` parameter
- Verify JWT_SECRET matches in env

**Problem**: No events received
- Check Socket.IO server is running on correct port
- Verify CORS settings in `src/socket/index.js`
- Check browser console for connection errors

### Notification Not Triggering

**Problem**: Scheduled notifications not firing
- Check scheduler is initialized in `index.js`
- Verify cron syntax: `* * * * *` (every minute)
- Check MongoDB for task data (dueDate must be set)
- Check logs: `[v0] Checking near-due tasks...`

**Problem**: Duplicate notifications
- Database query checks for existing notifications before creating
- Clear old test notifications from DB if needed

---

## Performance Optimization

### For Large Task Lists
- Add database indexes on `userId` and `taskId` (already included in schema)
- Consider pagination for notification endpoints
- Implement notification archival for old items

### For Multiple Servers
- Implement Socket.IO Redis adapter for server-to-server communication
- Ensure MongoDB is accessible from all servers

### Cron Job Optimization
- Monitor scheduler logs for long-running checks
- Adjust frequency if needed (currently every minute)
- Consider batch operations for many affected users

---

## Graceful Shutdown

The application handles shutdown properly:

```javascript
// In index.js during shutdown:
stopTaskScheduler(); // Stops cron jobs
socket.disconnect(); // Disconnects WebSocket
```

---

## Next Steps

1. Deploy to production with proper MongoDB and environment configuration
2. Implement notification UI components on frontend
3. Add sound/browser notifications for important alerts
4. Consider Redis adapter for multi-server deployments
5. Monitor Socket.IO connections and performance
6. Add notification preferences/settings per user

---

## File Structure

```
src/
├── models/
│   └── notifications.js          # Notification schema
├── services/
│   ├── notificationService.js    # Core notification logic
│   └── taskNotificationScheduler.js # Cron jobs
├── socket/
│   ├── index.js                  # Socket.IO initialization
│   └── handlers.js               # Socket event handlers
├── controllers/
│   ├── tasks.controller.js       # Updated with WebSocket
│   └── notifications.controller.js # Notification REST API
├── routes/
│   └── notifications.routes.js   # Notification endpoints
└── app.js                        # Updated with notification routes

index.js                          # Updated with Socket.IO & scheduler
```

---

## Support & Debugging

Enable debug logging in your frontend:

```javascript
// Set localStorage to enable socket.io debug
localStorage.debug = 'socket.io-client:socket';

// Or in Node.js:
process.env.DEBUG = 'socket.io:*';
```

Check server logs:

```bash
# Look for [v0] prefixed logs
tail -f output.log | grep "\[v0\]"
```

---

Happy real-time task tracking!
