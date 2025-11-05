CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    encrypted_email_address TEXT NOT NULL UNIQUE,
    encrypted_password TEXT NOT NULL,
    encrypted_totp_key TEXT NOT NULL,
    salt TEXT NOT NULL,
    status TEXT CHECK(status IN ('active', 'disabled', 'locked')) DEFAULT 'active',
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE user_processing_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    processed_at DATETIME DEFAULT (datetime('now')),
    process_status TEXT NOT NULL CHECK(process_status IN ('success', 'failure', 'skipped')),
    message TEXT,
    updated_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_processing_log_user_id ON user_processing_log(user_id);

CREATE TABLE user_processing_state (
    user_id INTEGER PRIMARY KEY,
    last_processed_at DATETIME,
    last_process_status TEXT CHECK(last_process_status IN ('success', 'failure', 'skipped')),
    last_message TEXT,
    updated_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_processing_state_last_processed_at ON user_processing_state(last_processed_at);
