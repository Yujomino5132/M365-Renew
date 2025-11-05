import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';
import { generateAESGCMKey } from '../crypto/aes-gcm';
import { Env } from '../interfaces';

export class GenerateKeyRoute extends OpenAPIRoute {
  schema = {
    tags: ['Admin'],
    summary: 'Generate AES-GCM Key',
    description: 'Generates a new AES-GCM key and stores it in secrets',
    responses: {
      '200': {
        description: 'Key generated successfully',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: Context<{ Bindings: Env }>) {
    const key = await generateAESGCMKey();
    // In production, you would update the secret via Wrangler API
    // For now, we'll return the key (in production, this should be secured)
    return c.json({
      success: true,
      message: 'Key generated. Update AES_GCM_KEY secret with this value.',
      key: key, // Remove this in production
    });
  }
}
