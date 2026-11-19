CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS ori_sources (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    digest text NOT NULL UNIQUE,
    filename text NOT NULL, title text NOT NULL, author text NOT NULL,
    category text NOT NULL, original bytea NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ori_passages (
    source_id bigint NOT NULL REFERENCES ori_sources(id) ON DELETE CASCADE,
    seq integer NOT NULL, locator text NOT NULL, body text NOT NULL,
    entities jsonb NOT NULL, embedding vector(768) NOT NULL,
    PRIMARY KEY(source_id,seq)
);
CREATE INDEX IF NOT EXISTS ori_passage_similarity ON ori_passages
    USING hnsw (embedding vector_cosine_ops);
