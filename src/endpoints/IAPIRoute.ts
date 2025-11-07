import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { DefaultInternalServerError, InternalServerError, IServiceError } from '@/error';

abstract class IAPIRoute<TRequest extends IRequest, TResponse extends IResponse, TEnv extends IEnv> extends OpenAPIRoute {
  async handle(c: APIContext<TEnv>) {
    try {
      const body: unknown = c.req.method === 'GET' ? {} : await c.req.json();
      const request: TRequest = body as TRequest;
      const response: TResponse = await this.handleRequest(request, c.env as TEnv, c);
      return c.json(response);
    } catch (error: unknown) {
      if (!(error instanceof IServiceError) || error instanceof InternalServerError) {
        console.error('Caught service error during execution: ', error);
      }
      if (error instanceof IServiceError) {
        console.warn('Responding with IServiceError: ', error.stack);
        return c.json({ Exception: { Type: error.getErrorType(), Message: error.getErrorMessage() } }, error.getErrorCode());
      }
      console.warn('Responding with DefaultInternalServerError: ', DefaultInternalServerError);
      return c.json(
        {
          Exception: { Type: DefaultInternalServerError.getErrorType(), Message: DefaultInternalServerError.getErrorMessage() },
        },
        DefaultInternalServerError.getErrorCode(),
      );
    }
  }

  protected abstract handleRequest(request: TRequest, env: TEnv, ctx: APIContext<TEnv>): Promise<TResponse>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IRequest {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IResponse {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IEnv {}

type APIContext<TEnv extends IEnv> = Context<{ Bindings: Env } & TEnv>;

export { IAPIRoute };
export type { IRequest, IResponse, IEnv, APIContext };
