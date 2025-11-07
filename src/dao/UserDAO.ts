import { User, UserInternal } from '@/model';

class UserDAO {
  protected readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  public async getUserById(userId: number): Promise<User | null> {
    const result: UserInternal | null = await this.database
      .prepare(`SELECT * FROM users WHERE user_id = ? LIMIT 1`)
      .bind(userId)
      .first<UserInternal>();

    if (!result) {
      return null;
    }

    return {
      userId: result.user_id,
      encryptedEmailAddress: result.encrypted_email_address,
      encryptedPassword: result.encrypted_password,
      encryptedTotpKey: result.encrypted_totp_key,
      salt: result.salt,
      status: result.status,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  public async createUser(
    encryptedEmailAddress: string,
    encryptedPassword: string,
    encryptedTotpKey: string,
    salt: string,
  ): Promise<number> {
    const result:D1Result<Record<string,unknown>> = await this.database
      .prepare(
        `INSERT INTO users (encrypted_email_address, encrypted_password, encrypted_totp_key, salt)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(encryptedEmailAddress, encryptedPassword, encryptedTotpKey, salt)
      .run();

    return result.meta.last_row_id as number;
  }

  public async getNextUserForProcessing(): Promise<User | null> {
    const result: UserInternal | null = await this.database
      .prepare(
        `
        SELECT u.* FROM users u
        LEFT JOIN user_processing_state ups ON u.user_id = ups.user_id
        WHERE u.status = 'active'
          AND (ups.last_processed_at IS NULL 
               OR ups.last_processed_at < datetime('now', '-1 hour')
               OR (ups.retry_count < 3 AND ups.last_process_status = 'failure' AND ups.last_processed_at < datetime('now', '-20 hours')))
        ORDER BY ups.last_processed_at ASC NULLS FIRST
        LIMIT 1
      `,
      )
      .first<UserInternal>();

    if (!result) {
      return null;
    }

    return {
      userId: result.user_id,
      encryptedEmailAddress: result.encrypted_email_address,
      encryptedPassword: result.encrypted_password,
      encryptedTotpKey: result.encrypted_totp_key,
      salt: result.salt,
      status: result.status,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  public async updateUserStatus(userId: number, status: 'active' | 'disabled' | 'locked'): Promise<void> {
    await this.database.prepare(`UPDATE users SET status = ?, updated_at = datetime('now') WHERE user_id = ?`).bind(status, userId).run();
  }
}

export { UserDAO };
