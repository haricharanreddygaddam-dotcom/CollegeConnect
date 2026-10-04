from datetime import datetime, timezone


def utc_now_naive() -> datetime:
    """Return the current UTC time as a naive datetime.

    CampusConnect currently stores UTC timestamps in SQLAlchemy DateTime
    columns without timezone information, so this preserves that representation
    while avoiding the deprecated datetime.utcnow().
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)
