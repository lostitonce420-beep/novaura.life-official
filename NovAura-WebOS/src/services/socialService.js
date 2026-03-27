/**
 * NovAura Social Network Service
 *
 * Firestore-backed social network: profiles, posts/feed, live chat rooms,
 * direct messages, friends/connections, presence.
 * Gracefully degrades to localStorage when Firebase is unavailable.
 */

import { db, auth, isFirebaseConfigured } from '../config/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  addDoc, query, where, orderBy, limit, onSnapshot,
  serverTimestamp, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';

// ── Helpers ────────────────────────────────────────────────────
const COLLECTIONS = {
  profiles:  'social_profiles',
  posts:     'social_posts',
  chatRooms: 'social_chat_rooms',
  dms:       'social_dm_threads',
  friends:   'social_friends',
};

function currentUserId() {
  if (auth?.currentUser) return auth.currentUser.uid;
  const stored = localStorage.getItem('user_data');
  if (stored) {
    try { return JSON.parse(stored).id || JSON.parse(stored).uid || 'local-user'; } catch { /* */ }
  }
  return 'local-user';
}

function currentUserName() {
  if (auth?.currentUser) return auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User';
  const stored = localStorage.getItem('user_data');
  if (stored) {
    try { return JSON.parse(stored).name || JSON.parse(stored).username || 'User'; } catch { /* */ }
  }
  return 'User';
}

function currentUserAvatar() {
  if (auth?.currentUser) return auth.currentUser.photoURL || '';
  return '';
}

// ── Local fallback store (when Firestore is unavailable) ──────
function localGet(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(`novaura_social_${key}`)) || fallback; } catch { return fallback; }
}
function localSet(key, data) {
  localStorage.setItem(`novaura_social_${key}`, JSON.stringify(data));
}

// ══════════════════════════════════════════════════════════════
// PROFILES
// ══════════════════════════════════════════════════════════════

export async function getProfile(userId) {
  if (!isFirebaseConfigured) {
    const profiles = localGet('profiles', {});
    return profiles[userId || currentUserId()] || createDefaultProfile(userId);
  }
  const uid = userId || currentUserId();
  const snap = await getDoc(doc(db, COLLECTIONS.profiles, uid));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  // Auto-create profile on first access
  const profile = createDefaultProfile(uid);
  await setDoc(doc(db, COLLECTIONS.profiles, uid), profile);
  return profile;
}

function createDefaultProfile(uid) {
  return {
    id: uid || currentUserId(),
    displayName: currentUserName(),
    avatar: currentUserAvatar(),
    bio: '',
    status: 'online',
    joinedAt: Date.now(),
    friendCount: 0,
    postCount: 0,
  };
}

export async function updateProfile(updates) {
  const uid = currentUserId();
  if (!isFirebaseConfigured) {
    const profiles = localGet('profiles', {});
    profiles[uid] = { ...(profiles[uid] || createDefaultProfile(uid)), ...updates };
    localSet('profiles', profiles);
    return profiles[uid];
  }
  await updateDoc(doc(db, COLLECTIONS.profiles, uid), { ...updates, updatedAt: serverTimestamp() });
  return getProfile(uid);
}

// ══════════════════════════════════════════════════════════════
// POSTS / FEED
// ══════════════════════════════════════════════════════════════

export async function createPost({ text, imageUrl = '', tags = [] }) {
  const post = {
    authorId: currentUserId(),
    authorName: currentUserName(),
    authorAvatar: currentUserAvatar(),
    text,
    imageUrl,
    tags,
    likes: [],
    likeCount: 0,
    commentCount: 0,
    createdAt: Date.now(),
  };

  if (!isFirebaseConfigured) {
    const posts = localGet('posts', []);
    post.id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    posts.unshift(post);
    localSet('posts', posts);
    return post;
  }

  const ref = await addDoc(collection(db, COLLECTIONS.posts), {
    ...post,
    createdAt: serverTimestamp(),
  });
  return { ...post, id: ref.id };
}

