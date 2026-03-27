/**
 * NovaAura API Codex — Universal API Integration Layer
 * 
 * Handles:
 * - Domain registration (Namecheap, Cloudflare, GoDaddy)
 * - Cloud provisioning (Google Cloud, Alibaba, AWS, DigitalOcean)
 * - Server management (SSH, deployment, scaling)
 * - Database creation (Supabase, Firebase, Postgres)
 * - Email services (SendGrid, Mailgun)
 * - Payment processing (Stripe)
 */

import { getAuthHeaders } from './aiService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

// ── Domain Registrar APIs (name.com via NovAura backend) ─────────────────────

export const DomainAPI = {
  /**
   * Check domain availability (clean pricing)
   */
  async checkAvailability(domain) {
    const res = await fetch(`${BACKEND_URL}/domains/check?query=${encodeURIComponent(domain)}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    if (!res.ok) throw new Error(`Domain check failed: ${res.status}`);
    return await res.json();
    // Returns: { results: [{ domain, basePrice, totalPrice, available, premium }] }
  },

  /**
   * Register domain (through name.com)
   */
  async registerDomain(domain, period = 1, contacts, nameservers) {
    const res = await fetch(`${BACKEND_URL}/domains/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ domain, period, contacts, nameservers })
    });
    
    if (!res.ok) throw new Error(`Domain registration failed: ${res.status}`);
    return await res.json();
  },

  /**
   * Update nameservers
   */
  async setNameservers(domain, nameservers) {
    const res = await fetch(`${BACKEND_URL}/domains/${domain}/nameservers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ nameservers })
    });
    
    if (!res.ok) throw new Error(`Nameserver update failed: ${res.status}`);
    return await res.json();
  },

  /**
   * Get domain details
   */
  async getDomain(domain) {
    const res = await fetch(`${BACKEND_URL}/domains/${domain}`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) throw new Error(`Failed to get domain: ${res.status}`);
    return await res.json();
  },

  /**
   * Test name.com API connection
   */
  async testConnection() {
    const res = await fetch(`${BACKEND_URL}/domains/hello`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) throw new Error(`Connection test failed: ${res.status}`);
    return await res.json();
  },

  /**
   * Auto-configure for NovAura hosting
   */
  async configureForNovAura(domain) {
    return this.setDNS(domain, [
      { type: 'A', name: '@', value: '76.76.21.21', ttl: 3600 },
      { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com', ttl: 3600 }
    ]);
  }
};

// ── Cloud Provider APIs ──────────────────────────────────────────────────────

export const CloudAPI = {
  /**
   * Google Cloud Platform
   */
  google: {
    async createVM(config) {
      const res = await fetch(`${BACKEND_URL}/api/codex/gcp/vm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(config)
      });
      return await res.json();
    },

    async createCloudRun(service, region = 'us-central1') {
      const res = await fetch(`${BACKEND_URL}/api/codex/gcp/cloudrun`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ service, region })
      });
      return await res.json();
    },

    async deployToAppEngine(projectId) {
      const res = await fetch(`${BACKEND_URL}/api/codex/gcp/appengine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ projectId })
      });
      return await res.json();
    },

    async getBillingInfo() {
      const res = await fetch(`${BACKEND_URL}/api/codex/gcp/billing`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    }
  },

  /**
   * Alibaba Cloud
   */
  alibaba: {
    async createECS(config) {
      const res = await fetch(`${BACKEND_URL}/api/codex/alibaba/ecs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(config)
      });
      return await res.json();
    },

    async applyStartupCredits() {
      const res = await fetch(`${BACKEND_URL}/api/codex/alibaba/credits`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return await res.json();
    },

    async checkCreditsBalance() {
      const res = await fetch(`${BACKEND_URL}/api/codex/alibaba/credits/balance`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    }
  },

  /**
   * AWS
   */
  aws: {
    async createEC2(config) {
      const res = await fetch(`${BACKEND_URL}/api/codex/aws/ec2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(config)
      });
      return await res.json();
    },

    async createS3Bucket(bucketName, region = 'us-east-1') {
      const res = await fetch(`${BACKEND_URL}/api/codex/aws/s3`, {
        method: 'POST',
        headers: { 'Content-Type': '/application/json', ...getAuthHeaders() },
        body: JSON.stringify({ bucketName, region })
      });
      return await res.json();
    },

    async deployToAmplify(appName, repo) {
      const res = await fetch(`${BACKEND_URL}/api/codex/aws/amplify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ appName, repo })
      });
      return await res.json();
    }
  },

  /**
   * DigitalOcean
   */
  digitalOcean: {
    async createDroplet(name, size = 's-1vcpu-1gb', region = 'nyc1') {
      const res = await fetch(`${BACKEND_URL}/api/codex/do/droplet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name, size, region })
      });
      return await res.json();
    },

    async createAppPlatform(spec) {
      const res = await fetch(`${BACKEND_URL}/api/codex/do/app`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ spec })
      });
      return await res.json();
    }
  }
};

// ── Database APIs ────────────────────────────────────────────────────────────

export const DatabaseAPI = {
  /**
   * Supabase
   */
  async createSupabaseProject(name, region = 'us-east-1') {
    const res = await fetch(`${BACKEND_URL}/api/codex/supabase/project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ name, region })
    });
    return await res.json();
  },

  /**
   * Firebase
   */
  async createFirebaseProject(projectId, name) {
    const res = await fetch(`${BACKEND_URL}/api/codex/firebase/project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ projectId, name })
    });
    return await res.json();
  },

  /**
   * Postgres on existing server
   */
  async createPostgresDB(host, credentials, dbName) {
    const res = await fetch(`${BACKEND_URL}/api/codex/db/postgres`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ host, credentials, dbName })
    });
    return await res.json();
  }
};

// ── Email/Communication APIs ─────────────────────────────────────────────────

export const EmailAPI = {
  /**
   * SendGrid
   */
  async sendCampaign(apiKey, campaign) {
    const res = await fetch(`${BACKEND_URL}/api/codex/email/sendgrid/campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ apiKey, campaign })
    });
    return await res.json();
  },

  /**
   * Mailgun
   */
  async sendWithMailgun(domain, apiKey, message) {
    const res = await fetch(`${BACKEND_URL}/api/codex/email/mailgun`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ domain, apiKey, message })
    });
    return await res.json();
  },

  /**
   * Gmail OAuth
   */
  async sendGmail(accessToken, message) {
    const res = await fetch(`${BACKEND_URL}/api/codex/email/gmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ accessToken, message })
    });
    return await res.json();
  }
};

// ── Payment APIs ─────────────────────────────────────────────────────────────

export const PaymentAPI = {
  /**
   * Stripe
   */
  async createCustomer(email, name) {
    const res = await fetch(`${BACKEND_URL}/api/codex/stripe/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ email, name })
    });
    return await res.json();
  },

  async createSubscription(customerId, priceId) {
    const res = await fetch(`${BACKEND_URL}/api/codex/stripe/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ customerId, priceId })
    });
    return await res.json();
  },

  async getInvoices(customerId) {
    const res = await fetch(`${BACKEND_URL}/api/codex/stripe/invoices?customer=${customerId}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  }
};

