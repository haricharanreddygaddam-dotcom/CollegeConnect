import secrets
from datetime import date, timedelta
from app.core.time import utc_now_naive
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import (
    AttendanceRecord, AttendanceSession, Subject, Student, Faculty, User
)
from app.schemas import (
    AttendanceSessionCreate, AttendanceSessionOut,
    AttendanceMarkBulkRequest, AttendanceScanQRRequest,
    AttendanceRecordOut, StudentAttendanceStats
)
from app.dependencies import get_current_user, require_roles, authorize_subject_access

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

@router.post("/sessions", response_model=AttendanceSessionOut)
def create_attendance_session(
    session_in: AttendanceSessionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["faculty", "hod", "admin"]))
):
    """Faculty starts a live QR Attendance session with an expiring token."""
    subject = db.query(Subject).filter(Subject.id == session_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    authorize_subject_access(db, subject, user)

    # Deactivate existing active sessions for this subject today
    db.query(AttendanceSession).filter(
        AttendanceSession.subject_id == session_in.subject_id,
        AttendanceSession.date == session_in.date
    ).update({"is_active": False})

    token = secrets.token_urlsafe(16)
    expires_at = utc_now_naive() + timedelta(minutes=session_in.expires_in_minutes)

    session = AttendanceSession(
        subject_id=session_in.subject_id,
        date=session_in.date,
        qr_token=token,
        is_active=True,
        expires_at=expires_at,
        created_by=user.id
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return AttendanceSessionOut(
        id=session.id,
        subject_id=session.subject_id,
        subject_name=subject.name,
        date=session.date,
        qr_token=session.qr_token,
        is_active=session.is_active,
        created_at=session.created_at,
        expires_at=session.expires_at
    )

@router.get("/sessions/active/{subject_id}", response_model=Optional[AttendanceSessionOut])
def get_active_session(
    subject_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["faculty", "hod", "admin"])),
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    authorize_subject_access(db, subject, user)

    session = db.query(AttendanceSession).filter(
        AttendanceSession.subject_id == subject_id,
        AttendanceSession.is_active == True,
        AttendanceSession.expires_at > utc_now_naive()
    ).first()
    if not session:
        return None
    return AttendanceSessionOut(
        id=session.id,
        subject_id=session.subject_id,
        subject_name=session.subject.name if session.subject else None,
        date=session.date,
        qr_token=session.qr_token,
        is_active=session.is_active,
        created_at=session.created_at,
        expires_at=session.expires_at
    )

@router.post("/scan-qr")
def scan_qr_attendance(
    req: AttendanceScanQRRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["student"]))
):
    """Student marks attendance by scanning/submitting the QR token."""
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    session = db.query(AttendanceSession).filter(
        AttendanceSession.qr_token == req.qr_token,
        AttendanceSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(status_code=400, detail="Invalid or expired QR token")

    if session.expires_at and session.expires_at < utc_now_naive():
        session.is_active = False
        db.commit()
        raise HTTPException(status_code=400, detail="QR session has expired")

    # Check if already marked for this subject and date
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id,
        AttendanceRecord.subject_id == session.subject_id,
        AttendanceRecord.date == session.date
    ).first()

    if existing:
        return {
            "success": True,
            "message": "Attendance was already recorded for today's session",
            "subject": session.subject.name if session.subject else "",
            "date": str(session.date),
            "status": existing.status
        }

    record = AttendanceRecord(
        session_id=session.id,
        student_id=student.id,
        subject_id=session.subject_id,
        date=session.date,
        status="Present",
        method="QR"
    )
    db.add(record)
    db.commit()

    return {
        "success": True,
        "message": f"Successfully marked attendance for {session.subject.name}!",
        "subject": session.subject.name if session.subject else "",
        "date": str(session.date),
        "status": "Present"
    }

