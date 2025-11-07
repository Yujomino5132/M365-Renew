import { IAPIRoute, IRequest, IResponse, IEnv, APIContext } from './IAPIRoute';
import { M365LoginUtil } from '@/utils';
import { VoidUtil } from '@/utils';

interface LoginRequest extends IRequest {
  email_address: string;
  password: string;
  totp_key: string;
}

interface LoginResponse extends IResponse {
  success: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface LoginEnv extends IEnv {}

export class LoginRoute extends IAPIRoute<LoginRequest, LoginResponse, LoginEnv> {
  schema = {
    tags: ['Authentication'],
    summary: 'M365 Login',
    description: 'Performs M365 login with email, password, and TOTP key',
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
        description: 'Login successful',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              properties: {
                success: { type: 'boolean' as const },
              },
            },
          },
        },
      },
    },
  };

  protected async handleRequest(request: LoginRequest, env: Env, _ctx: APIContext<LoginEnv>): Promise<LoginResponse> {
    VoidUtil.void(_ctx);
    const success: boolean = await M365LoginUtil.login(
      env.BROWSER,
      env.TOTP_GENERATOR,
      request.email_address,
      request.password,
      request.totp_key,
    );
    return { success };
  }
}
