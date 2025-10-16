# PocketPass

<p align="center">
   <img src="https://raw.githubusercontent.com/aryakvn/pocketpass/refs/heads/main/frontend/src/assets/logo.png" />
</p>

An open-source, self-hosted password manager using PocketBase as a backend with password sharing. Work-in-progress.

> NOTE: This project is under active development. Use at your own risk. The code and deployment process have not been security-audited — do not store highly sensitive data in production until you have reviewed and hardened the deployment.

## Table of contents
- About
- Features (planned / implemented)
- Architecture
- Requirements
- Quick start (local, dev)
- Example Docker Compose (recommended for self-hosting)
- Configuration
- Usage
- Development
- Security considerations
- Roadmap
- Contributing
- License

## About
PocketPass is a lightweight self-hosted password manager built as a single-page application (Vue) with PocketBase as an easy-to-run backend. The goal is to provide a simple, shareable vault for small teams or personal use without relying on third-party password services.

## Features (work-in-progress)
- Create and manage password entries (title, username, password, notes, url tags)
- Share selected entries with other users
- User registration and authentication (via PocketBase)
- Minimal, responsive Vue web client
- Local-first / self-hosting friendly (PocketBase binary or Docker)

Planned:
- End-to-end encryption of stored secrets (client-side encryption)
- Fine-grained sharing controls and roles
- Audit logs, locking, and 2FA options
- Backup/restore tools

## Architecture
- Frontend: Vue.js (SPA)
- Backend: PocketBase (embedded Go binary, provides REST and realtime API, file storage, auth)
- Storage: PocketBase's built-in DB (BoltDB) or file storage depending on config
- Deployment options: plain PocketBase binary + static frontend, or Docker Compose for both services

## Requirements
- Node.js 18+ (for running the frontend dev server / building static assets)
- npm or yarn
- PocketBase (binary) or Docker
- Optional: nginx or other reverse proxy for TLS in production

## Quick start — local development

1. Clone the repo
   git clone https://github.com/aryakvn/pocketpass.git
   cd pocketpass

2. Install frontend dependencies
   npm install
   (or yarn)

3. Start PocketBase
   - Option A: Download the PocketBase binary (https://pocketbase.io/) and run:
     ./pocketbase serve
     By default PocketBase runs on http://127.0.0.1:8090

   - Option B: Use Docker (see Docker Compose example below).

4. Configure frontend to point at your PocketBase instance
   - If this repo uses Vite, create a .env file with:
     VITE_API_BASE_URL=http://127.0.0.1:8090
   - If this repo uses Vue CLI, set:
     VUE_APP_API_BASE_URL=http://127.0.0.1:8090

5. Start frontend dev server
   npm run dev
   (or npm run serve depending on the template)

6. Open the app in the browser (usually http://localhost:5173 or the port printed by the dev server) and register/login via the PocketBase auth endpoints.

## Example Docker Compose
Use this as a starting point. Adapt volumes, environment variables and ports to your needs.

version: "3.8"
services:
  pocketbase:
    image: ghcr.io/pocketbase/pocketbase:latest
    container_name: pocketbase
    restart: unless-stopped
    volumes:
      - ./pb_data:/pb_data
    working_dir: /pb_data
    command: ["serve", "--http=0.0.0.0:8090"]
    ports:
      - "8090:8090"
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pocketpass-frontend
    restart: unless-stopped
    environment:
      - VITE_API_BASE_URL=http://pocketbase:8090
    ports:
      - "3000:3000" # or build and serve static assets with nginx

Notes:
- For production, build the frontend to static files and serve with nginx or a static host.
- Use a reverse proxy (nginx / Traefik) to add TLS (Let's Encrypt) in front of both services.

## Configuration
Common environment variables the frontend may look for:
- VITE_API_BASE_URL or VUE_APP_API_BASE_URL — base URL of the PocketBase API (e.g. https://password.example.com)
- NODE_ENV — development / production

PocketBase configuration:
- Use the PocketBase admin UI (http://localhost:8090/_/) to create collections and fields required by the app if not seeded.
- Secure the admin UI with a strong admin password and restrict access via network rules / reverse proxy for production.

## Usage
- Register an account (or create users via the PocketBase admin panel).
- Create password entries and fill fields (title, username, password, notes).
- Share a password entry with another user via the app's sharing UI (work-in-progress; check app for details).
- Export/backup your PocketBase data directory regularly (the pb_data folder in the example Docker Compose).

## Development
- Follow Quick start to run the frontend in hot-reload mode.
- Lint, format, and test (if tests are present) before creating PRs.
- Add meaningful commit messages and describe any breaking changes in the PR description.

Helpful commands (adjust to repo scripts):
- npm run dev — run dev server
- npm run build — build production static assets
- npm run preview — locally preview built static files (if using Vite)
- npm run lint — run linters (if configured)

## Security considerations
- This repository is a work-in-progress and has not been security audited.
- Do not expose the PocketBase admin interface publicly without strong protections.
- Always serve the application over HTTPS in production.
- Consider adding client-side end-to-end encryption for secrets before storing them in PocketBase.
- Rotate keys and admin credentials if you suspect compromise.
- Back up your pb_data directory and store copies in a secure location.

## Roadmap
Short term:
- Stabilize sharing workflow
- Add client-side encryption option
- Improve UI/UX and validation

Medium term:
- Add RBAC and team features
- Add audit logs and export/import tools
- Add automated tests and CI

Long term:
- Formal security review & third-party audit
- Official Docker images & deployment guides
- Mobile-friendly client or native apps

## Contributing
Contributions are welcome!
- Open an issue to discuss large changes or features.
- Fork the repo and create feature branches for PRs.
- Follow standard git flow and include tests where appropriate.

Please include:
- A clear description of the change
- Steps to reproduce any bugs and screenshots if relevant
- Any security implications of the change

## License
Add a LICENSE file to the repository. Consider MIT for permissive open-source licensing unless you prefer a different license.
