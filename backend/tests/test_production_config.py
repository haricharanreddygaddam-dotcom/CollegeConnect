import pytest
from app.core.config import Settings


def test_development_configuration_is_valid():
    settings = Settings(
        ENVIRONMENT="development",
        SECRET_KEY="development-test-secret-key-1234567890",
        DATABASE_URL="sqlite:///./test.db",
    )

    assert settings.ENVIRONMENT == "development"
    assert settings.AUTO_SEED is True


def test_production_requires_non_default_secret():
    with pytest.raises(ValueError, match="SECRET_KEY"):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://user:password@localhost/campusconnect",
            ENABLE_HSTS=True,
            AUTO_SEED=False,
            ENABLE_DEMO_ACCOUNTS=False,
        )


def test_production_requires_postgresql():
    with pytest.raises(ValueError, match="PostgreSQL"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="production-test-secret-key-1234567890",
            DATABASE_URL="sqlite:///./campusconnect.db",
            ENABLE_HSTS=True,
            AUTO_SEED=False,
            ENABLE_DEMO_ACCOUNTS=False,
        )


def test_production_requires_hsts():
    with pytest.raises(ValueError, match="ENABLE_HSTS"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="production-test-secret-key-1234567890",
            DATABASE_URL="postgresql://user:password@localhost/campusconnect",
            ENABLE_HSTS=False,
            AUTO_SEED=False,
            ENABLE_DEMO_ACCOUNTS=False,
        )


def test_production_rejects_demo_accounts():
    with pytest.raises(ValueError, match="ENABLE_DEMO_ACCOUNTS"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="production-test-secret-key-1234567890",
            DATABASE_URL="postgresql://user:password@localhost/campusconnect",
            ENABLE_HSTS=True,
            AUTO_SEED=False,
            ENABLE_DEMO_ACCOUNTS=True,
        )


def test_production_configuration_is_valid():
    settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="production-test-secret-key-1234567890",
        DATABASE_URL="postgresql://user:password@localhost/campusconnect",
        ENABLE_HSTS=True,
        AUTO_SEED=False,
        ENABLE_DEMO_ACCOUNTS=False,
        CORS_ORIGINS=["https://campusconnect.example.com"],
    )

    assert settings.ENVIRONMENT == "production"
    assert settings.AUTO_SEED is False
    assert settings.ENABLE_HSTS is True
    assert settings.ENABLE_DEMO_ACCOUNTS is False
