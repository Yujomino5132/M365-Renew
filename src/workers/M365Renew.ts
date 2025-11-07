import { AbstractWorker } from '@/base';
import { fromHono, HonoOpenAPIRouterType } from 'chanfana';
import { Hono } from 'hono';
import { GenerateKeyRoute } from '@/endpoints/generate-key';
import { StoreCredentialsRoute } from '@/endpoints/store-credentials';
import { GetCredentialsRoute } from '@/endpoints/get-credentials';
import { LoginRoute } from '@/endpoints/login';
import { UserDAO, UserProcessingStateDAO, UserProcessingLogDAO } from '@/dao';
import { VoidUtil } from '@/utils';
import { User } from '@/model';

class M365RenewWorker extends AbstractWorker {
  protected readonly app: Hono<{ Bindings: Env }>;

  constructor() {
    super();

    const app: Hono<{
      Bindings: Env;
    }> = new Hono<{ Bindings: Env }>();
    const openapi: HonoOpenAPIRouterType<{
      Bindings: Env;
    }> = fromHono(app, {
      docs_url: '/docs',
    });

    openapi.post('/api/admin/generate-key', GenerateKeyRoute);
    openapi.post('/api/credentials/store', StoreCredentialsRoute);
    openapi.get('/api/internal/credentials/:user_id', GetCredentialsRoute);
    openapi.post('/api/auth/login', LoginRoute);

    this.app = openapi;
  }

  protected async handleFetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return this.app.fetch(request, env, ctx);
  }

  protected async handleScheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    VoidUtil.void(_event, _ctx);
    const userDAO = new UserDAO(env.DB);
    const stateDAO = new UserProcessingStateDAO(env.DB);
    const logDAO = new UserProcessingLogDAO(env.DB);

    const user: User | null = await userDAO.getNextUserForProcessing();
    if (!user) {
      return;
    }
    console.log('👉 Now processing userId: ', user.userId);

    try {
      const credentialsResponse: Response = await env.SELF.fetch(`https://self.internal/api/internal/credentials/${user.userId}`);
      const credentials: unknown = await credentialsResponse.json();

      const loginResponse: Response = await env.SELF.fetch('https://self.internal/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const { success } = await loginResponse.json();

      const status: 'success' | 'failure' = success ? 'success' : 'failure';
      const message: string = success ? 'Login successful' : 'Login failed';

      await stateDAO.upsertState(user.userId, status, message);
      await logDAO.createLog(user.userId, status, message);
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
      await stateDAO.upsertState(user.userId, 'failure', errorMessage);
      await logDAO.createLog(user.userId, 'failure', errorMessage);
    }
  }
}

export { M365RenewWorker };
