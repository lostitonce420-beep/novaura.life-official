/**
 * SecretService — reads secrets from process.env (populated by dotenv + Firebase Functions env)
 * Secrets are loaded from functions/.env at deploy time.
 */
class SecretService {
  private cache: Record<string, string> = {};

  async getSecret(name: string): Promise<string | null> {
    if (this.cache[name]) return this.cache[name];
    const value = process.env[name] || null;
    if (value) {
      this.cache[name] = value;
      console.log(`[SecretService] Loaded: ${name}`);
    } else {
      console.warn(`[SecretService] Missing env var: ${name}`);
    }
    return value;
  }

  clearCache() {
    this.cache = {};
  }
}

export const secretService = new SecretService();
