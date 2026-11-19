"""Consulta de registros Wikidata almacenados en LIA Origenes."""

from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/api/wikidata", tags=["Wikidata"])


@router.get("/surnames/{surname}")
def get_surname(surname: str, request: Request):
    name = surname.strip()

    if not name or len(name) > 100:
        raise HTTPException(422, "Apellido no valido.")

    archive = request.app.state.archive

    with archive.connect() as db:
        rows = db.execute(
            """
            SELECT
                wikidata_id,
                label,
                description,
                source_url,
                license,
                entity_type,
                reference_count,
                retrieved_at,
                (
                    SELECT COUNT(*)
                    FROM jsonb_object_keys(claims)
                ) AS property_count
            FROM ori_wikidata_entities
            WHERE lower(label) = lower(%s)
              AND entity_type = 'surname'
            ORDER BY wikidata_id
            LIMIT 10
            """,
            (name,),
        ).fetchall()

    if not rows:
        raise HTTPException(
            404,
            "No existe un registro Wikidata almacenado para este apellido.",
        )

    return {
        "surname": name,
        "records": [
            {
                "wikidata_id": row["wikidata_id"],
                "label": row["label"],
                "description": row["description"],
                "source_url": row["source_url"],
                "license": row["license"],
                "entity_type": row["entity_type"],
                "reference_count": row["reference_count"],
                "property_count": row["property_count"],
                "retrieved_at": row["retrieved_at"].isoformat(),
                "evidence_status": "metadata_without_attached_references"
                if row["reference_count"] == 0
                else "references_require_review",
            }
            for row in rows
        ],
        "notice": (
            "Los registros Wikidata no demuestran por si solos "
            "origen geografico, parentesco ni migraciones familiares."
        ),
    }
