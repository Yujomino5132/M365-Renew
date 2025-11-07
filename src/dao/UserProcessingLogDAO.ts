import { UserProcessingLog, UserProcessingLogInternal } from '../model';

class UserProcessingLogDAO {
  protected readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  public async createLog(userId: number, processStatus: 'success' | 'failure' | 'skipped', message?: string): Promise<number> {
    const result: D1Result<Record<string, unknown>> = await this.database
      .prepare(
        `INSERT INTO user_processing_log (user_id, process_status, message)
         VALUES (?, ?, ?)`,
      )
      .bind(userId, processStatus, message || null)
      .run();

    return result.meta.last_row_id as number;
  }

  public async getLogsByUserId(userId: number): Promise<UserProcessingLog[]> {
    const results: UserProcessingLogInternal[] = await this.database
      .prepare(`SELECT * FROM user_processing_log WHERE user_id = ? ORDER BY processed_at DESC`)
      .bind(userId)
      .all<UserProcessingLogInternal>();

    return results.map((result) => ({
      logId: result.log_id,
      userId: result.user_id,
      processedAt: result.processed_at,
      processStatus: result.process_status,
      message: result.message,
      updatedAt: result.updated_at,
    }));
  }
}

export { UserProcessingLogDAO };
