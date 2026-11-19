CREATE TABLE IF NOT EXISTS ori_wikidata_entities (
    wikidata_id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL,
    license TEXT NOT NULL DEFAULT 'CC0',
    entity_type TEXT NOT NULL DEFAULT 'unverified',
    reference_count INTEGER NOT NULL DEFAULT 0,
    claims JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_data JSONB NOT NULL,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
