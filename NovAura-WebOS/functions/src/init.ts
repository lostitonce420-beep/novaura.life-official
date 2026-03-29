/**
 * Firebase Admin initialization — MUST be imported first
 * before any module that uses admin.firestore(), admin.auth(), etc.
 */
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file for local development
// In production, Firebase Functions uses deployed env vars
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

// Cloud Functions auto-provides credentials — no service account needed
admin.initializeApp();

export { admin };
// Deployed: 03/29/2026 02:13:06
