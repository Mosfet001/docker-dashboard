# 🐳 Docker Dashboard

A Hostinger-style interactive web dashboard for managing Docker containers on Ubuntu. Built with React + Vite (frontend) and Express + dockerode (backend).

![CI](https://github.com/YOUR_USERNAME/docker-dashboard/actions/workflows/ci.yml/badge.svg)

## Features

- **Containers** — list, start, stop, restart, remove, tail live logs
- **Images** — pull, inspect, remove, prune unused
- **Volumes** — browse, create, remove named volumes
- **Networks** — list, create, remove Docker networks
- **Terminal** — embedded xterm.js shell with `docker exec` support
- **Alerts** — live Docker event stream (SSE) with severity classification
- **Compose editor** — edit, download, and deploy `docker-compose.yml`
- **Resource usage** — live CPU/memory sparklines via WebSocket
- **Auth** — JWT login, configurable credentials via `.env`
- **HTTPS** — one-command Let's Encrypt setup

## Quick start (Ubuntu)

```bash
git clone https://github.com/YOUR_USERNAME/docker-dashboard.git
cd docker-dashboard
chmod +x install.sh
sudo ./install.sh
```

The installer will:
1. Install Docker Engine + Compose plugin
2. Install Node.js 20
3. Install npm dependencies
4. Generate a `.env` with a random JWT secret
5. Build and start the full stack
6. Print the dashboard URL

## Manual start (dev mode)

```bash
cp .env.example .env   # fill in your values
npm install            # install root deps

# Terminal 1 — API server (hot reload)
cd server && npm run dev

# Terminal 2 — Vite dev server
cd client && npm run dev
```

Open http://localhost:5173

## Production (Docker Compose)

```bash
cp .env.example .env   # fill in values
docker compose up -d --build
```

Open http://your-server-ip

## HTTPS / TLS

Point your domain's A record at the server, then:

```bash
sudo bash scripts/setup-ssl.sh your-domain.com you@example.com
```

## Testing

```bash
# Unit tests (server)
cd server && npm test

# Unit tests (client)
cd client && npm test

# E2E tests (requires running stack)
npm run docker:up
npx playwright test
```

## Environment variables

| Variable          | Default     | Description                                |
|-------------------|-------------|--------------------------------------------|
| `JWT_SECRET`      | **required**| Random string ≥ 32 chars (`openssl rand -hex 32`) |
| `DASHBOARD_USER`  | `admin`     | Login username                             |
| `DASHBOARD_PASS`  | `changeme`  | Login password — **change this**           |
| `JWT_EXPIRES`     | `24h`       | Token lifetime                             |
| `PORT`            | `3001`      | Internal API port                          |
| `HTTP_PORT`       | `80`        | Public HTTP port                           |
| `CLIENT_ORIGIN`   | `http://localhost` | CORS allowed origin               |
| `DISABLE_AUTH`    | `false`     | Set `true` for local dev (no login)        |

## Project structure

```
docker-dashboard/
├── client/          React + Vite frontend
│   └── src/
│       ├── components/   Page panels + shared UI
│       ├── hooks/        useDockerStats, useDockerEvents
│       └── utils/api.js  Axios client
├── server/          Express + dockerode API
│   ├── routes/      containers, images, volumes, networks, system, auth
│   ├── ws/          stats and logs WebSocket streamers
│   └── middleware/  JWT auth
├── nginx/           Reverse proxy config + TLS certs
├── scripts/         setup-ssl.sh, update.sh, uninstall.sh
├── e2e/             Playwright end-to-end tests
├── docker-compose.yml
└── install.sh       One-shot installer
```

## Security notes

- The Docker socket (`/var/run/docker.sock`) gives the API root-level access to the host. Keep the dashboard behind authentication and avoid exposing port 3001 directly.
- Change `DASHBOARD_PASS` before exposing to the internet.
- Use HTTPS in production (`scripts/setup-ssl.sh`).
- Consider [Docker Socket Proxy](https://github.com/Tecnativa/docker-socket-proxy) for read-only socket access.

## License

MIT
