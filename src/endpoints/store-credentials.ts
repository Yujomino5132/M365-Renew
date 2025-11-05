import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';
import { encryptData } from '../crypto/aes-gcm';
import { Env } from '../interfaces';

export class StoreCredentialsRoute extends OpenAPIRoute {
  schema = {
    tags: ['Credentials'],
    summary: 'Store User Credentials',
    description: 'Encrypts and stores user email, password, and TOTP key',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              email_address: z.string().email(),
              password: z.string(),
              totp_key: z.string(),
            }),
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Credentials stored successfully',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              user_id: z.number(),
            }),
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
      encryptedEmail.iv // Using email's IV as salt
    ).run();

    return c.json({
      success: true,
      user_id: result.meta.last_row_id,
    });
  }
}
