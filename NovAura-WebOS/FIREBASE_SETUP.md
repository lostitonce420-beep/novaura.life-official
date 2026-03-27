# Firebase Setup for NovAura Social Network

## What Should Have Been Configured

These Firebase services need to be enabled for the social network to function:

### 1. Firestore Database
**Purpose:** Store posts, messages, user profiles, friends

**Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/novaura-o-s-63232239-3ee79/firestore)
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select region: `us-central1` (or closest to your users)

### 2. Authentication
**Purpose:** User login/signup

**Setup:**
1. Go to [Authentication](https://console.firebase.google.com/project/novaura-o-s-63232239-3ee79/authentication)
2. Click "Get started"
3. Enable providers:
   - **Email/Password** → Enable
   - **Google** → Enable → Select support email

### 3. Cloud Messaging (FCM)
**Purpose:** Push notifications for messages, likes, follows

**Setup:**
1. Go to [Project Settings](https://console.firebase.google.com/project/novaura-o-s-63232239-3ee79/settings/general)
2. Click "Cloud Messaging" tab
3. Scroll to "Web Push certificates"
4. Click "Generate key pair"
5. Copy the **public key**
6. Add to `NovAura-WebOS/.env`:
   ```
   VITE_FCM_VAPID_KEY=your_public_key_here
   ```

## Quick Deployment

Run the deployment script:

```powershell
# First time setup
.\deploy-firebase.ps1 -InstallCLI -Login -SetupOnly

# After enabling services in console, deploy everything
.\deploy-firebase.ps1 -DeployAll
```

## Manual Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Set project
firebase use novaura-o-s-63232239-3ee79

# Deploy functions
cd functions
npm install
npm run build
firebase deploy --only functions

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Firestore Collections Structure

The social network uses these collections:

```
social_profiles/{userId}
  - displayName
  - avatar
  - bio
  - status
  - joinedAt
  - friendCount
  - postCount

social_posts/{postId}
  - authorId
  - authorName
  - authorAvatar
  - text
  - imageUrl
  - likes[]
  - likeCount
  - commentCount
  - createdAt

social_dm_threads/{threadId}
  - participants[]
  - lastMessage
  - lastAt
  - unread{}

social_dm_threads/{threadId}/messages/{messageId}
  - senderId
  - senderName
  - text
  - read
  - createdAt

social_friends/{userId}
  - connections[]

social_followers/{userId}
  - followers[]

user_fcm_tokens/{userId}/tokens/{token}
  - platform
  - createdAt
  - lastUsed
```

## Testing

After deployment:

1. **Open Community window** in NovAura WebOS
2. **Create a post** → Should appear in Firestore
3. **Send a DM** → Should trigger push notification
4. **Add a friend** → Both users should see the connection

## Troubleshooting

### "Firebase not configured" error
- Check `.env` file has all VITE_FIREBASE_* variables
- Restart dev server after changing .env

### Functions deployment fails
- Make sure you're on Blaze plan (not Spark)
- Check `firebase.json` exists
- Run `firebase use novaura-o-s-63232239-3ee79`

### Push notifications not working
- Verify VAPID key is in `.env`
- Check browser notification permissions
- Look at Functions logs in Firebase Console
