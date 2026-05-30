# HugoPanel

Browser-based CMS for [Hugo](https://gohugo.io/) static sites. Connect a GitHub, GitLab, or Gitea repository, edit Markdown posts in the browser, and push real Git commits — no terminal required.

**Repository:** [github.com/glitchidea/hugopanel](https://github.com/glitchidea/hugopanel)

![License](https://img.shields.io/badge/license-MIT-blue)
![Docker](https://img.shields.io/badge/docker--compose-ready-blue)
![Stack](https://img.shields.io/badge/stack-Django%20%7C%20React%20%7C%20PostgreSQL%20%7C%20Redis-informational)

---

## Features

- **Multi-repository** — Connect multiple Hugo sites from one panel
- **Git-native workflow** — Create, update, and delete posts with automatic commit + push
- **Hugo front matter** — YAML, TOML, and JSON front matter support
- **Markdown editor** — CodeMirror 6 with syntax highlighting
- **Per-user settings** — Git author, commit template, default branch, and content path (no `.env` edit needed for daily use)
- **Encrypted tokens** — Repository access tokens stored with Fernet encryption
- **Async operations** — Clone and sync run in the background via Celery
- **Docker-first** — Full stack with a single command

---

## Quick start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2

### 1. Clone

```bash
git clone https://github.com/glitchidea/hugopanel.git
cd hugopanel
```

### 2. Configure environment

```bash
cp .env.example .env
```

Generate an encryption key for repository tokens:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Paste the output into `.env` as `ENCRYPTION_KEY`. Update at minimum:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret (use a long random string in production) |
| `ENCRYPTION_KEY` | Fernet key from the command above |
| `POSTGRES_PASSWORD` | Database password |
| `DATABASE_URL` | Must match Postgres credentials |
| `CORS_ALLOWED_ORIGINS` | Frontend URL, e.g. `http://localhost:3003` |

> **Note:** Git author name, email, commit template, default branch, and content path can be configured per user under **Settings** in the app. `.env` values are only used as server-wide fallbacks.

### 3. Run

**Production (recommended):**

```bash
docker compose up -d --build
```

**Development (hot reload):**

```bash
docker compose -f docker-compose.dev.yml up --build
```

### 4. Open the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3003 |
| API | http://localhost:8000/api/v1 |
| Swagger UI | http://localhost:8000/api/v1/schema/swagger-ui/ |
| Django Admin | http://localhost:8000/admin/ |

Register an account, go to **Repositories → Connect**, and link your Hugo repo with an HTTPS personal access token.

---

## Connect a Hugo repository

1. Create a **Personal Access Token** on GitHub/GitLab/Gitea with `repo` (read/write) scope.
2. In HugoPanel: **Repositories → Connect**.
3. Fill in:
   - **Repository:** `owner/repo` (e.g. `glitchidea/glitch`)
   - **Clone URL:** `https://github.com/owner/repo.git`
   - **Content path:** Hugo content directory (e.g. `content/blog/`)
   - **Access token:** your PAT
4. After connect, Celery clones the repo in the background. Posts appear under **Posts** once cloning finishes.

---

## Project structure

```
hugopanel/
├── docker-compose.yml          # Production stack
├── docker-compose.dev.yml      # Dev stack (hot reload)
├── .env.example
│
├── backend/                    # Django 5 + DRF
│   ├── hugopanel/
│   │   └── settings/           # base / development / production
│   └── apps/
│       ├── accounts/           # Auth, JWT, user settings
│       ├── repositories/       # Git clone, sync, encryption
│       └── posts/              # Hugo content CRUD
│
└── frontend/                   # React 18 + Vite + TypeScript
    └── src/
        ├── pages/              # Dashboard, Repos, Posts, Editor, Settings
        ├── components/         # Layout shell, sidebar
        ├── hooks/              # React Query
        ├── services/           # API client
        └── stores/             # Zustand (auth, repo)
```

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Django 5, Django REST Framework, SimpleJWT |
| Task queue | Celery + Redis |
| Database | PostgreSQL 16 |
| Git | GitPython |
| Frontend | React 18, TypeScript, Vite, TanStack Query, Zustand |
| Editor | CodeMirror 6 |
| Deploy | Docker, Nginx, Gunicorn |

---

## API overview

```
POST   /api/v1/auth/register/
POST   /api/v1/auth/login/
POST   /api/v1/auth/refresh/
GET    /api/v1/auth/me/
PATCH  /api/v1/auth/me/

GET    /api/v1/repos/
POST   /api/v1/repos/
POST   /api/v1/repos/{id}/sync/
GET    /api/v1/repos/{id}/tree/

GET    /api/v1/repos/{id}/posts/
POST   /api/v1/repos/{id}/posts/
GET    /api/v1/repos/{id}/posts/{path}/
PUT    /api/v1/repos/{id}/posts/{path}/
DELETE /api/v1/repos/{id}/posts/{path}/
```

Interactive documentation: http://localhost:8000/api/v1/schema/swagger-ui/

---

## Local development (without Docker)

**Backend:**

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env   # configure DATABASE_URL, REDIS_URL, etc.
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

**Celery worker** (required for clone/sync):

```bash
cd backend
celery -A hugopanel worker -l info
```

---

## Security

- Repository access tokens are encrypted at rest (Fernet / AES-128).
- JWT access tokens expire in 15 minutes; refresh tokens in 7 days.
- CORS is restricted to configured origins.
- Rate limiting: 100 requests/minute per authenticated user.
- Never commit `.env` or personal access tokens to Git.

---

## License

[MIT](LICENSE) © [Glitch İdea](https://github.com/glitchidea)
