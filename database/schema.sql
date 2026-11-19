CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    attempt TEXT NOT NULL UNIQUE,
    owner TEXT NOT NULL,
    mode TEXT NOT NULL,
    surname TEXT NOT NULL,
    product TEXT NOT NULL,
    amount TEXT NOT NULL,
    remote_id TEXT UNIQUE,
    checkout TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS shield_styles (
    purchase_id TEXT PRIMARY KEY REFERENCES purchases(id),
    palette TEXT NOT NULL
);
