import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { GenerateKeyRoute } from './endpoints/generate-key';
import { StoreCredentialsRoute } from './endpoints/store-credentials';
import { GetCredentialsRoute } from './endpoints/get-credentials';
import { Env } from './interfaces';

const app = new Hono<{ Bindings: Env }>();

const openapi = fromHono(app, {
  docs_url: '/docs',
});

openapi.post('/api/admin/generate-key', GenerateKeyRoute);
openapi.post('/api/credentials/store', StoreCredentialsRoute);
openapi.get('/api/internal/credentials/:user_id', GetCredentialsRoute);

export default openapi;
