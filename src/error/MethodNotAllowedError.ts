import { ErrorCode, IServiceError } from './IServiceError';

class MethodNotAllowedError extends IServiceError {
  constructor(message?: string) {
    super(message ?? 'The method is not allowed for the requested URL.');
  }

  public getErrorCode(): ErrorCode {
    return 405;
  }

  public getErrorType(): string {
    return 'MethodNotAllowed';
  }

  public getErrorMessage(): string {
    return this.message;
  }
}

export { MethodNotAllowedError };
