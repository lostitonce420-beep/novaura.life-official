const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const serviceAccount = require('../functions/src/service-account.json');

// Initialize Firebase Admin with the service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const client = new SecretManagerServiceClient({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key
  },
  projectId: serviceAccount.project_id
});

async function accessSecret(name) {
  try {
    const [version] = await client.accessSecretVersion({
      name: `projects/${serviceAccount.project_id}/secrets/${name}/versions/latest`,
    });
    const payload = version.payload.data.toString();
    return payload;
  } catch (err) {
    console.error(`Error accessing secret ${name}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('Retrieving NovAura Search API Keys...');
  
  const searchKey = await accessSecret('GOOGLE_SEARCH_API_KEY');
  const searchCx = await accessSecret('GOOGLE_SEARCH_CX');
  const geminiKey = await accessSecret('GEMINI_API_KEY');

  if (searchKey) console.log('GOOGLE_SEARCH_API_KEY: Found');
  if (searchCx) console.log('GOOGLE_SEARCH_CX: Found');
  if (geminiKey) console.log('GEMINI_API_KEY: Found');

  if (searchKey && searchCx) {
    console.log('\n--- SUCCESS ---');
    console.log('Keys are available in Secret Manager.');
  } else {
    console.log('\n--- MISSING KEYS ---');
    console.log('Please ensure GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX are in Secret Manager.');
  }
}

main();
