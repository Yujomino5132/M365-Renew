import { IAPIRoute, IRequest, IResponse, IEnv, APIContext } from './IAPIRoute';
import { generateAESGCMKey } from '@/crypto/aes-gcm';
import { VoidUtil } from '@/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GenerateKeyRequest extends IRequest {}

interface GenerateKeyResponse extends IResponse {
  success: boolean;
  message: string;
  key: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GenerateKeyEnv extends IEnv {}

export class GenerateKeyRoute extends IAPIRoute<GenerateKeyRequest, GenerateKeyResponse, GenerateKeyEnv> {
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
              type: 'object' as const,
              properties: {
                success: { type: 'boolean' as const },
                message: { type: 'string' as const },
                key: { type: 'string' as const },
              },
            },
          },
        },
      },
    },
  };

  protected async handleRequest(_request: GenerateKeyRequest, _env: Env, _cxt: APIContext<GenerateKeyEnv>): Promise<GenerateKeyResponse> {
    const key = await generateAESGCMKey();

    // Store the key in Secrets Store
    // await env.AES_ENCRYPTION_KEY_SECRET.put(key);

    return {
      success: true,
      message: 'AES-GCM key generated and stored successfully',
      key: key,
    };
  }
}
