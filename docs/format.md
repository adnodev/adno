# Adno data format

Adno stores one flat project record per project (title, settings, images, annotations) and exposes it through two standard projections. Neither projection is stored: both are computed from the record when exporting, and both can be read back.

| Projection | Standard | Produced by | Read by |
|---|---|---|---|
| IIIF Manifest | IIIF Presentation API 3.0 + Web Annotation Data Model | `toIIIFManifest` | `fromAny` |
| Annotation collection | Web Annotation Data Model | `toWADMCollection` | `fromAny` |

All code lives in `src/services/format/`.

## Annotations

An annotation is a W3C Web Annotation:

```json
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "#zone-recto",
  "type": "Annotation",
  "body": [
    { "type": "TextualBody", "value": "<p>Recto only</p>", "format": "text/html", "purpose": "commenting" }
  ],
  "adno:sourceMarkdown": "Recto only",
  "target": {
    "id": "g1@#zone-recto",
    "source": "https://example.org/iiif/folio-1/info.json",
    "selector": { "type": "FragmentSelector", "conformsTo": "http://www.w3.org/TR/media-frags/", "value": "xywh=pixel:10,10,80,60" }
  }
}
```

- The comment is a single `TextualBody` with `format: text/html` and `purpose: commenting`. Tag and audio bodies follow it.
- The markdown the comment was written in is kept in `adno:sourceMarkdown`.
- `target.source` is the image (the `info.json` of a IIIF image, or the file URL).
- `xywh` fragments use the `pixel:` unit and integer coordinates.
- Zone groups are encoded in the target `id` (`g1@`, `g2@`, …). Cutouts are listed per group in `adno:cutouts`.

## IIIF Manifest

The Manifest is the project file. One Canvas per image, the image painted on it, and the comments in the Canvas `annotations`.

```json
{
  "@context": ["https://adno.app/ns/context.json", "http://iiif.io/api/presentation/3/context.json"],
  "id": "https://adno.app/projects/<uuid>/manifest.json",
  "type": "Manifest",
  "label": { "none": ["Two folios"] },
  "summary": { "none": ["Zones spread over two images"] },
  "metadata": [{ "label": { "none": ["Auteur"] }, "value": { "none": ["Jane Doe"] } }],
  "provider": [{ "id": "…/manifest.json#editor", "type": "Agent", "label": { "none": ["The Lab"] } }],
  "rights": "http://creativecommons.org/licenses/by/4.0/",
  "requiredStatement": { "label": { "none": ["Attribution"] }, "value": { "none": ["Musée de la Ville"] } },
  "items": [
    {
      "id": "…/canvas/1",
      "type": "Canvas",
      "label": { "none": ["Folio 1r"] },
      "width": 400,
      "height": 300,
      "items": [{ "id": "…/canvas/1/painting", "type": "AnnotationPage", "items": [{ "motivation": "painting", "body": { "id": "…", "type": "Image", "service": [{ "id": "…", "type": "ImageService3" }] }, "target": "…/canvas/1" }] }],
      "annotations": [{ "id": "…/canvas/1/annotations", "type": "AnnotationPage", "items": [{ "id": "…/annotations/zone-recto", "type": "Annotation", "motivation": "commenting", "body": {…}, "target": {…} }] }]
    }
  ],
  "adno:project": { "id": "<uuid>", "settings": {…}, "images": [{…}], "created": "…", "modified": "…", "generator": {…} }
}
```

Mapping of the project fields:

| Project | Manifest |
|---|---|
| title | `label` |
| description | `summary` |
| creator | `metadata` entry labelled « Auteur » |
| editor | `provider` Agent |
| licence | `rights` when it is a Creative Commons or RightsStatements.org URI, otherwise appended to `requiredStatement` |
| attribution | `requiredStatement` |
| settings, images, dates, generator | `adno:project` |

Inside the Manifest, targets point at the Canvas and carry an absolute id (`…/annotations/<id>#g1-1`) because the IIIF validator requires every id to be an HTTP URI.

