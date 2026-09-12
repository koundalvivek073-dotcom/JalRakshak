# JalRakshak water-test API

## Setup

1. Copy `.env.example` to `.env`.
2. Set `SUPABASE_SERVICE_ROLE_KEY` to the server-only Supabase service-role key. Never expose it as a `VITE_` variable or commit `.env`.
3. Run `supabase-schema.sql` in the Supabase SQL editor.
4. Install dependencies and start the API server:

```powershell
npm.cmd install
npm.cmd run api
```

The API listens on `http://localhost:5190` by default.

## Frontend API URL

For local development, leave `VITE_API_URL` empty. Vite proxies `/api` to the local API server.
For production, set `VITE_API_URL` to the deployed Express base URL, for example:

```env
VITE_API_URL=https://your-live-api.onrender.com
```

The Supabase service-role key must remain server-only. Do not prefix it with `VITE_`.

## POST `/api/tests`

```json
{
  "location": { "lat": 13.0281, "lng": 77.6403, "name": "Kalyan Nagar community well" },
  "ph": 7.4,
  "fluoride": 0.8,
  "nitrates": 29,
  "hardness": 340
}
```

The server calculates `status` and `safety_score` before inserting the row. Fluoride above `1.5 mg/L` or pH outside `6.5-8.5` is `contaminated`. Nitrates above `45 mg/L` or hardness above `600 mg/L` is `caution` when no contaminated threshold is crossed.

## GET `/api/tests`

Returns all rows from `water_tests`, newest first, ready for map pins.
