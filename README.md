# The House of Dental

Dependency-free static website for The House of Dental. The visual design and draft content are intentionally preserved while shared site structure is generated from maintainable source files.

## Structure

- `src/pages/` contains page-specific main content for the 12 public HTML pages.
- `src/templates/` contains the shared full and minimal page shells.
- `src/data/` contains site metadata and structured service/technology content.
- `src/styles/` and `src/scripts/` contain ordered, focused source modules.
- `src/assets/` contains local images and care PDFs.
- `dist/` is generated output and must not be edited directly.

## Commands

- `npm run build` regenerates `dist/`.
- `npm run validate` checks the generated pages, links, anchors, assets, metadata, and security files.
- `npm test` runs structural and safety assertions.
- `npm run check` performs the complete local verification sequence.
- `npm run clean` removes generated output.

## Boundaries

The appointment form intentionally does not transmit or store information. Building or validating the site does not deploy it. Production form delivery, analytics, content approvals, and hosting remain separate work.
