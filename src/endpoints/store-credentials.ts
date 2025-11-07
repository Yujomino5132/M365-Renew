import { IAPIRoute, IRequest, IResponse, IEnv, APIContext } from './IAPIRoute';
import { encryptData } from '@/crypto/aes-gcm';
import { UserDAO } from '@/dao';
import { InternalServerError } from '@/error';
import { VoidUtil } from '@/utils';

interface StoreCredentialsRequest extends IRequest {
  email_address: string;
  password: string;
  totp_key: string;
}

interface StoreCredentialsResponse extends IResponse {
  success: boolean;
  user_id: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface StoreCredentialsEnv extends IEnv {}

export class StoreCredentialsRoute extends IAPIRoute<StoreCredentialsRequest, StoreCredentialsResponse, StoreCredentialsEnv> {
  schema = {
    tags: ['Credentials'],
    summary: 'Store User Credentials',
    description: 'Encrypts and stores user email, password, and TOTP key',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object' as const,
            properties: {
              email_address: { type: 'string' as const, format: 'email' as const },
              password: { type: 'string' as const },
              totp_key: { type: 'string' as const },
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
              type: 'object' as const,
              properties: {
                success: { type: 'boolean' as const },
                user_id: { type: 'number' as const },
              },
            },
          },
        },
      },
    },
  };

  protected async handleRequest(
    request: StoreCredentialsRequest,
    env: Env,
    _cxt: APIContext<StoreCredentialsEnv>,
  ): Promise<StoreCredentialsResponse> {
    const key:string = await env.AES_ENCRYPTION_KEY_SECRET.get();
    if (!key) {
      throw new InternalServerError('AES key not found. Please generate a key first.');
    }

    const iv:Uint8Array<ArrayBuffer> = crypto.getRandomValues(new Uint8Array(12));
    const ivBase64:string = btoa(String.fromCharCode(...iv));

    const encryptedEmail:{encrypted:string,iv:string} = await encryptData(request.email_address, key, ivBase64);
    const encryptedPassword:{encrypted:string,iv:string} = await encryptData(request.password, key, ivBase64);
    const encryptedTotpKey:{encrypted:string,iv:string} = await encryptData(request.totp_key, key, ivBase64);

    const userDAO :UserDAO= new UserDAO(env.DB);
    const userId:number = await userDAO.createUser(encryptedEmail.encrypted, encryptedPassword.encrypted, encryptedTotpKey.encrypted, ivBase64);

    return {
      success: true,
      user_id: userId,
    };
  }
}
