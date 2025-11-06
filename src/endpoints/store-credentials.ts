import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { encryptData } from '../crypto/aes-gcm';
import { Env } from '../interfaces';

export class StoreCredentialsRoute extends OpenAPIRoute {
  schema = {
    tags: ['Credentials'],
    summary: 'Store User Credentials',
    description: 'Encrypts and stores user email, password, and TOTP key',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email_address: { type: 'string', format: 'email' },
              password: { type: 'string' },
              totp_key: { type: 'string' },
            },
            required: ['email_address', 'password', 'totp_key'],
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Credentials stored successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                user_id: { type: 'number' },
              },
            },
          },
        },
      },
    },
  };

  async handle(c: Context<{ Bindings: Env }>) {
    const { email_address, password, totp_key } = await c.req.json();
    const key = c.env.AES_GCM_KEY;

    const encryptedEmail = await encryptData(email_address, key);
    const encryptedPassword = await encryptData(password, key);
    const encryptedTotpKey = await encryptData(totp_key, key);

    const result = await c.env.DB.prepare(`
      INSERT INTO users (encrypted_email_address, encrypted_password, encrypted_totp_key, salt)
      VALUES (?, ?, ?, ?)
    `).bind(
      encryptedEmail.encrypted,
      encryptedPassword.encrypted,
      encryptedTotpKey.encrypted,
      encryptedEmail.iv
    ).run();

    return c.json({
      success: true,
      user_id: result.meta.last_row_id,
    });
  }
}
