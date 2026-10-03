from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Timetable, Subject, Department, User, Student, Faculty
from app.schemas import TimetableCreate, TimetableOut
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/timetable", tags=["Timetable Management"])

@router.get("/", response_model=List[TimetableOut])
def get_timetables(
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    day_of_week: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Timetable).join(Subject).join(Department)

    # If student, auto filter by student's dept/sem/sec if not explicitly supplied
    if user.role == "student" and not department_id:
        stud = db.query(Student).filter(Student.user_id == user.id).first()
        if stud:
            query = query.filter(
                Timetable.department_id == stud.department_id,
                Timetable.semester == stud.semester,
                Timetable.section == stud.section
            )
    elif user.role in ["faculty", "hod"] and not department_id:
        fac = db.query(Faculty).filter(Faculty.user_id == user.id).first()
        if fac:
            # Faculty can see subjects they teach or department timetable
            query = query.filter(Subject.faculty_id == fac.id)
    else:
        if department_id:
            query = query.filter(Timetable.department_id == department_id)
        if semester:
            query = query.filter(Timetable.semester == semester)
        if section:
            query = query.filter(Timetable.section == section)

    if day_of_week:
        query = query.filter(Timetable.day_of_week == day_of_week)

    slots = query.all()
    results = []
    for s in slots:
        results.append(TimetableOut(
            id=s.id,
            department_id=s.department_id,
            department_name=s.department.name if s.department else None,
            semester=s.semester,
            section=s.section,
            day_of_week=s.day_of_week,
            start_time=s.start_time,
            end_time=s.end_time,
            subject_id=s.subject_id,
            subject_name=s.subject.name if s.subject else None,
            subject_code=s.subject.code if s.subject else None,
            faculty_name=s.subject.faculty.user.name if s.subject and s.subject.faculty and s.subject.faculty.user else None,
            room_number=s.room_number
        ))
    return results

@router.post("/", response_model=TimetableOut)
def create_timetable_slot(
    slot_in: TimetableCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "hod"]))
):
    slot = Timetable(**slot_in.dict())
    db.add(slot)
    db.commit()
    db.refresh(slot)

    return TimetableOut(
        id=slot.id,
        department_id=slot.department_id,
        department_name=slot.department.name if slot.department else None,
        semester=slot.semester,
        section=slot.section,
        day_of_week=slot.day_of_week,
        start_time=slot.start_time,
        end_time=slot.end_time,
        subject_id=slot.subject_id,
        subject_name=slot.subject.name if slot.subject else None,
        subject_code=slot.subject.code if slot.subject else None,
        faculty_name=slot.subject.faculty.user.name if slot.subject and slot.subject.faculty and slot.subject.faculty.user else None,
        room_number=slot.room_number
    )
