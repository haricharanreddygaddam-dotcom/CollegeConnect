from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import LeaveRequest, Student, User, Faculty
from app.schemas import (
    LeaveRequestCreate, LeaveRequestReview, LeaveRequestOut
)
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/leaves", tags=["Leave Management"])

@router.get("/", response_model=List[LeaveRequestOut])
def get_leave_requests(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(LeaveRequest).join(Student).join(User, Student.user_id == User.id)

    if user.role == "student":
        stud = db.query(Student).filter(Student.user_id == user.id).first()
        if stud:
            query = query.filter(LeaveRequest.student_id == stud.id)
    elif user.role in {"faculty", "hod"}:
        faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty profile not found")

        query = query.filter(
            Student.department_id == faculty.department_id
        )

    if status_filter and status_filter != "All":
        query = query.filter(LeaveRequest.status == status_filter)

    leaves = query.order_by(LeaveRequest.created_at.desc()).all()
    results = []
    for l in leaves:
        days = (l.to_date - l.from_date).days + 1
        results.append(LeaveRequestOut(
            id=l.id,
            student_id=l.student_id,
            student_name=l.student.user.name if l.student and l.student.user else None,
            student_roll=l.student.roll_number if l.student else None,
            department_name=l.student.department.name if l.student and l.student.department else None,
            from_date=l.from_date,
            to_date=l.to_date,
            days_count=max(1, days),
            reason=l.reason,
            attachment_url=l.attachment_url,
            status=l.status,
            reviewer_remarks=l.reviewer_remarks,
            reviewer_name=l.reviewer.name if l.reviewer else None,
            created_at=l.created_at
        ))
    return results

@router.post("/", response_model=LeaveRequestOut)
def apply_leave(
    leave_in: LeaveRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["student"]))
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    leave = LeaveRequest(
        student_id=student.id,
        from_date=leave_in.from_date,
        to_date=leave_in.to_date,
        reason=leave_in.reason,
        attachment_url=leave_in.attachment_url,
        status="Pending"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    days = (leave.to_date - leave.from_date).days + 1
    return LeaveRequestOut(
        id=leave.id,
        student_id=leave.student_id,
        student_name=user.name,
        student_roll=student.roll_number,
        department_name=student.department.name if student.department else None,
        from_date=leave.from_date,
        to_date=leave.to_date,
        days_count=max(1, days),
        reason=leave.reason,
        attachment_url=leave.attachment_url,
        status=leave.status,
        reviewer_remarks=None,
        reviewer_name=None,
        created_at=leave.created_at
    )

@router.post("/{leave_id}/review", response_model=LeaveRequestOut)
def review_leave(
    leave_id: int,
    review_in: LeaveRequestReview,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["faculty", "hod", "admin"]))
):
    leave = (
        db.query(LeaveRequest)
        .join(Student, LeaveRequest.student_id == Student.id)
        .filter(LeaveRequest.id == leave_id)
        .first()
    )
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if user.role in {"faculty", "hod"}:
        faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty profile not found")

        if leave.student.department_id != faculty.department_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized for this department",
            )

    leave.status = review_in.status
    leave.reviewer_remarks = review_in.reviewer_remarks
    leave.reviewed_by = user.id
    db.commit()
    db.refresh(leave)

    days = (leave.to_date - leave.from_date).days + 1
    return LeaveRequestOut(
        id=leave.id,
        student_id=leave.student_id,
        student_name=leave.student.user.name if leave.student and leave.student.user else None,
        student_roll=leave.student.roll_number if leave.student else None,
        department_name=leave.student.department.name if leave.student and leave.student.department else None,
        from_date=leave.from_date,
        to_date=leave.to_date,
        days_count=max(1, days),
        reason=leave.reason,
        attachment_url=leave.attachment_url,
        status=leave.status,
        reviewer_remarks=leave.reviewer_remarks,
        reviewer_name=user.name,
        created_at=leave.created_at
    )
