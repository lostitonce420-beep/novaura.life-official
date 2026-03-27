import { Router } from 'express';

const router = Router();
const NAMECOM_API = 'https://api.name.com/core/v1';

// Check availability
router.post('/check', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      res.status(400).json({ error: 'Domain required' });
      return;
    }

    const username = process.env.NAMECOM_USERNAME;
    const token = process.env.NAMECOM_API_TOKEN;
    
    if (!username || !token) {
      res.status(503).json({ error: 'Name.com not configured' });
      return;
    }

    const authHeader = 'Basic ' + Buffer.from(`${username}:${token}`).toString('base64');
    
    const response = await fetch(`${NAMECOM_API}/domains:checkAvailability`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ domainNames: [domain] })
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(502).json({ error: 'Name.com error', detail: err });
      return;
    }

    const data = await response.json();
    const result = data.results?.[0];
    
    res.json({
      domain: result?.domain?.domainName || domain,
      available: result?.available || false,
      premium: result?.premium || false,
      price: calculatePrice(result?.purchasePrice || 9.99, domain)
    });
  } catch (err: any) {
    console.error('Domain check error:', err);
    res.status(500).json({ error: 'Check failed', detail: err.message });
  }
});

// Register domain
router.post('/register', async (req, res) => {
  try {
    const { domain, period = 1 } = req.body;
    
    if (!domain) {
      res.status(400).json({ error: 'Domain required' });
      return;
    }

    const username = process.env.NAMECOM_USERNAME;
    const token = process.env.NAMECOM_API_TOKEN;
    
    if (!username || !token) {
      res.status(503).json({ error: 'Name.com not configured' });
      return;
    }

    const authHeader = 'Basic ' + Buffer.from(`${username}:${token}`).toString('base64');
    
    const response = await fetch(`${NAMECOM_API}/domains`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        domain: { domainName: domain, period },
        nameServers: ['ns1.name.com', 'ns2.name.com', 'ns3.name.com', 'ns4.name.com']
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      res.status(502).json({ 
        error: 'Registration failed', 
        detail: err.message || `HTTP ${response.status}` 
      });
      return;
    }

    const data = await response.json();
    
    res.json({
      success: true,
      domain: data.domain?.domainName,
      orderId: data.orderId,
      totalPaid: data.totalPaid,
      expires: data.domain?.expireDate
    });
  } catch (err: any) {
    console.error('Domain register error:', err);
    res.status(500).json({ error: 'Registration failed', detail: err.message });
  }
});

// Status check
router.get('/status', (req, res) => {
  const configured = !!(process.env.NAMECOM_USERNAME && process.env.NAMECOM_API_TOKEN);
  res.json({
    configured,
    provider: 'Name.com',
    apiEndpoint: NAMECOM_API
  });
});

function calculatePrice(basePrice: number, domain: string): number {
  const tld = domain.split('.').pop()?.toLowerCase();
  if (tld === 'com') {
    return Math.round(basePrice * 1.15 * 100) / 100;
  }
  return Math.round((basePrice + 2) * 100) / 100;
}

export default router;
