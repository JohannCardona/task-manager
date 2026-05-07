from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Task Manager API"
    debug: bool = False
    database_url: str = "sqlite:///./taskmanager.db"
    secret_key: str = "example"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    frontend_url: str = "http://localhost:5173"

    # SMTP email settings
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    email_notifications_enabled: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
