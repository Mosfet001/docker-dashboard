<div align="center">

# 🐳 Docker Dashboard

**A Hostinger-style web UI for managing Docker containers on Ubuntu**

![CI](https://github.com/YOUR_USERNAME/docker-dashboard/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Node](https://img.shields.io/badge/Node.js-20%2B-brightgreen)
![Docker](https://img.shields.io/badge/Docker-24%2B-blue)

[Quick start](#quick-start) · [Screenshots](#panels) · [Configuration](#environment-variables) · [Testing](#testing) · [HTTPS](#https--tls) · [Contributing](#contributing)

</div>

---

## What it is

A self-hosted Docker management dashboard with a clean, Hostinger-inspired UI. It connects directly to the Docker daemon via the Unix socket and lets you control every aspect of your containers from a browser — no CLI required.

Built with **React + Vite** on the front end and **Express + dockerode** on the back end, served through nginx and packaged as a Docker Compose stack.

---

## Panels

| Panel | What you can do |
|---|---|
| **Containers** | Start, stop, restart, remove · tail live logs · live CPU/mem meters |
| **Images** | Pull by name:tag · remove · prune unused · size visualisation |
| **Volumes** | Browse mount paths · create · remove · usage bars |
| **Networks** | Inspect subnets · create bridge networks · remove |
| **Terminal** | Embedded xterm.js shell · `docker exec` into any running container |
| **Alerts** | Live Docker event stream via SSE · severity filter · dismiss |
| **Compose editor** | Edit `docker-compose.yml` in-browser · download · quick commands |
| **Resource usage** | Live CPU + memory sparklines via WebSocket · per-container table |

---

## Quick start

> Requires Ubuntu 20.04, 22.04, 24.04 or 26.04. The installer handles everything else.

```bash
git clone https://github.com/Mosfet001/docker-dashboard.git
cd docker-dashboard
chmod +x install.sh
sudo ./install.sh
```

The installer will:

1. Install **Docker Engine + Compose plugin** (if not present)
2. Install **Node.js 20** via NodeSource (if not present)
3. Install **npm dependencies** for server and client
4. Generate a `.env` with a random 32-byte JWT secret
5. Build and start the full stack with `docker compose up -d --build`
6. Print the dashboard URL and default credentials

Default login: **admin / changeme** — change this in `.env` before going live.

---

## Dev mode (hot reload)

```bash
cp .env.example .env      # fill in your values
npm install               # root devDependencies (concurrently, playwright)

# Run both in parallel
npm run dev
```

- Client: http://localhost:5173
- API:    http://localhost:3001

Or run separately:

```bash
cd server && npm run dev   # Express with --watch
cd client && npm run dev   # Vite HMR
```

---

## Production (Docker Compose)

```bash
cp .env.example .env
# edit .env — at minimum set JWT_SECRET and DASHBOARD_PASS
docker compose up -d --build
```

Three containers start:

| Container | Role |
|---|---|
| `dd-server` | Express + dockerode API (port 3001, internal only) |
| `dd-client` | React app built by Vite, served by nginx (port 80, internal) |
| `dd-nginx`  | Reverse proxy — the only container with a public port |

---

## HTTPS / TLS

Point your domain's DNS A record at the server, then:

```bash
sudo bash scripts/setup-ssl.sh your-domain.com you@example.com
```

This runs Certbot in standalone mode, copies the certificates into `nginx/certs/`, patches the nginx config to enable the HTTPS server block, restarts nginx, and sets up a daily cron job for auto-renewal.

To configure manually, uncomment the `server { listen 443 ... }` block in `nginx/default.conf` and place `fullchain.pem` + `privkey.pem` in `nginx/certs/`.

---

## Environment variables

Copy `.env.example` to `.env` and set these:

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | **required** | Random string ≥ 32 chars. Generate with `openssl rand -hex 32` |
| `DASHBOARD_USER` | `admin` | Login username |
| `DASHBOARD_PASS` | `changeme` | Login password — **change before going live** |
| `JWT_EXPIRES` | `24h` | Token lifetime (`1h`, `7d`, etc.) |
| `HTTP_PORT` | `80` | Public port nginx binds on the host |
| `HTTPS_PORT` | `443` | Public HTTPS port |
| `PORT` | `3001` | Internal API port (not exposed outside the Docker network) |
| `CLIENT_ORIGIN` | `http://localhost` | CORS allowed origin |
| `DISABLE_AUTH` | `false` | Set `true` in local dev to skip the login screen |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Path to the Docker daemon socket |

---

## Project structure

```
docker-dashboard/
├── install.sh                        # One-shot Ubuntu installer
├── docker-compose.yml                # Production stack
├── playwright.config.js
├── .env.example
│
├── client/                           # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                   # Root — routing, auth, WebSocket
│   │   ├── components/
│   │   │   ├── Containers.jsx
│   │   │   ├── Images.jsx
│   │   │   ├── Volumes.jsx
│   │   │   ├── Networks.jsx
│   │   │   ├── Terminal.jsx          # xterm.js + docker exec WebSocket
│   │   │   ├── Alerts.jsx            # SSE Docker event stream
│   │   │   ├── ComposeEditor.jsx
│   │   │   ├── Resources.jsx         # Canvas sparklines
│   │   │   ├── Login.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── shared/               # PageHeader, MetricCard, StatusBadge, MeterBar
│   │   ├── hooks/
│   │   │   ├── useDockerStats.js     # WebSocket live stats
│   │   │   └── useDockerEvents.js    # SSE Docker events
│   │   └── utils/api.js              # Axios client + endpoint helpers
│   ├── Dockerfile                    # Multi-stage: Vite build → nginx
│   └── nginx-spa.conf                # SPA fallback for React Router
│
├── server/                           # Express + dockerode API
│   ├── index.js                      # Entry point, WS servers, error handler
│   ├── middleware/auth.js            # JWT guard
│   ├── routes/
│   │   ├── containers.js             # CRUD + start/stop/restart/logs/stats
│   │   ├── images.js                 # List/pull/remove/prune
│   │   ├── volumes.js                # List/create/remove/prune
│   │   ├── networks.js               # List/create/remove/prune
│   │   ├── system.js                 # info/df/version/prune/events (SSE)
│   │   └── auth.js                   # Login/logout/me
│   └── ws/
│       ├── stats.js                  # Streams CPU+mem for all containers
│       └── logs.js                   # Tails container logs over WebSocket
│
├── nginx/
│   ├── default.conf                  # Reverse proxy + WS + SSE + HTTPS block
│   └── certs/                        # TLS certs (gitignored)
│
├── scripts/
│   ├── setup-ssl.sh                  # Let's Encrypt + nginx HTTPS config
│   ├── update.sh                     # git pull + zero-downtime redeploy
│   └── uninstall.sh                  # Stop + remove containers and images
│
├── e2e/dashboard.spec.js             # Playwright end-to-end tests
└── .github/workflows/ci.yml         # CI: unit tests → build → Docker build → E2E
```

---

## API reference

All routes except `/api/health` and `/api/auth/login` require a `Bearer` token in the `Authorization` header.

### Containers

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/containers` | List all containers |
| `GET` | `/api/containers/:id/inspect` | Full container inspect |
| `GET` | `/api/containers/:id/logs?tail=100` | Last N log lines |
| `GET` | `/api/containers/:id/stats` | One-shot CPU/mem snapshot |
| `POST` | `/api/containers/:id/start` | Start container |
| `POST` | `/api/containers/:id/stop` | Stop container |
| `POST` | `/api/containers/:id/restart` | Restart container |
| `POST` | `/api/containers/:id/pause` | Pause container |
| `POST` | `/api/containers/:id/unpause` | Unpause container |
| `DELETE` | `/api/containers/:id?force=true` | Remove container |
| `POST` | `/api/containers` | Create + start a new container |

### Images

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/images` | List local images |
| `POST` | `/api/images/pull` | Pull image (`{ image: "nginx:alpine" }`) — streams NDJSON |
| `DELETE` | `/api/images/:id` | Remove image |
| `POST` | `/api/images/prune` | Remove dangling images |

### Volumes · Networks · System

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/volumes` | List volumes |
| `POST` | `/api/volumes` | Create volume |
| `DELETE` | `/api/volumes/:name` | Remove volume |
| `GET` | `/api/networks` | List networks |
| `POST` | `/api/networks` | Create network |
| `DELETE` | `/api/networks/:id` | Remove network |
| `GET` | `/api/system/info` | Docker daemon info |
| `GET` | `/api/system/df` | Disk usage |
| `POST` | `/api/system/prune` | Prune all unused resources |
| `GET` | `/api/system/events` | Docker events as SSE stream |

### WebSocket endpoints

| Path | Description |
|---|---|
| `ws://host/ws/stats` | Streams `{ id, name, cpu, mem, netRx, netTx }` for all running containers (~2 s interval) |
| `ws://host/ws/logs?id=<id>` | Tails container logs as `{ stream, ts, line }` JSON frames |
| `ws://host/ws/exec?id=<id>` | Bidirectional shell via `docker exec` — used by the Terminal panel |

---

## Testing

```bash
# Server unit tests (mocked dockerode — no Docker daemon needed)
cd server && npm test

# Client component tests (mocked API)
cd client && npm test

# Both at once
npm test

# E2E tests (requires the full stack running)
npm run docker:up
npx playwright test

# E2E against a remote server
E2E_BASE_URL=https://your-domain.com npx playwright test
```

The GitHub Actions CI pipeline runs all three test layers on every push and PR, plus a Docker image build check.

---

## Updating

```bash
bash scripts/update.sh
```

Pulls latest code, reinstalls deps, and rebuilds containers without downtime.

---

## Security

> The Docker socket (`/var/run/docker.sock`) grants root-level access to the host. Treat this dashboard with the same care as SSH access.

- Change `DASHBOARD_PASS` in `.env` before exposing the dashboard to any network
- Use HTTPS in production (`scripts/setup-ssl.sh`)
- The socket is mounted read-only in the Compose file (`ro`) — the API still needs write access for start/stop/exec; remove `:ro` if those operations fail on your setup
- For extra isolation, consider [Docker Socket Proxy](https://github.com/Tecnativa/docker-socket-proxy) to whitelist only the API calls the dashboard uses
- JWT tokens expire after 24 hours by default; configure with `JWT_EXPIRES`

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes and add tests
3. Run `npm test` and ensure all tests pass
4. Open a pull request — CI will run automatically

Bug reports and feature requests are welcome via GitHub Issues.

---

## License

MIT — see [LICENSE](LICENSE) for details.
