import socket
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from backend.config import settings

DATABASE_URL = settings.DATABASE_URL

def check_postgres_port() -> bool:
    """Synchronous TCP check to verify if PostgreSQL is reachable."""
    if "postgresql" not in settings.DATABASE_URL:
        return False
    try:
        # Parse host and port from URL
        # Format: postgresql+asyncpg://user:pass@host:port/dbname
        remaining = settings.DATABASE_URL.split("@")[-1]
        host_port = remaining.split("/")[0]
        if ":" in host_port:
            host, port_str = host_port.split(":")
            port = int(port_str)
        else:
            host = host_port
            port = 5432
            
        # Resolve 'postgres' container hostname to localhost for local testing if needed
        if host == "postgres":
            host = "localhost"
            
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1.0)
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False

# Resolve URL based on availability
if check_postgres_port():
    print("PostgreSQL detected on port 5432. Connecting to remote/local Postgres database.")
    if "@postgres:" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("@postgres:", "@localhost:")
else:
    print("PostgreSQL database is unreachable. Falling back to local SQLite file database (credex.db).")
    # For SQLite, the engine URL uses sqlite+aiosqlite
    DATABASE_URL = "sqlite+aiosqlite:///credex.db"

# Create async engine kwargs
engine_kwargs = {
    "echo": False,
    "future": True
}
if "sqlite" not in DATABASE_URL:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_async_engine(
    DATABASE_URL,
    **engine_kwargs
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injection helper for FastAPI endpoints."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
