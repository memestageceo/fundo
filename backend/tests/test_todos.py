import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from app.database import get_session
from app.main import app


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Fundo API is running"}


def test_list_todos_empty(client: TestClient):
    response = client.get("/todos/")
    assert response.status_code == 200
    assert response.json() == []


def test_create_todo(client: TestClient):
    response = client.post(
        "/todos/",
        json={"title": "Buy groceries", "description": "Milk, eggs", "completed": False},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Buy groceries"
    assert data["description"] == "Milk, eggs"
    assert data["completed"] is False
    assert "id" in data
    assert "created_at" in data


def test_get_todo(client: TestClient):
    create_resp = client.post("/todos/", json={"title": "Test todo"})
    todo_id = create_resp.json()["id"]

    response = client.get(f"/todos/{todo_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Test todo"


def test_get_todo_not_found(client: TestClient):
    response = client.get("/todos/9999")
    assert response.status_code == 404


def test_update_todo(client: TestClient):
    create_resp = client.post("/todos/", json={"title": "Original title"})
    todo_id = create_resp.json()["id"]

    response = client.put(f"/todos/{todo_id}", json={"title": "Updated title", "completed": True})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated title"
    assert data["completed"] is True


def test_delete_todo(client: TestClient):
    create_resp = client.post("/todos/", json={"title": "To be deleted"})
    todo_id = create_resp.json()["id"]

    response = client.delete(f"/todos/{todo_id}")
    assert response.status_code == 204

    get_resp = client.get(f"/todos/{todo_id}")
    assert get_resp.status_code == 404


def test_list_todos(client: TestClient):
    client.post("/todos/", json={"title": "First"})
    client.post("/todos/", json={"title": "Second"})

    response = client.get("/todos/")
    assert response.status_code == 200
    assert len(response.json()) == 2
