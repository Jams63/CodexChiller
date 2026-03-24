# CodexChiller

A lightweight browser app to draw a site boundary and place chiller units with dimensions, then export a clean drawing for sharing.

## What this solves

Instead of sketching on paper and waiting for CAD conversion, this app lets your team:

- Draw the installation area boundary.
- Place chiller units with exact width/depth values.
- Label each unit and show dimensions directly on drawing.
- Export as SVG (for editing), JSON (for reuse), and PDF (via Print).

## Run locally

Open `index.html` in any modern browser. A demo preview (similar to your hand sketch with three 8m × 3m units) loads automatically.

## Workflow

1. Click in the canvas to place boundary points.
2. Press **Close Boundary** to complete the outline.
3. Enter chiller dimensions and coordinates, then press **Add Unit**.
4. Adjust scale if needed.
5. Optional: click **Load Demo Preview** any time to reset to the sample layout.
6. Export:
   - **Download SVG** for vector drawing.
   - **Print / Save PDF** to create the final PDF plan.
   - **Download JSON** to save and reload the layout.


## Quick preview

Open `preview.svg` to see a static sample output based on your sketch.
