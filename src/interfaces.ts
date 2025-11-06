export interface Env {
  DB: D1Database;
  SECRETS: any; // Cloudflare Secrets Store binding
}

export interface UserCredentials {
  email_address: string;
  password: string;
  totp_key: string;
}