// ── SSH/Deployment APIs ──────────────────────────────────────────────────────

export const DeployAPI = {
  /**
   * SSH command execution
   */
  async sshExecute(host, credentials, command) {
    const res = await fetch(`${BACKEND_URL}/api/codex/ssh/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ host, credentials, command })
    });
    return await res.json();
  },

  /**
   * Deploy via Git
   */
  async gitDeploy(repo, branch, server) {
    const res = await fetch(`${BACKEND_URL}/api/codex/deploy/git`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ repo, branch, server })
    });
    return await res.json();
  },

  /**
   * Docker deployment
   */
  async dockerDeploy(image, containerName, ports, server) {
    const res = await fetch(`${BACKEND_URL}/api/codex/deploy/docker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ image, containerName, ports, server })
    });
    return await res.json();
  },

  /**
   * Get deployment status
   */
  async getDeployStatus(deployId) {
    const res = await fetch(`${BACKEND_URL}/api/codex/deploy/status/${deployId}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  }
};

// ── High-Level Orchestration ─────────────────────────────────────────────────

export const OrchestratorAPI = {
  /**
   * Complete workflow: Domain + Server + Deploy
   */
  async createFullStackProject(config) {
    const res = await fetch(`${BACKEND_URL}/api/codex/orchestrate/project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        name: config.name,
        domain: config.domain,
        type: config.type || 'webapp',
        stack: config.stack || 'react-node',
        region: config.region || 'us-east-1',
        provider: config.provider || 'google'
      })
    });
    return await res.json();
  },

  /**
   * Apply for all startup credits
   */
  async applyAllStartupCredits(companyInfo) {
    const res = await fetch(`${BACKEND_URL}/api/codex/orchestrate/credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(companyInfo)
    });
    return await res.json();
  },

  /**
   * Automated backup of all assets
   */
  async backupAllAssets() {
    const res = await fetch(`${BACKEND_URL}/api/codex/orchestrate/backup`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  /**
   * Get resource health/status
   */
  async getResourceHealth() {
    const res = await fetch(`${BACKEND_URL}/api/codex/health/all`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  }
};

// ── Utility Functions ────────────────────────────────────────────────────────

/**
 * Test API connection
 */
export async function testAPIConnection(provider) {
  const res = await fetch(`${BACKEND_URL}/api/codex/test/${provider}`, {
    headers: getAuthHeaders()
  });
  return await res.json();
}

/**
 * Get API usage stats
 */
export async function getAPIStats() {
  const res = await fetch(`${BACKEND_URL}/api/codex/stats`, {
    headers: getAuthHeaders()
  });
  return await res.json();
}

/**
 * Store API credentials securely
 */
export async function storeCredentials(provider, credentials) {
  const res = await fetch(`${BACKEND_URL}/api/codex/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ provider, credentials })
  });
  return await res.json();
}

/**
 * Get stored credentials (masked)
 */
export async function getCredentials() {
  const res = await fetch(`${BACKEND_URL}/api/codex/credentials`, {
    headers: getAuthHeaders()
  });
  return await res.json();
}

// Export all APIs as single object
export const APICodex = {
  Domain: DomainAPI,
  Cloud: CloudAPI,
  Database: DatabaseAPI,
  Email: EmailAPI,
  Payment: PaymentAPI,
  Deploy: DeployAPI,
  Orchestrator: OrchestratorAPI,
  testConnection: testAPIConnection,
  getStats: getAPIStats,
  storeCredentials,
  getCredentials
};

export default APICodex;
