from contextlib import contextmanager, closing
import sqlite3
from .config import ROOT


@contextmanager
def connect(settings):
    with closing(sqlite3.connect(settings.db, timeout=20)) as db:
        db.row_factory = sqlite3.Row
        with db:
            yield db


def initialize(settings):
    settings.db.parent.mkdir(parents=True, exist_ok=True)
    with connect(settings) as db:
        db.execute("PRAGMA journal_mode=WAL")
        db.executescript((ROOT / "database/schema.sql").read_text(encoding="utf-8"))
