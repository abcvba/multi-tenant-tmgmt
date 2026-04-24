# Tempo: Multi-Tenant Task Management 🚀

Hey there! Welcome to **Tempo**, a fully-featured, production-ready task management system I put together. If you're looking for a platform that securely handles multiple organizations, manages roles, and keeps a watchful eye on everything via audit logs, you've come to the right place. 

I built this with a modern, vibrant UI (no boring, generic admin panels here) and a rock-solid backend. It's fully containerized, so getting it running is a breeze.

---

## ✨ What makes Tempo special?

- **Real Multi-Tenancy:** Each workspace (organization) is strictly isolated. You only see your team's stuff. Period.
- **Role-Based Access Control (RBAC):** 
  - *Admins* have the keys to the kingdom (they can manage the team, view audit logs, and edit any task). 
  - *Members* can view the board and manage *their own* tasks, but they can't mess with others' work.
- **Bulletproof Auth:** Secure JWT-based authentication with auto-refresh, plus Google OAuth baked right in if you want to use it!
- **Rich Task Management:** Kanban boards, list views, priority levels, due dates, and assignees. It has everything you need to track work effectively.
- **Audit Logging:** Every single task creation, update, and deletion is logged. Admins can see exactly who did what, and when.
- **Ready for Production:** It uses Docker and Docker Compose to spin up the database, backend, and frontend together seamlessly. 

---

## 🛠️ The Tech Stack

Here's what's powering the app under the hood:

- **Frontend:** React 18, TypeScript, Vite, and React Router v6
- **Backend:** Node.js, Express, and TypeScript
- **Database / ORM:** PostgreSQL managed via Prisma
- **Authentication:** JWT + Passport.js (for the Google OAuth goodness)
- **Deployment:** Docker & Docker Compose

---

## 🏃‍♂️ How to run it locally

The easiest way to get this running is using Docker. It handles the database, migrations, and services for you.

### Quick Start (with Docker)

1. Clone this repository and `cd` into it.
2. Set up your environment variables by copying the example file:
   ```bash
   cp backend/.env.example backend/.env
   ```
   *(Feel free to tweak the secrets in the `.env` file if you want!)*
3. Spin everything up:
   ```bash
   docker compose up --build
   ```

That's it! 
- The frontend will be live at: [http://localhost:5173](http://localhost:5173)
- The backend API runs on: `http://localhost:5001`

### Running without Docker

Prefer to run the Node servers directly? No problem. Just make sure you have Node.js 20+ and a local PostgreSQL instance running.

**Start the Backend:**
```bash
cd backend
cp .env.example .env     # Make sure to update your DATABASE_URL here!
npm install
npx prisma migrate deploy
npm run dev              # Server starts on port 5001
```

**Start the Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # Frontend starts on port 5173
```

---

## 🔐 Setting up Google OAuth (Optional)

Tempo works perfectly fine with standard email/password authentication. But if you want that sweet "Continue with Google" button, here's how to enable it:

1. Head over to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Add `http://localhost:5001/api/auth/google/callback` to your Authorized redirect URIs.
4. Grab your Client ID and Client Secret. 
5. Add them to your `backend/.env` file:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_secret_here
   ```
6. Add the Client ID to your `frontend/.env` file so the UI knows to show the button:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   ```
7. Restart your dev servers or Docker containers, and you're good to go!

---

## 📚 API Quick Reference

If you want to poke around the API directly, here are the main endpoints. All protected routes require a `Bearer <token>` header.

**Auth & Users**
- `POST /api/auth/register` - Create a new org and admin user
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get your profile
- `GET /api/users` - List everyone in your org
- `POST /api/users/invite` - (Admin only) Invite a teammate

**Tasks**
- `GET /api/tasks` - Fetch tasks (supports `?status=`, `?priority=`, `?assigneeId=`, `?search=`)
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `GET /api/tasks/audit` - (Admin only) View the audit log for the org

---

Enjoy the app! Let me know if you run into any issues.
