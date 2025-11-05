export interface Env {
  DB: D1Database;
  AES_GCM_KEY: string;
}

export interface UserCredentials {
  email_address: string;
  password: string;
  totp_key: string;
}
