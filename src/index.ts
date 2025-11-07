import {  M365RenewWorker } from '@/workers';
import {AbstractWorker} from '@/base';

const worker: AbstractWorker = new M365RenewWorker();

export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext):Promise<Response> => worker.fetch(req, env, ctx),
  scheduled: (event: ScheduledController, env: Env, ctx: ExecutionContext):Promise<void> => worker.scheduled(event, env, ctx),
} satisfies ExportedHandler<Env>;
