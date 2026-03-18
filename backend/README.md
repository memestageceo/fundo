# Fundo — Backend

FastAPI backend for the Fundo to-do app, powered by SQLite via SQLModel.

## Prerequisites

- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/) (recommended) **or** `pip`

---

## Setup

### Using `uv` (recommended)

```bash
# From the backend/ directory:

# Create and activate a virtual environment
uv venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -e ".[dev]"
```

### Using `pip`

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

---

## Start the development server

```bash
uvicorn app.main:app --reload
```

The API will be available at **<http://localhost:8000>**.

Interactive API docs (Swagger UI): **<http://localhost:8000/docs>**

---

## API Endpoints

| Method | Path          | Description     |
|--------|---------------|-----------------|
| GET    | /todos/       | List all to-dos |
| GET    | /todos/{id}   | Get one to-do   |
| POST   | /todos/       | Create a to-do  |
| PUT    | /todos/{id}   | Update a to-do  |
| DELETE | /todos/{id}   | Delete a to-do  |

---

## Running tests

```bash
# With uv
uv run pytest

# Or directly
pytest
```

---

## Project structure

```
backend/
├── app/
│   ├── main.py        # FastAPI app entry point + CORS
│   ├── models.py      # SQLModel models & Pydantic schemas
│   ├── database.py    # SQLite engine & session dependency
│   └── routes/
│       └── todos.py   # CRUD route handlers
├── tests/
│   └── test_todos.py  # API tests (in-memory SQLite)
├── pyproject.toml     # Project metadata & dependencies (uv / pip)
└── requirements.txt   # Pinned dependency list (pip fallback)
```

---

## Database

SQLite file `todos.db` is created automatically in the `backend/` directory on first startup.
