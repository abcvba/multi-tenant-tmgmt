# Tempo — Multi-Tenant Task Management System

A production-ready, multi-tenant task management platform with role-based access control, JWT authentication, Google OAuth, and full audit logging.

---

## Features

- **Multi-tenancy** — strict data isolation per organization
- **RBAC** — Admin can manage all tasks; Members can only manage their own
- **JWT Auth** — 7-day tokens, auto-refresh
- **Google OAuth** — one-click sign-in (configurable)
- **Task Management** — create, update, delete with priority, due dates, assignees
- **Kanban + List views** — Dashboard Kanban board + Tasks table with filters
- **Team Management** — invite members, change roles, remove users (admin only)
- **Audit Log** — full history of task events (admin only)
- **Containerized** — Docker + Docker Compose with proper health checks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router v6 |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma (PostgreSQL) |
| Auth | JWT + Passport.js (Google OAuth 2.0) |
| Container | Docker, Docker Compose |

---

## Quick Start

### With Docker (recommended)

```bash
# 1. Clone and enter project
cd tempo

# 2. Copy env file and configure
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# 3. Start everything
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- API health: http://localhost:5001/health

### Local Development

**Prerequisites:** Node.js 20+, PostgreSQL 15+

```bash
# Backend
cd backend
cp .env.example .env     # Fill in DATABASE_URL etc.
npm install
npx prisma migrate deploy
npm run dev              # Starts on :5001

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev              # Starts on :5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `JWT_SECRET` | ✓ | Secret for signing JWTs |
| `SESSION_SECRET` | ✓ | Secret for OAuth session |
| `FRONTEND_URL` | ✓ | Frontend origin for CORS |
| `BACKEND_URL` | ✓ | Backend public URL (OAuth callback) |
| `GOOGLE_CLIENT_ID` | ✗ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✗ | Google OAuth client secret |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✗ | Backend URL (empty = use Vite proxy) |
| `VITE_GOOGLE_CLIENT_ID` | ✗ | Shows Google button if set |

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add Authorized redirect URI: `http://localhost:5001/api/auth/google/callback`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`
5. Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` (shows the Google button)

> The app works fully with email/password auth without Google credentials.

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register + create org |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/auth/google` | — | Start Google OAuth |
| GET | `/api/auth/google/callback` | — | OAuth callback |

### Tasks
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | JWT | List tasks (with filters) |
| POST | `/api/tasks` | JWT | Create task |
| PUT | `/api/tasks/:id` | JWT | Update task (RBAC) |
| DELETE | `/api/tasks/:id` | JWT | Delete task (RBAC) |
| GET | `/api/tasks/audit` | JWT/Admin | Audit log |

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | JWT | List org members |
| POST | `/api/users/invite` | JWT/Admin | Invite member |
| PATCH | `/api/users/:id/role` | JWT/Admin | Change role |
| DELETE | `/api/users/:id` | JWT/Admin | Remove member |

### Organizations
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/organizations/me` | JWT | Current org info |

---

## Data Model

```
Organization ─── User (role: ADMIN | MEMBER)
     └────────── Task (priority: LOW | MEDIUM | HIGH)
                   ├── creator: User
                   ├── assignee: User (optional)
                   └── AuditLog[]
```

---

## RBAC Rules

| Action | Admin | Member |
|---|---|---|
| View all org tasks | ✓ | ✓ |
| Create task | ✓ | ✓ |
| Edit any task | ✓ | Own only |
| Delete any task | ✓ | Own only |
| View audit log | ✓ | ✗ |
| Invite members | ✓ | ✗ |
| Change roles | ✓ | ✗ |
| Remove members | ✓ | ✗ |
