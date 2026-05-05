# Nexus — Team Task Manager

A full-stack MERN application for project & task management with role-based access control.

---

## 📁 Folder Structure

```
team-task-manager/
├── backend/                        ← Node.js + Express REST API
│   ├── config/
│   │   └── db.js                  ← MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      ← Auth (register, login, profile)
│   │   ├── projectController.js   ← Project CRUD + members
│   │   ├── taskController.js      ← Task CRUD + comments + status
│   │   └── userController.js      ← User management + dashboard stats
│   ├── middleware/
│   │   ├── auth.js                ← JWT protect + adminOnly + projectMember
│   │   ├── errorHandler.js        ← Global error handler
│   │   └── validate.js            ← express-validator middleware
│   ├── models/
│   │   ├── User.js                ← User schema (bcrypt, role)
│   │   ├── Project.js             ← Project schema (members, status, color)
│   │   └── Task.js                ← Task schema (comments, isOverdue virtual)
│   ├── routes/
│   │   ├── authRoutes.js          ← /api/auth/*
│   │   ├── projectRoutes.js       ← /api/projects/*
│   │   ├── taskRoutes.js          ← /api/tasks/* + /api/projects/:id/tasks/*
│   │   └── userRoutes.js          ← /api/users/*
│   ├── .env                       ← Environment variables
│   ├── .gitignore
│   ├── package.json
│   └── server.js                  ← Entry point
│
└── frontend/                      ← React + Vite + Tailwind CSS
    ├── src/
    │   ├── api/
    │   │   ├── config.js          ← ⭐ CENTRAL API BASE URL (axios instance)
    │   │   ├── authApi.js         ← Auth API calls
    │   │   ├── projectApi.js      ← Project API calls
    │   │   ├── taskApi.js         ← Task API calls
    │   │   └── userApi.js         ← User API calls
    │   ├── components/
    │   │   ├── common/
    │   │   │   └── ConfirmModal.jsx
    │   │   ├── layout/
    │   │   │   ├── AppLayout.jsx  ← Root layout (sidebar + topbar)
    │   │   │   ├── AppLayout.css
    │   │   │   ├── Sidebar.jsx    ← Navigation sidebar
    │   │   │   ├── Sidebar.css
    │   │   │   ├── TopBar.jsx     ← Top navigation bar
    │   │   │   └── TopBar.css
    │   │   ├── projects/
    │   │   │   ├── ProjectFormModal.jsx  ← Create/Edit project modal
    │   │   │   └── AddMemberModal.jsx    ← Add team member modal
    │   │   └── tasks/
    │   │       ├── TaskFormModal.jsx     ← Create/Edit task modal
    │   │       └── TaskDetailModal.jsx  ← Task detail + comments
    │   ├── context/
    │   │   └── AuthContext.jsx    ← Global auth state (JWT, user)
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── AuthPages.css
    │   │   ├── DashboardPage.jsx  ← Stats, completion ring, recent tasks
    │   │   ├── DashboardPage.css
    │   │   ├── ProjectsPage.jsx   ← Project grid with CRUD
    │   │   ├── ProjectDetailPage.jsx ← Board/List/Team views
    │   │   ├── TasksPage.jsx      ← All tasks table + filters
    │   │   ├── TeamPage.jsx       ← Admin user management
    │   │   ├── ProfilePage.jsx    ← Profile & password settings
    │   │   └── NotFoundPage.jsx
    │   ├── utils/
    │   │   └── helpers.js         ← Date formatting, initials, colors
    │   ├── App.jsx                ← Routes + providers
    │   ├── index.css              ← Global styles + design tokens
    │   └── main.jsx
    ├── index.html
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vite.config.js
    ├── .env.example
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### 1. Backend Setup

```bash
cd backend
npm install
# Edit .env with your MongoDB URI and JWT secret
npm run dev          # starts on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
# Copy .env.example to .env and set VITE_API_BASE_URL if needed
npm run dev          # starts on http://localhost:5173
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

> **Production**: Change `VITE_API_BASE_URL` to your deployed backend URL.
> The central API config is in `frontend/src/api/config.js` — all API files import from there.

---

## 🔐 Role-Based Access

| Feature | Admin | Member |
|---------|-------|--------|
| Create projects | ✅ | ❌ |
| Edit/Delete projects | ✅ (own) | ❌ |
| View projects | ✅ (all) | ✅ (assigned) |
| Create/edit tasks | ✅ | ✅ (in project) |
| Delete tasks | ✅ | ✅ (own tasks) |
| Manage team members | ✅ | ❌ |
| User management page | ✅ | ❌ |
| Change user roles | ✅ | ❌ |

---

## 📡 REST API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get one project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks (dashboard) |
| GET | `/api/projects/:projectId/tasks` | Get project tasks |
| POST | `/api/projects/:projectId/tasks` | Create task |
| GET | `/api/tasks/:id` | Get one task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/:id/status` | Quick status update |
| POST | `/api/tasks/:id/comments` | Add comment |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/dashboard/stats` | Dashboard stats |
| PUT | `/api/users/:id/role` | Update user role |
| PUT | `/api/users/:id/status` | Activate/deactivate user |

---

## ✨ Features

- **Authentication** — JWT-based signup/login with bcrypt password hashing
- **Projects** — Create, edit, delete projects with color coding, priority, status, tags
- **Task Board** — Kanban board + list view with drag-free status updates
- **Task Tracking** — Status (todo/in-progress/review/done), priority, due dates, overdue detection
- **Team Management** — Add/remove members per project, role assignment
- **Dashboard** — Real-time stats, completion ring, task breakdown, recent activity
- **Comments** — Per-task comment threads
- **RBAC** — Admin vs Member access enforced on both API and UI levels
- **Premium Dark UI** — Tailwind CSS + CSS variables design system