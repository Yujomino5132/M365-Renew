import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { M365LoginUtil } from '../utils';

export class LoginRoute extends OpenAPIRoute {
  schema = {
    tags: ['Authentication'],
    summary: 'M365 Login',
    description: 'Performs M365 login with email, password, and TOTP key',
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
        description: 'Login successful',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  };

  async handle(c: Context<{ Bindings: Env }>) {
    const { email_address, password, totp_key } = await c.req.json();

    const success = await M365LoginUtil.login(c.env.BROWSER, email_address, password, totp_key);

    return c.json({
      success,
    });
  }
}
