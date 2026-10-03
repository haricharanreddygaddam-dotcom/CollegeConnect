from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Event, EventRegistration, User
from app.schemas import EventCreate, EventOut
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/events", tags=["Events & Activities"])

@router.get("/", response_model=List[EventOut])
def get_events(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    events = db.query(Event).order_by(Event.event_date.asc()).all()
    results = []
    for e in events:
        reg_count = db.query(EventRegistration).filter(EventRegistration.event_id == e.id).count()
        is_reg = db.query(EventRegistration).filter(
            EventRegistration.event_id == e.id,
            EventRegistration.user_id == user.id
        ).first() is not None

        results.append(EventOut(
            id=e.id,
            title=e.title,
            description=e.description,
            event_date=e.event_date,
            venue=e.venue,
            category=e.category,
            max_participants=e.max_participants,
            organizer=e.organizer,
            image_url=e.image_url,
            registration_open=e.registration_open,
            registered_count=reg_count,
            is_registered=is_reg,
            created_at=e.created_at
        ))
    return results

@router.post("/", response_model=EventOut)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "hod", "faculty"]))
):
    event = Event(**event_in.dict())
    db.add(event)
    db.commit()
    db.refresh(event)

    return EventOut(
        id=event.id,
        title=event.title,
        description=event.description,
        event_date=event.event_date,
        venue=event.venue,
        category=event.category,
        max_participants=event.max_participants,
        organizer=event.organizer,
        image_url=event.image_url,
        registration_open=event.registration_open,
        registered_count=0,
        is_registered=False,
        created_at=event.created_at
    )

@router.post("/{event_id}/register")
def register_event(
    event_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == user.id
    ).first()

    if reg:
        # Toggle unregister
        db.delete(reg)
        db.commit()
        return {"registered": False, "message": "Successfully cancelled registration"}

    current_count = db.query(EventRegistration).filter(EventRegistration.event_id == event_id).count()
    if current_count >= event.max_participants:
        raise HTTPException(status_code=400, detail="Event capacity reached")

    new_reg = EventRegistration(event_id=event_id, user_id=user.id)
    db.add(new_reg)
    db.commit()
    return {"registered": True, "message": "Successfully registered for the event!"}
