# AI Exterior Visualizer

Preview siding, roofing, trim, and door materials on a photo of a house. The studio works without secrets. Add a Gemini API key when you want the model to analyze the photo and repaint it.

![Sample house used by the visualizer](public/sample-house.jpg)

## Preview mode

The public demo does not ship an API key.

- Upload a photo, or use the bundled sample house, and browse the material catalog.
- Save a key from [Google AI Studio](https://aistudio.google.com/app/apikey) in the page. It is stored in `sessionStorage` for that browser tab and sent only to Google.
- Choose **Analyze this home**, then **Visualize my home**.

If a mask fails, the rest of the analysis still finishes and that surface is left unchanged. If a catalog texture cannot be fetched, visualization falls back to the selected color.

## Requirements

- Node.js 22.12 or newer
- A Gemini API key only if you want image analysis and rendering

## Local setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Environment variables

Copy `.env.example` to `.env.local` if you want a key available at build time:

```env
VITE_GEMINI_API_KEY=
```

`VITE_GEMINI_API_KEY` is optional. Vite inlines it into the static JavaScript, so anyone who can open the site can read it. Leave it empty for a public demo and paste a key in the UI instead. Do not commit `.env` or `.env.local`.

A key saved in the page overrides the build-time value for that tab.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run typecheck` | TypeScript for the app and `vite.config.ts` |
| `npm run build` | Typecheck, then write `dist/` |
| `npm run preview` | Serve the production build |

## Deploying a static demo

The app is a static Vite build. AI calls happen in the browser, so hosting does not need a server secret.

### GitHub Pages

`.github/workflows/pages.yml` publishes `dist/` on pushes to `main`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The workflow intentionally does not set `VITE_GEMINI_API_KEY`.

Pull requests also run `.github/workflows/ci.yml`, which typechecks and builds.

### Vercel

`vercel.json` selects the Vite framework and `dist` output. Leave `VITE_GEMINI_API_KEY` unset in the project environment for a public preview. If you set it, treat it as public.

## Stack

- React 19 and TypeScript 7
- Vite 8 with `@vitejs/plugin-react`
- Tailwind CSS 4, compiled by `@tailwindcss/vite` (no CDN stylesheet)
- `@google/genai`, using `gemini-nano-banana-2.1` for masks and edits

`gemini-2.5-flash-image-preview` was shut down on January 15, 2026. The replacement model id lives in `constants.ts`.

## Project layout

```
App.tsx                 # Screen flow, preview mode, cancellation
components/             # Studio, upload, results, mask inspector
services/geminiService.ts
services/apiKey.ts
products.json           # Material catalog, imported at build time
public/sample-house.jpg # Bundled sample photo
```

Edit `products.json` to change the catalog. Each option needs `value`, `label`, `colors`, and `imageUrls`. Catalog photos are requested with no referrer, because Imgur answers hotlinked requests with 403. Broken texture URLs show a fallback in the studio and, during visualization, fall back to a color change.

## Material catalog shape

```json
{
  "siding": [
    {
      "label": "Siding Styles",
      "options": [
        {
          "value": "Grey Shake Siding",
          "label": "Grey Shake",
          "colors": ["Ash Grey", "Stone Grey"],
          "imageUrls": ["https://example.com/texture.jpg"]
        }
      ]
    }
  ]
}
```

## License

MIT. See `LICENSE`.
