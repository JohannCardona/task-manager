# Task Manager

A full-stack task management app built with FastAPI and React — featuring categories, tags, subtasks, recurring tasks, calendar view, email reminders, and more.

## Features

- Create, edit, and delete tasks with priority, deadline, category, tags, notes, and subtasks
- Recurring tasks (daily, weekly, monthly) that auto-generate the next occurrence on completion
- Drag-and-drop task reordering
- Filter by status, priority, category, and tag — search by title or description
- Calendar view showing tasks by deadline
- Bulk actions: complete, reassign category, delete
- Export tasks to CSV or PDF
- In-app deadline badge and on-load toast for overdue and due-today tasks
- Daily email reminders at 8 AM per user's local timezone via Gmail SMTP
- JWT authentication with refresh token rotation
- Password reset via email
- Account settings: update username, email, password, timezone, delete account
- Dark/light theme toggle
- Responsive layout for mobile

## Tech Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Backend       | FastAPI, SQLAlchemy 2, Alembic, APScheduler |
| Database      | PostgreSQL (production), SQLite (local)     |
| Frontend      | React 19, TypeScript, Vite, CSS Modules     |
| Drag and drop | @dnd-kit                                    |
| Auth          | JWT (access + refresh tokens), bcrypt       |
| Email         | Gmail SMTP with App Passwords               |
| Deployment    | Render (backend + frontend)                 |

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL=sqlite:///./tasks.db
SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:5173

# Optional — email reminders
SMTP_USERNAME=you@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=you@gmail.com
EMAIL_NOTIFICATIONS_ENABLED=true
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` in `frontend/.env` if your backend runs on a different port:

```env
VITE_API_URL=http://localhost:8000
```

## Deployment

The app is designed to deploy on [Render](https://render.com):

- **Backend**: Python web service, build command `pip install -r requirements-prod.txt && alembic upgrade head`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Frontend**: Static site, build command `npm run build`, publish directory `dist`

Set `PYTHON_VERSION=3.12.0` in the backend service environment to avoid build errors.