export async function getFeed(maxPosts = 50) {
  if (!isFirebaseConfigured) {
    return localGet('posts', []).slice(0, maxPosts);
  }
  const q = query(
    collection(db, COLLECTIONS.posts),
    orderBy('createdAt', 'desc'),
    limit(maxPosts)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function onFeedUpdate(callback) {
  if (!isFirebaseConfigured) return () => {};
  const q = query(
    collection(db, COLLECTIONS.posts),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function likePost(postId) {
  const uid = currentUserId();
  if (!isFirebaseConfigured) {
    const posts = localGet('posts', []);
    const post = posts.find(p => p.id === postId);
    if (post) {
      if (post.likes.includes(uid)) {
        post.likes = post.likes.filter(id => id !== uid);
        post.likeCount = Math.max(0, post.likeCount - 1);
      } else {
        post.likes.push(uid);
        post.likeCount = (post.likeCount || 0) + 1;
      }
      localSet('posts', posts);
    }
    return post;
  }
  const ref = doc(db, COLLECTIONS.posts, postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const alreadyLiked = (data.likes || []).includes(uid);
  await updateDoc(ref, {
    likes: alreadyLiked ? arrayRemove(uid) : arrayUnion(uid),
    likeCount: increment(alreadyLiked ? -1 : 1),
  });
}

export async function addComment(postId, text) {
  const comment = {
    authorId: currentUserId(),
    authorName: currentUserName(),
    text,
    createdAt: Date.now(),
  };
  if (!isFirebaseConfigured) {
    const posts = localGet('posts', []);
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.comments = post.comments || [];
      comment.id = `cmt-${Date.now()}`;
      post.comments.push(comment);
      post.commentCount = post.comments.length;
      localSet('posts', posts);
    }
    return comment;
  }
  const commentRef = await addDoc(
    collection(db, COLLECTIONS.posts, postId, 'comments'),
    { ...comment, createdAt: serverTimestamp() }
  );
  await updateDoc(doc(db, COLLECTIONS.posts, postId), { commentCount: increment(1) });
  return { ...comment, id: commentRef.id };
}

export async function getComments(postId) {
  if (!isFirebaseConfigured) {
    const posts = localGet('posts', []);
    const post = posts.find(p => p.id === postId);
    return post?.comments || [];
  }
  const q = query(
    collection(db, COLLECTIONS.posts, postId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ══════════════════════════════════════════════════════════════
// LIVE CHAT ROOMS
// ══════════════════════════════════════════════════════════════

const DEFAULT_ROOMS = [
  { id: 'general',    name: 'General',    desc: 'Hang out and chat', icon: '💬' },
  { id: 'dev',        name: 'Developers', desc: 'Code talk',        icon: '💻' },
  { id: 'art',        name: 'Art & Design', desc: 'Creative corner', icon: '🎨' },
  { id: 'gaming',     name: 'Gaming',     desc: 'Game on',          icon: '🎮' },
  { id: 'music',      name: 'Music',      desc: 'Beats & tracks',   icon: '🎵' },
  { id: 'announce',   name: 'Announcements', desc: 'Official updates', icon: '📢' },
];

export function getChatRooms() {
  return DEFAULT_ROOMS;
}

export async function sendChatMessage(roomId, text) {
  const msg = {
    authorId: currentUserId(),
    authorName: currentUserName(),
    authorAvatar: currentUserAvatar(),
    text,
    createdAt: Date.now(),
  };

  if (!isFirebaseConfigured) {
    const key = `chat_${roomId}`;
    const messages = localGet(key, []);
    msg.id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    messages.push(msg);
    if (messages.length > 200) messages.splice(0, messages.length - 200);
    localSet(key, messages);
    return msg;
  }

  const ref = await addDoc(
    collection(db, COLLECTIONS.chatRooms, roomId, 'messages'),
    { ...msg, createdAt: serverTimestamp() }
  );
  return { ...msg, id: ref.id };
}

export async function getChatMessages(roomId, max = 100) {
  if (!isFirebaseConfigured) {
    return localGet(`chat_${roomId}`, []).slice(-max);
  }
  const q = query(
    collection(db, COLLECTIONS.chatRooms, roomId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
}

export function onChatMessages(roomId, callback) {
  if (!isFirebaseConfigured) {
    // Poll local storage for offline mode
    const interval = setInterval(() => {
      callback(localGet(`chat_${roomId}`, []));
    }, 1000);
    return () => clearInterval(interval);
  }
  const q = query(
    collection(db, COLLECTIONS.chatRooms, roomId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ══════════════════════════════════════════════════════════════
// DIRECT MESSAGES
// ══════════════════════════════════════════════════════════════

function dmThreadId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export async function sendDirectMessage(toUserId, text) {
  const fromId = currentUserId();
  const threadId = dmThreadId(fromId, toUserId);
  const msg = {
    senderId: fromId,
    senderName: currentUserName(),
    text,
    read: false,
    createdAt: Date.now(),
  };

  if (!isFirebaseConfigured) {
    const key = `dm_${threadId}`;
    const messages = localGet(key, []);
    msg.id = `dm-${Date.now()}`;
    messages.push(msg);
    localSet(key, messages);
    // Update thread list
    const threads = localGet('dm_threads', []);
    const existing = threads.find(t => t.id === threadId);
    if (existing) {
      existing.lastMessage = text;
      existing.lastAt = Date.now();
      existing.unread = (existing.unread || 0) + 1;
    } else {
      threads.push({ id: threadId, participants: [fromId, toUserId], lastMessage: text, lastAt: Date.now(), unread: 1 });
    }
    localSet('dm_threads', threads);
    return msg;
  }

  await addDoc(
    collection(db, COLLECTIONS.dms, threadId, 'messages'),
    { ...msg, createdAt: serverTimestamp() }
  );
  await setDoc(doc(db, COLLECTIONS.dms, threadId), {
    participants: [fromId, toUserId],
    lastMessage: text,
    lastAt: serverTimestamp(),
  }, { merge: true });
  return msg;
}

export async function getDMMessages(otherUserId, max = 100) {
  const threadId = dmThreadId(currentUserId(), otherUserId);
  if (!isFirebaseConfigured) {
    return localGet(`dm_${threadId}`, []).slice(-max);
  }
  const q = query(
    collection(db, COLLECTIONS.dms, threadId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function onDMMessages(otherUserId, callback) {
  const threadId = dmThreadId(currentUserId(), otherUserId);
  if (!isFirebaseConfigured) {
    const interval = setInterval(() => {
      callback(localGet(`dm_${threadId}`, []));
    }, 1000);
    return () => clearInterval(interval);
  }
  const q = query(
    collection(db, COLLECTIONS.dms, threadId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function getDMThreads() {
  const uid = currentUserId();
  if (!isFirebaseConfigured) {
    return localGet('dm_threads', []).filter(t => t.participants?.includes(uid));
  }
  const q = query(
    collection(db, COLLECTIONS.dms),
    where('participants', 'array-contains', uid),
    orderBy('lastAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ══════════════════════════════════════════════════════════════
// FRIENDS / CONNECTIONS
// ══════════════════════════════════════════════════════════════

export async function addFriend(friendId) {
  const uid = currentUserId();
  if (!isFirebaseConfigured) {
    const friends = localGet('friends', []);
    if (!friends.includes(friendId)) {
      friends.push(friendId);
      localSet('friends', friends);
    }
    return friends;
  }
  await setDoc(doc(db, COLLECTIONS.friends, uid), {
    connections: arrayUnion(friendId),
  }, { merge: true });
  await setDoc(doc(db, COLLECTIONS.friends, friendId), {
    connections: arrayUnion(uid),
  }, { merge: true });
}

export async function removeFriend(friendId) {
  const uid = currentUserId();
  if (!isFirebaseConfigured) {
    let friends = localGet('friends', []);
    friends = friends.filter(id => id !== friendId);
    localSet('friends', friends);
    return friends;
  }
  await updateDoc(doc(db, COLLECTIONS.friends, uid), { connections: arrayRemove(friendId) });
  await updateDoc(doc(db, COLLECTIONS.friends, friendId), { connections: arrayRemove(uid) });
}

export async function getFriends() {
  const uid = currentUserId();
  if (!isFirebaseConfigured) {
    return localGet('friends', []);
  }
  const snap = await getDoc(doc(db, COLLECTIONS.friends, uid));
  return snap.exists() ? (snap.data().connections || []) : [];
}

export function onFriendsUpdate(callback) {
  const uid = currentUserId();
  if (!isFirebaseConfigured) return () => {};
  return onSnapshot(doc(db, COLLECTIONS.friends, uid), (snap) => {
    callback(snap.exists() ? (snap.data().connections || []) : []);
  });
}

// ── Utility exports ──────────────────────────────────────────
export { currentUserId, currentUserName, currentUserAvatar };
