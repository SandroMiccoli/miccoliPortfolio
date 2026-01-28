# Experiments Directory

This directory contains the runtime code for all lab experiments. Each experiment should have its own folder named after its slug.

## Structure

```
experiments/
├── experiment-slug/
│   ├── index.html      # Main HTML file
│   ├── main.js         # JavaScript code
│   ├── style.css       # Styles
│   └── thumb.png       # Thumbnail image (required)
```

## Thumbnail Requirements

Each experiment must have a thumbnail image named one of:
- `thumb.png`
- `thumb.jpg`
- `thumb.gif`
- `thumb.webm`

The thumbnail should be:
- At least 400x400px for best quality
- Representative of the experiment
- Optimized for web (compressed)

## Notes

- Experiments run standalone but are embedded in the lab site
- Use relative paths for assets within the experiment folder
- External libraries should be loaded via CDN in index.html
- No bundler required - vanilla JS preferred
