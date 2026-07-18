import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://credex:credex_dev@postgres:5432/credex",
        description="Asyncpg PostgreSQL connection string"
    )
    REDIS_URL: str = Field(
        default="redis://redis:6379/0",
        description="Redis connection URL"
    )
    ANTHROPIC_API_KEY: str = Field(
        default="dummy_key",
        description="Anthropic API Key"
    )
    SUPABASE_URL: str = Field(
        default="https://dummy.supabase.co",
        description="Supabase URL"
    )
    SUPABASE_KEY: str = Field(
        default="dummy-key",
        description="Supabase Anon Key"
    )
    JWT_SECRET: str = Field(
        default="super-secret-key-that-is-at-least-32-characters-long-for-testing",
        description="Supabase JWT Secret"
    )
    ENCRYPTION_KEY: str = Field(
        default="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        description="32-byte hexadecimal key for PQC encryption box simulation"
    )
    WHISPER_MODEL: str = Field(
        default="base",
        description="Whisper transcription model"
    )
    ENVIRONMENT: str = Field(
        default="development",
        description="Environment (development/production)"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