@router.post("/mark-bulk")
def mark_attendance_bulk(
    req: AttendanceMarkBulkRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["faculty", "hod", "admin"]))
):
    """Faculty takes attendance manually for a roster of students."""
    subject = db.query(Subject).filter(Subject.id == req.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    authorize_subject_access(db, subject, user)

    # Validate every student against the subject's academic scope before
    # modifying any existing attendance records.
    for item in req.records:
        student = db.query(Student).filter(Student.id == item.student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        if (
            student.department_id != subject.department_id
            or student.semester != subject.semester
        ):
            raise HTTPException(
                status_code=403,
                detail="Student is outside this subject's academic scope",
            )

    # Delete existing records only after authorization and validation succeed.
    db.query(AttendanceRecord).filter(
        AttendanceRecord.subject_id == req.subject_id,
        AttendanceRecord.date == req.date
    ).delete()

    records_to_create = []
    for item in req.records:
        rec = AttendanceRecord(
            student_id=item.student_id,
            subject_id=req.subject_id,
            date=req.date,
            status=item.status,
            method="Manual"
        )
        records_to_create.append(rec)

    db.bulk_save_objects(records_to_create)
    db.commit()

    return {
        "success": True,
        "message": f"Successfully marked attendance for {len(records_to_create)} students",
        "date": str(req.date)
    }

@router.get("/records", response_model=List[AttendanceRecordOut])
def get_attendance_records(
    subject_id: Optional[int] = None,
    student_id: Optional[int] = None,
    date_val: Optional[date] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(AttendanceRecord).join(Student).join(Subject).join(User, Student.user_id == User.id)

    if user.role == "student":
        stud = db.query(Student).filter(Student.user_id == user.id).first()
        if not stud:
            raise HTTPException(status_code=404, detail="Student profile not found")

        query = query.filter(AttendanceRecord.student_id == stud.id)

    elif user.role in {"faculty", "hod"}:
        if subject_id:
            subject = db.query(Subject).filter(Subject.id == subject_id).first()
            if not subject:
                raise HTTPException(status_code=404, detail="Subject not found")

            authorize_subject_access(db, subject, user)
            query = query.filter(AttendanceRecord.subject_id == subject_id)
        else:
            faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
            if not faculty:
                raise HTTPException(status_code=404, detail="Faculty profile not found")

            if user.role == "faculty":
                query = query.filter(Subject.faculty_id == faculty.id)
            else:
                query = query.filter(Subject.department_id == faculty.department_id)

        if student_id:
            query = query.filter(AttendanceRecord.student_id == student_id)

    else:
        if student_id:
            query = query.filter(AttendanceRecord.student_id == student_id)

        if subject_id:
            query = query.filter(AttendanceRecord.subject_id == subject_id)
    if date_val:
        query = query.filter(AttendanceRecord.date == date_val)

    records = query.order_by(AttendanceRecord.date.desc()).all()
    results = []
    for r in records:
        results.append(AttendanceRecordOut(
            id=r.id,
            student_id=r.student_id,
            student_name=r.student.user.name if r.student and r.student.user else None,
            student_roll=r.student.roll_number if r.student else None,
            subject_id=r.subject_id,
            subject_name=r.subject.name if r.subject else None,
            date=r.date,
            status=r.status,
            method=r.method,
            marked_at=r.marked_at
        ))
    return results

@router.get("/stats/student/{student_id}", response_model=List[StudentAttendanceStats])
def get_student_attendance_stats(
    student_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if user.role == "student":
        own_student = db.query(Student).filter(
            Student.user_id == user.id
        ).first()

        if not own_student:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found",
            )

        if own_student.id != student.id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to view this student's attendance",
            )

        subjects = db.query(Subject).filter(
            Subject.department_id == student.department_id,
            Subject.semester == student.semester,
        ).all()

    elif user.role == "faculty":
        faculty = db.query(Faculty).filter(
            Faculty.user_id == user.id
        ).first()

        if not faculty:
            raise HTTPException(
                status_code=404,
                detail="Faculty profile not found",
            )

        if student.department_id != faculty.department_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to view this student's attendance",
            )

        subjects = db.query(Subject).filter(
            Subject.faculty_id == faculty.id,
            Subject.department_id == student.department_id,
            Subject.semester == student.semester,
        ).all()

    elif user.role == "hod":
        faculty = db.query(Faculty).filter(
            Faculty.user_id == user.id
        ).first()

        if not faculty:
            raise HTTPException(
                status_code=404,
                detail="Faculty profile not found",
            )

        if student.department_id != faculty.department_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to view this student's attendance",
            )

        subjects = db.query(Subject).filter(
            Subject.department_id == faculty.department_id,
            Subject.semester == student.semester,
        ).all()

    else:
        subjects = db.query(Subject).filter(
            Subject.department_id == student.department_id,
            Subject.semester == student.semester,
        ).all()

    stats = []
    for subj in subjects:
        total = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student.id,
            AttendanceRecord.subject_id == subj.id
        ).count()

        attended = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student.id,
            AttendanceRecord.subject_id == subj.id,
            AttendanceRecord.status == "Present"
        ).count()

        percentage = round((attended / total * 100), 1) if total > 0 else 100.0

        stats.append(StudentAttendanceStats(
            subject_id=subj.id,
            subject_name=subj.name,
            subject_code=subj.code,
            total_classes=total,
            attended_classes=attended,
            missed_classes=total - attended,
            percentage=percentage,
            is_warning=percentage < 75.0
        ))

    return stats
