import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';
import { decryptData } from '../crypto/aes-gcm';
import { Env } from '../interfaces';

export class GetCredentialsRoute extends OpenAPIRoute {
  schema = {
    tags: ['Internal'],
    summary: 'Get User Credentials',
    description: 'Internal route to decrypt and return user credentials',
    request: {
      params: z.object({
        user_id: z.string().transform(Number),
      }),
    },
    responses: {
      '200': {
        description: 'Credentials retrieved successfully',
        content: {
          'application/json': {
            schema: z.object({
              email_address: z.string(),
              password: z.string(),
              totp_key: z.string(),
            }),
          },
        },
      },
      '404': {
        description: 'User not found',
      },
    },
  };

  async handle(c: Context<{ Bindings: Env }>) {
    const { user_id } = c.req.param();
    const key = c.env.AES_GCM_KEY;

    const result = await c.env.DB.prepare(`
      SELECT encrypted_email_address, encrypted_password, encrypted_totp_key, salt
      FROM users WHERE user_id = ?
    `).bind(user_id).first();

    if (!result) {
      return c.json({ error: 'User not found' }, 404);
    }

    const email_address = await decryptData(result.encrypted_email_address, result.salt, key);
    const password = await decryptData(result.encrypted_password, result.salt, key);
    const totp_key = await decryptData(result.encrypted_totp_key, result.salt, key);

    return c.json({
      email_address,
      password,
      totp_key,
    });
  }
}
