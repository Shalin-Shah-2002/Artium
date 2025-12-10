# Artium Frontend

This Vite-powered React app delivers the Artium writing studio experience. It provides:

- Gemini-assisted article generation tuned for Medium-format Markdown
- A split-view editor with section-level regeneration and inline Markdown rendering
- Authenticated draft management, including delete/update flows
- A “Copy for Medium” action that writes both HTML and Markdown to the clipboard

## Commands

```bash
# install deps
npm install

# run dev server (http://localhost:3000)
npm run dev

# build for production
npm run build

# lint
npm run lint
```

## Environment

The frontend expects the FastAPI backend to run on `http://localhost:8000` and relies on the Vite dev server proxy for `/api` requests during local development.
