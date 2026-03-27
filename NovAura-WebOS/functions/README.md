# novaura systems - Firebase Cloud Functions

Firebase Admin SDK backend for novaura systems.

## Features

- **Push Notifications (FCM)**: Real-time notifications for messages, likes, follows
- **Social Triggers**: Automated actions on post/comment/message creation
- **User Management**: Profile creation on signup, cleanup on delete
- **Aggregation**: Count updates for posts, comments, followers

## Functions

### HTTP Callable Functions

| Function | Description |
|----------|-------------|
| `sendPushNotification` | Send FCM notification to specific user |
| `registerFCMToken` | Register device token for push notifications |
| `unregisterFCMToken` | Remove device token |

### Firestore Triggers

| Trigger | Description |
|---------|-------------|
| `onDirectMessageCreated` | Notify recipient of new DM |
| `onPostCreated` | Notify followers of new post |
| `onFollowerAdded` | Notify user of new follower |
| `onPostLiked` | Notify author of post like |
| `onCommentCreated/Deleted` | Update comment count |
| `onUserPostCreated/Deleted` | Update user post count |

### Auth Triggers

| Trigger | Description |
|---------|-------------|
| `onUserCreated` | Create social profile on signup |
| `onUserDeleted` | Cleanup user data on delete |

## Deployment

### Prerequisites

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Set project:
```bash
firebase use novaura-systems
```

### Deploy Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Everything

```bash
firebase deploy
```

## Local Development

### Start Emulators

```bash
firebase emulators:start
```

This starts:
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- UI: http://localhost:4000

### Test Locally

```bash
# In one terminal
npm run serve

# In another terminal
cd ../
npm run dev
```

## Environment Variables

Set in Firebase Console → Functions → Environment variables:

```
# Optional: For additional configuration
FIREBASE_CONFIG={...}
GCLOUD_PROJECT=novaura-systems
```

## Security

- All functions require authentication
- Firestore rules enforce data ownership
- FCM tokens are user-scoped

## Monitoring

View logs in Firebase Console:
```bash
firebase functions:log
```
