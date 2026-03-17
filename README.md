# Fundo

A minimal full-stack to-do application.

**Stack:**
- **Frontend:** [Vite](https://vite.dev/) + React + TypeScript + Tailwind CSS
- **Backend:** FastAPI + SQLite (via SQLModel)

---

## Project Structure

```
fundo/
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI app + CORS
│   │   ├── models.py      # SQLModel models & schemas
│   │   ├── database.py    # SQLite engine + session
│   │   └── routes/
│   │       └── todos.py   # CRUD routes
│   ├── tests/
│   │   └── test_todos.py  # API tests
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # TodoForm, TodoItem
    │   ├── pages/         # Dashboard
    │   ├── services/      # API layer (api.ts, types.ts)
    │   ├── App.tsx
    │   └── main.tsx
    ├── vite.config.ts
    └── package.json
```

---

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# API available at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # dev server → http://localhost:5173
npm run build      # production build
npm run lint       # lint
npm run preview    # preview production build
```

---

## API Endpoints

| Method | Path          | Description     |
|--------|---------------|-----------------|
| GET    | /todos/       | List all to-dos |
| GET    | /todos/{id}   | Get one to-do   |
| POST   | /todos/       | Create to-do    |
| PUT    | /todos/{id}   | Update to-do    |
| DELETE | /todos/{id}   | Delete to-do    |

Interactive API docs: `http://localhost:8000/docs`

---

## Features

- View, create, edit, and delete to-dos
- Toggle completion status
- Filter by all / active / completed
- Data persists in SQLite (`todos.db`)
- Loading and error states
- Tailwind CSS styling
