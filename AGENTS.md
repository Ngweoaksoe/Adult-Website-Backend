# AGENTS.md — working notes for this repository

## What this repo is
Backend-only API: Express 5 + Mongoose (MongoDB). No frontend exists in the repo, so the
preview at `http://localhost:3000/` shows the API itself — `GET /` returns a small HTML
overview page (added in `server.js`) that lists the endpoints and shows the live video/views
counts read from MongoDB. Endpoints under `/api/*` answer with JSON; uploaded media is served
from `/uploads/<file>`.

## Run it in the sandbox
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
- Host port **3000** → container port **5000** (the API's `PORT`).
- `api`  — `node:22-alpine`, source bind-mounted at `/app`, dev command
  `nodemon --legacy-watch … server.js` (see the reload note below).
- `mongo` — `mongo:7`, data in the named volume `mongo_data`.
- Dependencies: the committed `node_modules` was built on Windows, so a Docker volume
  (`xmonsters_api_node_modules`) shadows it and `npm ci` installs from `package-lock.json` on
  first start. The repo's own `node_modules` is never touched.
- **Live reload needs the polling watcher.** `node --watch` went deaf on this bind mount after a
  file was replaced by rename and never recovered, so `nodemon` was added as a devDependency and
  runs with `--legacy-watch` (polling). `npm start` / the Dockerfile still use plain
  `node server.js`; nodemon is only used by `docker-compose.base44.yml`.
- The repo's own `docker-compose.yml` / `Dockerfile` build a production image (`COPY . .`);
  they are intentionally not used here because edits would not show up.

## Non-obvious findings
- **The committed `.env` contains live credentials**: a MongoDB **Atlas** URI plus
  `CLOUDINARY_*` keys, and `JWT_SECRET`. `dotenv` (server.js) does not override variables that
  are already set, so the compose `MONGO_URI=mongodb://mongo:27017/xmonsters` wins and the
  sandbox always writes to the **local** MongoDB — never to the user's Atlas database.
  `JWT_SECRET` comes from the committed `.env`; the app boots with no external credentials, so
  `.base44/environment.json` declares no secrets.
- The `cloudinary` / `multer-storage-cloudinary` packages are installed but unused: uploads go
  to local disk through `multer.diskStorage` into `./uploads` (host bind mount).
- Uploaded file URLs are built as `req.protocol + '://' + req.get('host')` (`routes/videos.js`),
  so behind the preview proxy they point at the proxied host over `http`. Local-disk playback
  via `/uploads/<file>` works fine; only the stored URL of newly uploaded files is affected.
- No host/origin allowlists to adjust: `cors()` is permissive and Express does not check the
  `Host` header, so `BASE44_PREVIEW_MODE` is not needed and no sandbox-only code override exists.
- `npm test` is a stub (`exit 1`); there is no test suite to run.

## How to verify
```bash
curl -s http://localhost:3000/                     # HTML overview page, HTTP 200
curl -s http://localhost:3000/api/videos           # {"videos":[],...}
curl -s http://localhost:3000/api/videos/stats/admin
curl -sI http://localhost:3000/uploads/<file>      # static media from ./uploads
```
Full flow (works against the local MongoDB): `POST /api/auth/register` → `POST /api/auth/login`
→ `POST /api/videos` (multipart `thumbnail` + `video`; writes new files into `./uploads`) →
`PUT /api/videos/:id/like`, `POST /api/videos/:id/comment` → `DELETE /api/videos/:id`.
Clean up any files a check uploads to `./uploads` and any test user/document you create —
`./uploads` is committed to git.
