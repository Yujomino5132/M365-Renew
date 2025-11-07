import { IAPIRoute, IRequest, IResponse, IEnv, APIContext } from './IAPIRoute';
import { decryptData } from '@/crypto/aes-gcm';
import { UserDAO } from '@/dao';
import { InternalServerError, BadRequestError } from '@/error';
import { VoidUtil } from '@/utils';
import { User } from '@/model';

interface GetCredentialsRequest extends IRequest {
  user_id: string;
}

interface GetCredentialsResponse extends IResponse {
  email_address: string;
  password: string;
  totp_key: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GetCredentialsEnv extends IEnv {}

export class GetCredentialsRoute extends IAPIRoute<GetCredentialsRequest, GetCredentialsResponse, GetCredentialsEnv> {
  schema = {
    tags: ['Internal'],
    summary: 'Get User Credentials',
    description: 'Internal route to decrypt and return user credentials',
    parameters: [
      {
        name: 'user_id',
        in: 'path' as const,
        description: 'User ID to retrieve credentials for',
        required: true,
        schema: { type: 'string' as const },
      },
    ],
    responses: {
      '200': {
        description: 'Credentials retrieved successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              properties: {
                email_address: { type: 'string' as const },
                password: { type: 'string' as const },
                totp_key: { type: 'string' as const },
              },
            },
          },
        },
      },
    },
  };

  async handle(c: APIContext<GetCredentialsEnv>) {
    const user_id: string = c.req.param('user_id');
    const request: GetCredentialsRequest = { user_id };

    try {
      const response: GetCredentialsResponse = await this.handleRequest(request, c.env as Env, c);
      return c.json(response);
    } catch (error: unknown) {
      if (error instanceof BadRequestError && error.message.includes('User not found')) {
        return c.json({ Exception: { Type: 'NotFound', Message: 'User not found' } }, 404);
      }
      throw error;
    }
  }

  protected async handleRequest(
    request: GetCredentialsRequest,
    env: Env,
    _ctx: APIContext<GetCredentialsEnv>,
  ): Promise<GetCredentialsResponse> {
    VoidUtil.void(_ctx);
    const key: string = await env.AES_ENCRYPTION_KEY_SECRET.get();
    if (!key) {
      throw new InternalServerError('AES key not found. Please generate a key first.');
    }

    const userDAO = new UserDAO(env.DB);
    const user: User | null = await userDAO.getUserById(parseInt(request.user_id));

    if (!user) {
      throw new BadRequestError('User not found');
    }

    const email_address: string = await decryptData(user.encryptedEmailAddress, user.salt, key);
    const password: string = await decryptData(user.encryptedPassword, user.salt, key);
    const totp_key: string = await decryptData(user.encryptedTotpKey, user.salt, key);

    return {
      email_address,
      password,
      totp_key,
    };
  }
}
