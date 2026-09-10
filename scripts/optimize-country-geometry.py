"""Build the single browser country-geometry bundle from Natural Earth GeoJSON.

The browser only needs a small subset of Natural Earth properties. Polygon rings
are simplified in longitude/latitude space while every source polygon part is
retained, so small islands remain represented even when their coastlines lose
sub-pixel detail.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


PROPERTY_KEYS = {
    "ADM0_A3",
    "ADMIN",
    "BRK_NAME",
    "CONTINENT",
    "ISO_A2",
    "ISO_A2_EH",
    "ISO_A3",
    "ISO_A3_EH",
    "LABELRANK",
    "LABEL_X",
    "LABEL_Y",
    "NAME",
    "NAME_ALT",
    "NAME_EN",
    "NAME_LONG",
    "NE_ID",
    "REGION_UN",
    "SOVEREIGNT",
    "SUBREGION",
    "TINY",
    "TYPE",
}


def point_segment_distance(point: list[float], start: list[float], end: list[float]) -> float:
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    if dx == 0 and dy == 0:
        return math.hypot(point[0] - start[0], point[1] - start[1])
    amount = ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)
    amount = max(0.0, min(1.0, amount))
    return math.hypot(point[0] - (start[0] + amount * dx), point[1] - (start[1] + amount * dy))


def simplify_line(points: list[list[float]], tolerance: float) -> list[list[float]]:
    if len(points) <= 2:
        return points
    start, end = points[0], points[-1]
    index, distance = max(
        ((index, point_segment_distance(point, start, end)) for index, point in enumerate(points[1:-1], 1)),
        key=lambda item: item[1],
    )
    if distance <= tolerance:
        return [start, end]
    return simplify_line(points[: index + 1], tolerance)[:-1] + simplify_line(points[index:], tolerance)


def quantize(point: list[float]) -> list[float]:
    return [round(float(point[0]), 5), round(float(point[1]), 5)]


def simplify_ring(ring: list[list[float]], tolerance: float) -> list[list[float]]:
    original: list[list[float]] = []
    for point in ring:
        compact = quantize(point)
        if not original or compact != original[-1]:
            original.append(compact)
    if len(original) > 1 and original[0] == original[-1]:
        original.pop()
    if len(original) < 3:
        return []

    anchor = original[0]
    opposite = max(
        range(1, len(original)),
        key=lambda index: (original[index][0] - anchor[0]) ** 2 + (original[index][1] - anchor[1]) ** 2,
    )
    first = simplify_line(original[: opposite + 1], tolerance)
    second = simplify_line(original[opposite:] + [anchor], tolerance)
    simplified = first[:-1] + second[:-1]
    if len(simplified) < 3:
        simplified = original
    return simplified + [simplified[0]]


def simplify_polygon(polygon: list[list[list[float]]], tolerance: float) -> list[list[list[float]]]:
    rings = [simplify_ring(ring, tolerance) for ring in polygon]
    if not rings or len(rings[0]) < 4:
        return []
    return [rings[0], *(ring for ring in rings[1:] if len(ring) >= 4)]


def simplify_geometry(geometry: dict, tolerance: float) -> dict:
    geometry_type = geometry.get("type")
    if geometry_type == "Polygon":
        coordinates = simplify_polygon(geometry.get("coordinates", []), tolerance)
    elif geometry_type == "MultiPolygon":
        coordinates = [
            simplified
            for polygon in geometry.get("coordinates", [])
            if (simplified := simplify_polygon(polygon, tolerance))
        ]
    else:
        raise ValueError(f"Unsupported geometry type: {geometry_type}")
    return {"type": geometry_type, "coordinates": coordinates}


def optimize(data: dict, tolerance: float) -> dict:
    features = []
    for feature in data.get("features", []):
        properties = feature.get("properties", {})
        features.append(
            {
                "type": "Feature",
                "properties": {key: properties[key] for key in sorted(PROPERTY_KEYS) if key in properties},
                "geometry": simplify_geometry(feature.get("geometry") or {}, tolerance),
            }
        )
    return {
        "type": "FeatureCollection",
        "name": data.get("name", "country-geometry"),
        "features": features,
        "bbox": data.get("bbox", [-180, -90, 180, 90]),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--tolerance", type=float, default=0.05)
    args = parser.parse_args()

    data = json.loads(args.source.read_text())
    optimized = optimize(data, args.tolerance)
    payload = json.dumps(optimized, ensure_ascii=False, separators=(",", ":"))
    if len(optimized["features"]) != len(data.get("features", [])):
        raise RuntimeError("Feature count changed during optimization")
    if any(not feature["geometry"]["coordinates"] for feature in optimized["features"]):
        raise RuntimeError("A feature lost all geometry during optimization")
    args.output.write_text(f"window.COUNTRIES_GEOJSON={payload};\n")
    print(f"Wrote {len(optimized['features'])} features to {args.output} ({len(payload):,} JSON bytes).")


if __name__ == "__main__":
    main()
