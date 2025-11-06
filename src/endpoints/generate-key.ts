import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
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
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                key: { type: 'string' },
              },
            },
          },
        },
      },
    },
  };

  async handle(c: Context<{ Bindings: Env }>) {
    const key = await generateAESGCMKey();
    return c.json({
      success: true,
      message: 'Key generated. Update AES_GCM_KEY secret with this value.',
      key: key,
    });
  }
}
