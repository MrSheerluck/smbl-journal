CREATE TABLE waitlist (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE users (
	workos_id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	kdf_salt TEXT,
	kdf_params TEXT,
	wrapped_vault_key TEXT,
	wrapped_key_iv TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE entries (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	entry_date TEXT NOT NULL,
	body_ciphertext TEXT NOT NULL,
	body_iv TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	UNIQUE(user_id, entry_date)
);
