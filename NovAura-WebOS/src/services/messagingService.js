/**
 * NovAura Cloud Messaging Service (FCM)
 *
 * Handles push notification registration, permission requests,
 * and foreground message handling via Firebase Cloud Messaging.
 * Uses the novaura-systems project VAPID key for web push.
 */

import { messaging, isFirebaseConfigured } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || '';

// Track subscription state
let fcmToken = null;
let messageListeners = [];

/**
 * Request notification permission and get FCM token.
 * Returns the token string or null if denied/unsupported.
 */
export async function requestNotificationPermission() {
  if (!isFirebaseConfigured || !messaging) {
    console.warn('[NovAura FCM] Firebase or messaging not available');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[NovAura FCM] Notification permission denied');
      return null;
    }

    fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log('[NovAura FCM] Token acquired:', fcmToken?.slice(0, 20) + '...');

    // Store token for server-side targeting
    localStorage.setItem('novaura_fcm_token', fcmToken);

    return fcmToken;
  } catch (err) {
    console.error('[NovAura FCM] Token registration failed:', err);
    return null;
  }
}

/**
 * Get the current FCM token (or null if not registered).
 */
export function getFCMToken() {
  return fcmToken || localStorage.getItem('novaura_fcm_token');
}

/**
 * Listen for foreground push messages.
 * Returns an unsubscribe function.
 */
export function onPushMessage(callback) {
  if (!isFirebaseConfigured || !messaging) {
    // Store listener for when messaging becomes available
    messageListeners.push(callback);
    return () => {
      messageListeners = messageListeners.filter(l => l !== callback);
    };
  }

  return onMessage(messaging, (payload) => {
    console.log('[NovAura FCM] Foreground message:', payload);

    const notification = {
      id: `notif-${Date.now()}`,
      title: payload.notification?.title || payload.data?.title || 'NovAura',
      body: payload.notification?.body || payload.data?.body || '',
      icon: payload.notification?.icon || '/icons/novaura-icon.png',
      data: payload.data || {},
      timestamp: Date.now(),
      read: false,
    };

    // Store in local notification history
    const history = JSON.parse(localStorage.getItem('novaura_notifications') || '[]');
    history.unshift(notification);
    if (history.length > 100) history.length = 100;
    localStorage.setItem('novaura_notifications', JSON.stringify(history));

    callback(notification);
  });
}

/**
 * Get stored notification history.
 */
export function getNotificationHistory() {
  try {
    return JSON.parse(localStorage.getItem('novaura_notifications') || '[]');
  } catch {
    return [];
  }
}

/**
 * Mark a notification as read.
 */
export function markNotificationRead(notifId) {
  const history = getNotificationHistory();
  const notif = history.find(n => n.id === notifId);
  if (notif) {
    notif.read = true;
    localStorage.setItem('novaura_notifications', JSON.stringify(history));
  }
}

/**
 * Clear all notifications.
 */
export function clearNotifications() {
  localStorage.setItem('novaura_notifications', '[]');
}

/**
 * Show a local browser notification (when app is in foreground).
 */
export function showLocalNotification(title, body, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  return new Notification(title, {
    body,
    icon: options.icon || '/icons/novaura-icon.png',
    badge: '/icons/novaura-badge.png',
    tag: options.tag || `novaura-${Date.now()}`,
    data: options.data,
    ...options,
  });
}

/**
 * Subscribe to a topic (requires Cloud Functions backend).
 * Stores intent locally; backend subscribes token to topic.
 */
export function subscribeToTopic(topic) {
  const subs = JSON.parse(localStorage.getItem('novaura_fcm_topics') || '[]');
  if (!subs.includes(topic)) {
    subs.push(topic);
    localStorage.setItem('novaura_fcm_topics', JSON.stringify(subs));
  }
  // TODO: Call Cloud Function to subscribe token to topic
  console.log(`[NovAura FCM] Subscribed to topic: ${topic}`);
}

export function getSubscribedTopics() {
  try {
    return JSON.parse(localStorage.getItem('novaura_fcm_topics') || '[]');
  } catch {
    return [];
  }
}
