"""Derive shared land edges from the retained Natural Earth geometry; no new borders are invented."""
import json
from collections import defaultdict
from pathlib import Path
root = Path(__file__).resolve().parent.parent
features = json.loads((root / 'countries.geojson').read_text())['features']
segments = {}
neighbors = defaultdict(set)
owners = {'Somaliland': 'Somalia', 'Northern Cyprus': 'Cyprus'}
for feature in features:
    props, geometry = feature['properties'], feature.get('geometry')
    if not geometry: continue
    name = owners.get(props['ADMIN'], props['ADMIN'])
    polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
    for polygon in polygons:
        for ring in polygon:
            for a,b in zip(ring, ring[1:]):
                a,b = tuple(round(x,5) for x in a), tuple(round(x,5) for x in b)
                if a == b: continue
                edge = tuple(sorted((a,b)))
                prior = segments.get(edge)
                if prior and prior != name:
                    neighbors[name].add(prior); neighbors[prior].add(name)
                else: segments[edge] = name
(root/'country-borders.js').write_text('// Shared land edges derived from countries.geojson; mapped regions are resolved by the data adapter.\nwindow.COUNTRY_BORDER_NAMES = '+json.dumps({k:sorted(v) for k,v in neighbors.items()}, ensure_ascii=False, separators=(',', ':'))+';\n')
print('Derived adjacency for',len(neighbors),'mapped areas.')
