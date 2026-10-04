from app.core.config import settings


def test_jwt_secret_meets_hs256_minimum_length():
    assert len(settings.SECRET_KEY.encode("utf-8")) >= 32


def test_jwt_configuration_uses_expected_algorithm():
    assert settings.ALGORITHM == "HS256"
