# Calendar Planner

React and Vite application for calendar planning, activity tracking, approvals, analytics, reports, and role-based dashboards backed by Supabase.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Setup

1. Install dependencies:

```powershell
npm install
```

2. Create your environment file:

```powershell
Copy-Item .env.example .env
```

3. Start the development server:

```powershell
npm run dev
```

The app runs on `http://localhost:5173`.

## Scripts

- `npm run dev` starts the Vite development server
- `npm run build` creates a production build in `dist/`
- `npm run preview` serves the production build locally
- `npm run test` runs the Playwright test suite

## Deployment

Build the production bundle with:

```powershell
npm run build
```

The generated static files are written to `dist/` and can be deployed to Netlify, Vercel, Cloudflare Pages, Firebase Hosting, or any static host.

## Environment variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_GROQ_API_KEY`

The project currently includes fallback Supabase values for local startup, but using `.env` is the recommended deployment setup.

## Notes

- `npm run lint` still reports a large number of existing code-quality issues in the app source. That does not block the production build, but it is worth a dedicated cleanup pass later.
- Playwright tests may require browser installation before first use:

```powershell
npx playwright install
```
