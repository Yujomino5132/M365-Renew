import { AbstractWorker } from '@/base';
import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { GenerateKeyRoute } from '@/endpoints/generate-key';
import { StoreCredentialsRoute } from '@/endpoints/store-credentials';
import { GetCredentialsRoute } from '@/endpoints/get-credentials';
import { LoginRoute } from '@/endpoints/login';

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async handleScheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {}
}

export { M365RenewWorker };
