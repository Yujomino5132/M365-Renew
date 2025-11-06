import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { generateAESGCMKey } from '../crypto/aes-gcm';
import { Env } from '../interfaces';

export class GenerateKeyRoute extends OpenAPIRoute {
  schema = {
    tags: ['Admin'],
    summary: 'Generate AES-GCM Key',
    description: 'Generates a new AES-GCM key and stores it in Secrets Store',
    responses: {
      '200': {
        description: 'Key generated and stored successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  };

  async handle(c: Context<{ Bindings: Env }>) {
    const key = await generateAESGCMKey();
    
    // Store the key in Secrets Store
    await c.env.SECRETS.put('AES_GCM_KEY', key);
    
    return c.json({
      success: true,
      message: 'AES-GCM key generated and stored successfully',
    });
  }
}
