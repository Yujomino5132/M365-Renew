import { AbstractWorker } from '@/base';
import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { GenerateKeyRoute } from '@/endpoints/generate-key';
import { StoreCredentialsRoute } from '@/endpoints/store-credentials';
import { GetCredentialsRoute } from '@/endpoints/get-credentials';
import { LoginRoute } from '@/endpoints/login';
import { UserDAO, UserProcessingStateDAO, UserProcessingLogDAO } from '@/dao';
import { VoidUtil } from '@/utils';

class M365RenewWorker extends AbstractWorker {
  protected readonly app: Hono<{ Bindings: Env }>;

  constructor() {
    super();

    const app: Hono = new Hono<{ Bindings: Env }>();
    const openapi = fromHono(app, {
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

  protected async handleScheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const userDAO = new UserDAO(env.DB);
    const stateDAO = new UserProcessingStateDAO(env.DB);
    const logDAO = new UserProcessingLogDAO(env.DB);

    console.log('Hello');
    const user = await userDAO.getNextUserForProcessing();
    console.log('now processing user: ', user.userId);
    if (!user) {
      return;
    }

    try {
      const credentialsResponse = await env.SELF.fetch(`https://self.internal/api/internal/credentials/${user.userId}`);
      const credentials = await credentialsResponse.json();

      const loginResponse = await env.SELF.fetch('https://self.internal/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const { success } = await loginResponse.json();

      const status = success ? 'success' : 'failure';
      const message = success ? 'Login successful' : 'Login failed';

      await stateDAO.upsertState(user.userId, status, message);
      await logDAO.createLog(user.userId, status, message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await stateDAO.upsertState(user.userId, 'failure', errorMessage);
      await logDAO.createLog(user.userId, 'failure', errorMessage);
    }

    VoidUtil.void(ctx);
  }
}

export { M365RenewWorker };
