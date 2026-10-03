import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.config import settings
from app.models import (
    Feedback, Notification, Student, Faculty, Department, Subject,
    AttendanceRecord, LeaveRequest, CertificateRequest, Assignment, Event, Notice, User
)
from app.schemas import (
    FeedbackCreate, FeedbackOut, NotificationOut, DashboardStatsOut, NoticeOut
)
from app.dependencies import get_current_user, require_roles

router = APIRouter(tags=["Support & Analytics"])

# ==================== FEEDBACK ====================
@router.post("/feedback", response_model=FeedbackOut)
def submit_feedback(
    feedback_in: FeedbackCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["student"]))
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    fb = Feedback(
        student_id=student.id,
        category=feedback_in.category,
        target_name=feedback_in.target_name,
        rating=feedback_in.rating,
        comments=feedback_in.comments,
        is_anonymous=feedback_in.is_anonymous
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    return FeedbackOut(
        id=fb.id,
        student_id=None if fb.is_anonymous else fb.student_id,
        student_name="Anonymous Student" if fb.is_anonymous else user.name,
        category=fb.category,
        target_name=fb.target_name,
        rating=fb.rating,
        comments=fb.comments,
        is_anonymous=fb.is_anonymous,
        created_at=fb.created_at
    )

@router.get("/feedback", response_model=List[FeedbackOut])
def get_all_feedback(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "hod", "faculty"]))
):
    query = db.query(Feedback).join(Student).join(User, Student.user_id == User.id)
    if category and category != "All":
        query = query.filter(Feedback.category == category)

    feedbacks = query.order_by(Feedback.created_at.desc()).all()
    results = []
    for f in feedbacks:
        results.append(FeedbackOut(
            id=f.id,
            student_id=None if f.is_anonymous else f.student_id,
            student_name="Anonymous Student" if f.is_anonymous else (f.student.user.name if f.student and f.student.user else "Student"),
            category=f.category,
            target_name=f.target_name,
            rating=f.rating,
            comments=f.comments,
            is_anonymous=f.is_anonymous,
            created_at=f.created_at
        ))
    return results

# ==================== NOTIFICATIONS ====================
@router.get("/notifications", response_model=List[NotificationOut])
def get_user_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()
    return notifs

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}

@router.post("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    db.query(Notification).filter(Notification.user_id == user.id).update({"is_read": True})
    db.commit()
    return {"success": True}

# ==================== ANALYTICS & DASHBOARD STATS ====================
@router.get("/analytics/dashboard", response_model=DashboardStatsOut)
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    total_students = db.query(Student).count()
    total_faculty = db.query(Faculty).count()
    total_departments = db.query(Department).count()
    total_subjects = db.query(Subject).count()

    # Average attendance across entire college
    total_records = db.query(AttendanceRecord).count()
    present_records = db.query(AttendanceRecord).filter(AttendanceRecord.status == "Present").count()
    avg_attendance = round((present_records / total_records * 100), 1) if total_records > 0 else 88.5

    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").count()
    pending_certificates = db.query(CertificateRequest).filter(CertificateRequest.status == "Pending").count()
    active_assignments = db.query(Assignment).count()
    upcoming_events = db.query(Event).count()

    # Recent notices
    notices_db = db.query(Notice).order_by(Notice.created_at.desc()).limit(5).all()
    recent_notices = []
    for n in notices_db:
        recent_notices.append(NoticeOut(
            id=n.id,
            title=n.title,
            content=n.content,
            category=n.category,
            priority=n.priority,
            target_role=n.target_role,
            department_id=n.department_id,
            department_name=n.department.name if n.department else "All Departments",
            attachment_url=n.attachment_url,
            author_name=n.author.name if n.author else "Administration",
            created_at=n.created_at
        ))

    # Weekly attendance trend simulation data / breakdown
    attendance_trend = [
        {"day": "Mon", "rate": 89.2, "present": 218, "absent": 26},
        {"day": "Tue", "rate": 91.5, "present": 224, "absent": 20},
        {"day": "Wed", "rate": 87.0, "present": 213, "absent": 31},
        {"day": "Thu", "rate": 93.4, "present": 229, "absent": 15},
        {"day": "Fri", "rate": 86.8, "present": 212, "absent": 32},
    ]

    # Department distribution
    depts = db.query(Department).all()
    dept_dist = []
    colors = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"]
    for idx, d in enumerate(depts):
        stud_count = db.query(Student).filter(Student.department_id == d.id).count()
        fac_count = db.query(Faculty).filter(Faculty.department_id == d.id).count()
        dept_dist.append({
            "name": d.code,
            "fullName": d.name,
            "students": stud_count,
            "faculty": fac_count,
            "color": colors[idx % len(colors)]
        })

    return DashboardStatsOut(
        total_students=total_students,
        total_faculty=total_faculty,
        total_departments=total_departments,
        total_subjects=total_subjects,
        average_attendance=avg_attendance,
        pending_leaves=pending_leaves,
        pending_certificates=pending_certificates,
        active_assignments=active_assignments,
        upcoming_events=upcoming_events,
        recent_notices=recent_notices,
        attendance_trend=attendance_trend,
        department_distribution=dept_dist
    )

# ==================== FILE UPLOADS ====================
@router.post("/uploads/file")
async def upload_file(
    file: UploadFile = File(...)
):
    """Allows uploading assignment submissions, medical certificates, event flyers, etc."""
    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg", ".docx", ".zip", ".txt"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    doc_dir = os.path.join(settings.UPLOAD_DIR, "docs")
    os.makedirs(doc_dir, exist_ok=True)
    
    unique_filename = f"{uuid.uuid4().hex[:12]}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(doc_dir, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "filename": file.filename,
        "url": f"/api/v1/uploads/docs/{unique_filename}",
        "size": os.path.getsize(file_path)
    }
