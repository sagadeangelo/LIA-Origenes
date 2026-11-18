from dataclasses import dataclass, field
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


@dataclass
class Settings:
    db: Path
    mode: str = "demo"
    token: str = field(default="", repr=False)
    secret: str = field(default="", repr=False)
    seller: str = ""
    application: str = ""

    @classmethod
    def environment(cls):
        mode = os.getenv("ORIGENES_MODE", "demo")
        config = cls(Path(os.getenv("ORIGENES_DB", ROOT / "data" / "origenes.sqlite3")), mode)
        if mode == "sandbox":
            config.token = os.getenv("ORIGENES_MP_ACCESS_TOKEN", "")
            config.secret = os.getenv("ORIGENES_MP_WEBHOOK_SECRET", "")
            config.seller = os.getenv("ORIGENES_MP_TEST_SELLER_ID", "")
            config.application = os.getenv("ORIGENES_MP_APPLICATION_ID", "")
            if not (config.token.startswith("TEST-") and config.secret and config.seller.isdigit()
                    and config.application.isdigit() and os.getenv("ORIGENES_TEST_ACCOUNTS_CONFIRMED") == "yes"):
                raise RuntimeError("Falta confirmar la configuración exclusiva de pruebas.")
        elif mode != "demo":
            raise RuntimeError("Modo de pago no admitido.")
        return config
