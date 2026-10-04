from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Mark, Subject, Student, Faculty, User
from app.schemas import MarkBulkCreate, MarkOut
from app.dependencies import get_current_user, require_roles, authorize_subject_access

router = APIRouter(prefix="/marks", tags=["Marks & Examinations"])

@router.post("/bulk", response_model=List[MarkOut])
def enter_marks_bulk(
    req: MarkBulkCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["faculty", "hod", "admin"]))
):
    subject = db.query(Subject).filter(Subject.id == req.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    authorize_subject_access(db, subject, user)

    created_marks = []
    for entry in req.entries:
        student = db.query(Student).filter(Student.id == entry.student_id).first()
        if not student:
            raise HTTPException(
                status_code=404,
                detail=f"Student {entry.student_id} not found",
            )

        if (
            student.department_id != subject.department_id
            or student.semester != req.semester
        ):
            raise HTTPException(
                status_code=403,
                detail="Student is not eligible for marks in this subject",
            )

        # Check if record exists for this exam type and student
        mark_record = db.query(Mark).filter(
            Mark.student_id == entry.student_id,
            Mark.subject_id == req.subject_id,
            Mark.exam_type == req.exam_type,
            Mark.semester == req.semester
        ).first()

        if mark_record:
            mark_record.marks_obtained = entry.marks_obtained
            mark_record.max_marks = req.max_marks
            mark_record.remarks = entry.remarks
            mark_record.entered_by = user.id
        else:
            mark_record = Mark(
                student_id=entry.student_id,
                subject_id=req.subject_id,
                exam_type=req.exam_type,
                marks_obtained=entry.marks_obtained,
                max_marks=req.max_marks,
                semester=req.semester,
                remarks=entry.remarks,
                entered_by=user.id
            )
            db.add(mark_record)
        created_marks.append(mark_record)

    db.commit()

    results = []
    for m in created_marks:
        db.refresh(m)
        percentage = round((m.marks_obtained / m.max_marks) * 100, 1) if m.max_marks > 0 else 0
        results.append(MarkOut(
            id=m.id,
            student_id=m.student_id,
            student_name=m.student.user.name if m.student and m.student.user else None,
            student_roll=m.student.roll_number if m.student else None,
            subject_id=m.subject_id,
            subject_name=m.subject.name if m.subject else None,
            subject_code=m.subject.code if m.subject else None,
            exam_type=m.exam_type,
            marks_obtained=m.marks_obtained,
            max_marks=m.max_marks,
            percentage=percentage,
            semester=m.semester,
            remarks=m.remarks,
            created_at=m.created_at
        ))
    return results

@router.get("/", response_model=List[MarkOut])
def get_marks(
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    exam_type: Optional[str] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Mark).join(Student).join(Subject).join(User, Student.user_id == User.id)

    if user.role == "student":
        stud = db.query(Student).filter(Student.user_id == user.id).first()
        if stud:
            query = query.filter(Mark.student_id == stud.id)
    elif user.role in ["faculty", "hod"]:
        faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty profile not found")

        if subject_id:
            requested_subject = db.query(Subject).filter(
                Subject.id == subject_id
            ).first()
            if not requested_subject:
                raise HTTPException(status_code=404, detail="Subject not found")
            authorize_subject_access(db, requested_subject, user)

        if user.role == "faculty":
            query = query.filter(Subject.faculty_id == faculty.id)
        else:
            query = query.filter(Subject.department_id == faculty.department_id)

        if student_id:
            query = query.filter(Mark.student_id == student_id)

    elif student_id:
        query = query.filter(Mark.student_id == student_id)

    if subject_id:
        query = query.filter(Mark.subject_id == subject_id)
    if exam_type:
        query = query.filter(Mark.exam_type == exam_type)
    if semester:
        query = query.filter(Mark.semester == semester)

    marks = query.order_by(Mark.created_at.desc()).all()
    results = []
    for m in marks:
        percentage = round((m.marks_obtained / m.max_marks) * 100, 1) if m.max_marks > 0 else 0
        results.append(MarkOut(
            id=m.id,
            student_id=m.student_id,
            student_name=m.student.user.name if m.student and m.student.user else None,
            student_roll=m.student.roll_number if m.student else None,
            subject_id=m.subject_id,
            subject_name=m.subject.name if m.subject else None,
            subject_code=m.subject.code if m.subject else None,
            exam_type=m.exam_type,
            marks_obtained=m.marks_obtained,
            max_marks=m.max_marks,
            percentage=percentage,
            semester=m.semester,
            remarks=m.remarks,
            created_at=m.created_at
        ))
    return results
