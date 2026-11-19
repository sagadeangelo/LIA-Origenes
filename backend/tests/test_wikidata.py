"""Pruebas aisladas de la API Wikidata."""

import unittest
from unittest.mock import MagicMock

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.api.wikidata import router


class WikidataApiTests(unittest.TestCase):

    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(router)

        self.connection = MagicMock()
        self.db = MagicMock()
        self.connection.__enter__.return_value = self.db

        self.archive = MagicMock()
        self.archive.connect.return_value = self.connection

        self.app.state.archive = self.archive
        self.client = TestClient(self.app)

    def test_found(self):
        from datetime import datetime, timezone

        self.db.execute.return_value.fetchall.return_value = [{
            "wikidata_id": "Q16884858",
            "label": "Tovar",
            "description": "apellido",
            "source_url": "https://www.wikidata.org/wiki/Q16884858",
            "license": "CC0",
            "entity_type": "surname",
            "reference_count": 0,
            "property_count": 13,
            "retrieved_at": datetime.now(timezone.utc),
        }]

        response = self.client.get("/api/wikidata/surnames/Tovar")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["records"][0]["wikidata_id"],
            "Q16884858",
        )

    def test_not_found(self):
        self.db.execute.return_value.fetchall.return_value = []

        response = self.client.get(
            "/api/wikidata/surnames/ApellidoInexistente"
        )

        self.assertEqual(response.status_code, 404)

    def test_invalid_surname(self):
        response = self.client.get(
            "/api/wikidata/surnames/" + ("A" * 101)
        )

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
