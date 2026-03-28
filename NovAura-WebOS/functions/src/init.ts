/**
 * Firebase Admin initialization — MUST be imported first
 * before any module that uses admin.firestore(), admin.auth(), etc.
 */
import * as admin from 'firebase-admin';

// Cloud Functions auto-provides credentials — no service account needed
admin.initializeApp();

export { admin };
