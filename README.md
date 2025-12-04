# Financial Analytics Dashboard

### Author: Breno Lopes Mafra, Computer Programmer and Analyst

### Project Description
Full-stack finance dashboard with auth (login/register/guest), account/transaction tracking, KPIs, charts, and settings. Frontend (React/Vite) calls a Node/Express API backed by SQLite; guest users get seeded data and are auto-purged after 24h.

## Visit the application:
https://financial-analytics-dashboard-neon.vercel.app/

### Demo video
<p align="center">
  <a href="https://youtu.be/U5P4nF6hltQ" target="_blank">
    <img alt="Watch the project walkthrough" src="https://img.youtube.com/vi/U5P4nF6hltQ/hqdefault.jpg" width="480" />
  </a>
</p>

### Tech stack
- Frontend: React 18, Vite, TypeScript, Tailwind, Zustand, Axios, Recharts.
- Backend: Node.js, Express, better-sqlite3, JWT, Zod, nanoid, cron cleanup.
- Database: SQLite (users/accounts/transactions/investments; protected checking).
- Tooling/Infra: Vercel (frontend), Railway (API), Postman collection in repo root.

### Links
- GitHub repo: https://github.com/BrenoMafra13/financial-analytics-dashboard
- Postman collection: https://www.postman.com/comp3095-f202... (import and set `baseUrl` + `token`)

### Application flow
- User/Postman → Frontend (React/Vite/Zustand/Axios) → Backend (API/Node/Express/JWT/Zod).
- Backend → SQLite for queries/aggregates → JSON responses to frontend.
- Frontend renders KPIs, charts, and tables; cron job deletes guest users older than 24h.
- Arrows/requests: HTTP with Bearer token; data rows to/from DB; business logic runs in the API.

### Quick start (local)
1) Install deps: `npm install`
2) Run API (inside `/api` if applicable): `npm install && npm run start` (ensure `PORT` matches `VITE_API_URL`)
3) Run frontend: set `.env` `VITE_API_URL=http://localhost:4000` (or your Railway URL), then `npm run dev`
4) Open the dev URL (usually http://localhost:5173), login/register, or use Guest.
