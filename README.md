# DisasterX — Emergency Response Network

DisasterX is a responsive command-center interface for community incident reporting, live situational awareness, emergency SOS coordination, and shelter capacity management.

## Product highlights

- Dark command-center UI with responsive navigation, theme toggle, map overlays, animated incident radar, and live status indicators.
- Home overview backed by database-driven activity and rescue metrics, recent reports, live alert events, and emergency contacts.
- SOS requests use browser GPS and are delivered to authenticated response administrators in real time.
- Multi-step incident reporting with severity, GPS coordinates, and up to four image uploads.
- Interactive Leaflet map with incident severity/type filters, search, shelter markers, and incident heat rings.
- Searchable shelter directory with occupancy indicators, facilities, contact links, and Google Maps directions.
- JWT sign-in and citizen/volunteer registration; administrator-only command center for reports, SOS dispatch, and shelter capacity.
- Hospital, shelter, and incident layers on the response map; English/Hindi interface toggle and a quick safety-guidance assistant.
- Express REST API, MongoDB/Mongoose persistence, Socket.IO alerts, input validation, centralized errors, and a cacheable offline app shell.

## Screenshots

Add competition/demo screenshots here:

| Home command center | Live response map | Admin dashboard |
|---|---|---|
| _Add screenshot_ | _Add screenshot_ | _Add screenshot_ |

## Requirements

- Node.js 20.19+ (required by Vite 8)
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Run locally

1. Configure the backend:

   ```powershell
   cd backend
   if (!(Test-Path .env)) { Copy-Item .env.example .env }
   npm.cmd install
   ```

   Set `MONGO_URI` and a private `JWT_SECRET` in `backend/.env`. The default database URL is `mongodb://127.0.0.1:27017/disasterx`.

2. Seed the demo data (10 incidents, 8 shelters, and admin/volunteer/citizen demo users):

   ```powershell
   npm.cmd run seed
   ```

   Demo accounts use password `DisasterX2026!`:

   - Admin: `admin@disasterx.org`
   - Volunteer: `volunteer@disasterx.org`
   - Citizen: `citizen@disasterx.org`

   The previous project admin login is retained for convenience: `admin@dms.com` / `password`.

   When `MONGO_URI` points to a local MongoDB server that is not running, development mode automatically starts a temporary MongoDB database and seeds these demo users. Data in this fallback is reset when the backend stops. For persistent data, start MongoDB locally or use MongoDB Atlas; a failed Atlas connection is reported rather than silently replaced with temporary storage.

3. Start the API in one terminal:

   ```powershell
   npm.cmd run dev
   ```

   API and Socket.IO are available at `http://127.0.0.1:5000`.

4. Configure and start the frontend in another terminal:

   ```powershell
   cd ..\frontend
   if (!(Test-Path .env)) { Copy-Item .env.example .env }
   npm.cmd install
   npm.cmd run dev -- --host 127.0.0.1
   ```

   Open `http://127.0.0.1:5173`.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/disasters`, `POST /api/disasters`, `PUT/DELETE /api/disasters/:id`
- `GET/POST /api/sos`, `PUT /api/sos/:id/status`
- `GET/POST /api/shelters`, `PUT/DELETE /api/shelters/:id`
- `GET/POST /api/hospitals`, `DELETE /api/hospitals/:id`
- `GET /api/stats`, `GET /api/health`

Incident reports accept `multipart/form-data` with optional `images` (up to four images, 8 MB each). Realtime Socket.IO events include `disaster:new`, `disaster:updated`, `sos:new`, and `sos:updated`.

## Notes

The browser must grant location access before it can send an SOS. Demo administrators are created only by the seed script; public registration cannot grant admin privileges. Uploaded evidence is stored in `backend/uploads` and served through `/uploads`.
