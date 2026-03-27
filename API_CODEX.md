# NovaAura API Codex

**The Universal API Integration Layer** - Connect NovaAura to real infrastructure.

---

## 🌐 Domain Management

### Check Availability
```javascript
const result = await APICodex.Domain.checkAvailability('myapp', 'com');
// { available: true, price: 12.99 }
```

### Purchase Domain
```javascript
await APICodex.Domain.purchaseDomain('myapp', 'com', 1, contactInfo);
```

### Configure DNS
```javascript
await APICodex.Domain.setDNS('myapp.com', [
  { type: 'A', name: '@', value: '76.76.21.21' }
]);
```

### Auto-Configure for NovAura
```javascript
await APICodex.Domain.configureForNovAura('myapp.com');
// Sets up Vercel + NovAura hosting
```

---

## ☁️ Cloud Providers

### Google Cloud
```javascript
// Create VM
await APICodex.Cloud.google.createVM({
  zone: 'us-central1-a',
  machineType: 'e2-micro'
});

// Deploy to Cloud Run
await APICodex.Cloud.google.createCloudRun('my-service');

// Get billing
const billing = await APICodex.Cloud.google.getBillingInfo();
```

### Alibaba Cloud
```javascript
// Create ECS instance
await APICodex.Cloud.alibaba.createECS({
  region: 'us-west-1',
  instanceType: 'ecs.t5-lc1m1.small'
});

// Apply for startup credits ($5K-15K!)
await APICodex.Cloud.alibaba.applyStartupCredits();
// Contact: Cinco Feng (cinco.feng@alibabacloud.com)
```

### AWS
```javascript
// Create EC2
await APICodex.Cloud.aws.createEC2({
  instanceType: 't2.micro',
  region: 'us-east-1'
});

// Create S3 bucket
await APICodex.Cloud.aws.createS3Bucket('my-bucket', 'us-east-1');

// Deploy to Amplify
await APICodex.Cloud.aws.deployToAmplify('my-app', 'github.com/user/repo');
```

### DigitalOcean
```javascript
// Create Droplet
await APICodex.Cloud.digitalOcean.createDroplet(
  'my-droplet',
  's-1vcpu-1gb',
  'nyc1'
);
```

---

## 💾 Databases

### Supabase
```javascript
await APICodex.Database.createSupabaseProject('my-db', 'us-east-1');
// Returns: { url, apiKey, projectId }
```

### Firebase
```javascript
await APICodex.Database.createFirebaseProject('my-project-id', 'My Project');
```

### Postgres
```javascript
await APICodex.Database.createPostgresDB(host, credentials, 'mydb');
```

---

## 📧 Email

### SendGrid Campaign
```javascript
await APICodex.Email.sendCampaign(apiKey, {
  subject: 'New Product Launch',
  recipients: ['user1@email.com'],
  template: 'welcome'
});
```

### Gmail
```javascript
await APICodex.Email.sendGmail(accessToken, {
  to: 'partner@company.com',
  subject: 'Partnership Opportunity',
  body: '...'
});
```

---

## 💳 Payments (Stripe)

```javascript
// Create customer
const customer = await APICodex.Payment.createCustomer(
  'user@email.com',
  'John Doe'
);

// Create subscription
await APICodex.Payment.createSubscription(
  customer.customerId,
  'price_monthly_pro'
);

// Get invoices
const invoices = await APICodex.Payment.getInvoices(customer.customerId);
```

---

## 🚀 Deployment

### SSH Commands
```javascript
await APICodex.Deploy.sshExecute('34.123.45.67', credentials, 'git pull');
```

### Git Deploy
```javascript
await APICodex.Deploy.gitDeploy(
  'github.com/user/repo',
  'main',
  '34.123.45.67'
);
```

### Docker
```javascript
await APICodex.Deploy.dockerDeploy(
  'myapp:latest',
  'myapp-container',
  ['3000:3000'],
  '34.123.45.67'
);
```

---

## 🤖 High-Level Orchestration

### Create Full Project
```javascript
const project = await APICodex.Orchestrator.createFullStackProject({
  name: 'MyApp',
  domain: 'myapp.com',
  type: 'webapp',
  stack: 'react-node',
  provider: 'google'
});

// Does ALL of this:
// 1. Purchases domain
// 2. Creates VM/Cloud Run
// 3. Sets up database
// 4. Configures DNS
// 5. Deploys starter code
```

### Apply for All Startup Credits
```javascript
await APICodex.Orchestrator.applyAllStartupCredits({
  companyName: 'NovAura',
  email: 'founder@novaura.life',
  website: 'https://novaura.life',
  description: 'AI-powered business automation'
});

// Applies to: AWS, Google, Alibaba, Microsoft
// Potential: $50,000+ in credits
```

### Backup Everything
```javascript
await APICodex.Orchestrator.backupAllAssets();
// Backs up: domains, databases, files, configs
```

### Get Health Status
```javascript
const health = await APICodex.Orchestrator.getResourceHealth();
// Returns status of all your infrastructure
```

---

## 🔐 Credentials

### Store Securely
```javascript
await APICodex.storeCredentials('google_cloud', {
  apiKey: 'AIza...',
  projectId: 'my-project'
});
// Encrypted at rest, never logged
```

### List Stored
```javascript
const creds = await APICodex.getCredentials();
// Returns masked: { provider: 'google', masked: 'AIza****' }
```

---

## 🎯 Usage in Nova Concierge

```javascript
// Inside NovaConciergeWindow
const handleCreateDomain = async (domain) => {
  // 1. Check availability
  const check = await APICodex.Domain.checkAvailability(domain.name, 'com');
  
  if (!check.available) {
    toast.error('Domain taken!');
    return;
  }
  
  // 2. Create full project
  const result = await APICodex.Orchestrator.createFullStackProject({
    name: domain.name,
    domain: `${domain.name}.com`,
    type: domain.type
  });
  
  // 3. Show success
  toast.success(`Deployed to ${result.url}!`);
};
```

---

## 🔧 Environment Variables

Required backend env vars:
```
NAMECHEAP_USER=your_namecheap_user
NAMECHEAP_API_KEY=your_api_key

GCP_SERVICE_ACCOUNT_KEY={...json...}

ALIBABA_ACCESS_KEY_ID=LTAI...
ALIBABA_ACCESS_KEY_SECRET=...

AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

DO_API_TOKEN=dop_v1_...

SENDGRID_API_KEY=SG...
STRIPE_SECRET_KEY=sk_...
```

---

## 📊 Backend Routes

All routes under `/api/codex/*`:

| Method | Route | Description |
|--------|-------|-------------|
| POST | /domain/check | Check availability |
| POST | /domain/purchase | Buy domain |
| POST | /gcp/vm | Create Google VM |
| POST | /alibaba/credits | Apply for Alibaba credits |
| POST | /aws/ec2 | Create AWS instance |
| POST | /orchestrate/project | Full project creation |
| GET | /health/all | Resource health |

---

## 🚀 Next Steps

1. **Add real API keys** to backend environment
2. **Test with Nova Concierge** - "Create domain myapp"
3. **Apply for Alibaba credits** - Cinco Feng partnership
4. **Scale** - Each user gets their own infra

**This is the bridge between AI commands and real infrastructure!**
