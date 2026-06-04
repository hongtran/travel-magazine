from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    supabase_url: str
    supabase_service_key: str
    openai_api_key: str
    frontend_url: str = "http://localhost:3000"


settings = Settings()