Ids are built from the deployment origin (`https://adno.app` when the origin is `localhost` or `file:`) followed by `/projects/<uuid>/…`.

## Annotation collection

The collection is a flat list of the same annotations, targeting the images directly.

```json
{
  "@context": ["https://adno.app/ns/context.json", "http://www.w3.org/ns/anno.jsonld"],
  "id": "https://adno.app/projects/<uuid>/collection.json",
  "type": "AnnotationCollection",
  "label": "Two folios",
  "creator": { "type": "Person", "name": "Jane Doe" },
  "created": "…",
  "modified": "…",
  "generator": { "id": "https://adno.app", "type": "Software", "name": "Adno" },
  "total": 3,
  "first": { "id": "…/collection/page/1", "type": "AnnotationPage", "startIndex": 0, "items": [{…}] },
  "adno:project": { "id": "<uuid>", "settings": {…}, "images": [{…}], "description": "…", "editor": "…", "licence": "…", "attribution": "…" }
}
```

`adno:project` only carries what the host vocabulary cannot express: Web Annotation has `label`, `creator`, `created`, `modified` and `generator`, so those stay at the top level; description, editor, licence and attribution go in the extension.

## The `adno:` extension

Extension terms are declared in `https://adno.app/ns/context.json` (`public/ns/context.json`), listed before the standard context so that IIIF and Web Annotation terms keep their meaning:

- `adno:project`: the project data a generic viewer does not need, kept as a JSON literal (`@type: @json`).
- `adno:cutouts`: cutout flags per zone group, JSON literal.
- `adno:sourceMarkdown`: the markdown source of the comment.

Clients that do not know the extension ignore these keys, as required by IIIF Presentation 3.0 §4.6.

## Import

`fromAny(json, { id })` accepts, in the same entry point:

| Input | Detected as |
|---|---|
| Adno Manifest (`adno:project`) | `adno-manifest` |
| Former Adno Manifest (settings in Base64 in `metadata`) | `legacy-base64-manifest` |
| Third-party IIIF Presentation 3 Manifest | `iiif-manifest` |
| IIIF Presentation 2 Manifest | `iiif-v2` |
| Adno collection (`adno:project`) | `adno-collection` |
| Former Adno export (`format: "Adno"`, `title`, `date`, `source`, `adno_settings`) | `legacy-collection` |
| Third-party Web Annotation collection | `annotation-collection` |
| IIIF Image API `info.json` | `image-info` |

Each format has its own reader in `src/services/format/importers/`. Readers return a project record; `fromAny` then runs the same normalisation as the database layer. Third-party annotations are converted to the internal model: ids become `#<last path segment>`, zone groups are read from `#gN-i` fragments or from a `group` letter, `sourceMarkdown` moves to `adno:sourceMarkdown`.

Only `commenting` annotations are imported. A third-party Manifest without annotations is opened as a new project from its first image.

## Backward compatibility

Older data is read forever and rewritten lazily in the new shape:

- `HTMLBody` and `AdnoRichText` bodies, duplicated bodies, markdown-only `TextualBody`;
- `adno.cutouts` and `adno.cutout`;
- target ids without the `gN@` prefix;
- decimal `xywh` coordinates;
- the single `rights` field, split into `licence` (URL) and `attribution` (text);
- Base64 settings in Manifest `metadata`;
- the former export keys `title`, `date`, `format`, `source`, `images`, `adno_settings`.

Normalisation happens in `projectDB.get()` (IndexedDB records), in `fromAny` (imports and embeds) and nowhere else. Adno only writes the current format.

## Tests

- `npm run test:unit`: Vitest suites in `tests/unit/` cover normalisation on real IndexedDB dumps, both projections, JSON-LD expansion with vendored contexts, import of every format and round trips.
- The generated Manifest in `tests/fixtures/iiif-validate/` is checked by the IIIF Presentation validator in CI.
