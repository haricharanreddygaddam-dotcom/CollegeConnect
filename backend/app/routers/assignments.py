
from app.core.time import utc_now_naive
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Assignment, AssignmentSubmission, Subject, Student, User
from app.schemas import (
    AssignmentCreate, AssignmentOut,
    SubmissionCreate, SubmissionGrade, SubmissionOut
)
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/assignments", tags=["Assignment Management"])

@router.get("/", response_model=List[AssignmentOut])
def get_assignments(
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Assignment).join(Subject)
    if subject_id:
        query = query.filter(Assignment.subject_id == subject_id)

    student = None
    if user.role == "student":
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student and not subject_id:
            query = query.filter(
                Subject.department_id == student.department_id,
                Subject.semester == student.semester
            )

    assignments = query.order_by(Assignment.due_date.asc()).all()
    results = []
    for a in assignments:
        submissions_count = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == a.id).count()
        my_sub = None
        if student:
            sub = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == a.id,
                AssignmentSubmission.student_id == student.id
            ).first()
            if sub:
                my_sub = {
                    "id": sub.id,
                    "status": sub.status,
                    "marks_awarded": sub.marks_awarded,
                    "feedback": sub.feedback,
                    "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
                    "submission_text": sub.submission_text
                }

        results.append(AssignmentOut(
            id=a.id,
            subject_id=a.subject_id,
            subject_name=a.subject.name if a.subject else None,
            subject_code=a.subject.code if a.subject else None,
            title=a.title,
            description=a.description,
            max_marks=a.max_marks,
            due_date=a.due_date,
            file_url=a.file_url,
            created_by_name=a.subject.faculty.user.name if a.subject and a.subject.faculty and a.subject.faculty.user else None,
            created_at=a.created_at,
            submissions_count=submissions_count,
            my_submission=my_sub
        ))
    return results

@router.post("/", response_model=AssignmentOut)
def create_assignment(
    assign_in: AssignmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["faculty", "hod", "admin"]))
):
    subject = db.query(Subject).filter(Subject.id == assign_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    assignment = Assignment(
        subject_id=assign_in.subject_id,
        title=assign_in.title,
        description=assign_in.description,
        max_marks=assign_in.max_marks,
        due_date=assign_in.due_date,
        file_url=assign_in.file_url,
        created_by=user.id
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return AssignmentOut(
        id=assignment.id,
        subject_id=assignment.subject_id,
        subject_name=subject.name,
        subject_code=subject.code,
        title=assignment.title,
        description=assignment.description,
        max_marks=assignment.max_marks,
        due_date=assignment.due_date,
        file_url=assignment.file_url,
        created_by_name=user.name,
        created_at=assignment.created_at,
        submissions_count=0
    )

@router.post("/submit", response_model=SubmissionOut)
def submit_assignment(
    sub_in: SubmissionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["student"]))
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    assignment = db.query(Assignment).filter(Assignment.id == sub_in.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    is_late = utc_now_naive() > assignment.due_date
    status_str = "Late" if is_late else "Submitted"

    existing_sub = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == sub_in.assignment_id,
        AssignmentSubmission.student_id == student.id
    ).first()

    if existing_sub:
        existing_sub.submission_text = sub_in.submission_text
        existing_sub.file_url = sub_in.file_url or existing_sub.file_url
        existing_sub.submitted_at = utc_now_naive()
        existing_sub.status = status_str
        sub_obj = existing_sub
    else:
        sub_obj = AssignmentSubmission(
            assignment_id=sub_in.assignment_id,
            student_id=student.id,
            submission_text=sub_in.submission_text,
            file_url=sub_in.file_url,
            status=status_str,
            submitted_at=utc_now_naive()
        )
        db.add(sub_obj)

    db.commit()
    db.refresh(sub_obj)

    return SubmissionOut(
        id=sub_obj.id,
        assignment_id=sub_obj.assignment_id,
        assignment_title=assignment.title,
        student_id=sub_obj.student_id,
        student_name=user.name,
        student_roll=student.roll_number,
        submission_text=sub_obj.submission_text,
        file_url=sub_obj.file_url,
        submitted_at=sub_obj.submitted_at,
        status=sub_obj.status,
        marks_awarded=sub_obj.marks_awarded,
        max_marks=assignment.max_marks,
        feedback=sub_obj.feedback
    )

@router.get("/{assignment_id}/submissions", response_model=List[SubmissionOut])
def get_assignment_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["faculty", "hod", "admin"]))
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submissions = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id
    ).all()

    results = []
    for s in submissions:
        results.append(SubmissionOut(
            id=s.id,
            assignment_id=s.assignment_id,
            assignment_title=assignment.title,
            student_id=s.student_id,
            student_name=s.student.user.name if s.student and s.student.user else None,
            student_roll=s.student.roll_number if s.student else None,
            submission_text=s.submission_text,
            file_url=s.file_url,
            submitted_at=s.submitted_at,
            status=s.status,
            marks_awarded=s.marks_awarded,
            max_marks=assignment.max_marks,
            feedback=s.feedback
        ))
    return results

@router.post("/submissions/{submission_id}/grade", response_model=SubmissionOut)
def grade_submission(
    submission_id: int,
    grade_in: SubmissionGrade,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["faculty", "hod", "admin"]))
):
    sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.marks_awarded = grade_in.marks_awarded
    sub.feedback = grade_in.feedback
    sub.status = "Evaluated"
    sub.graded_by = user.id
    db.commit()
    db.refresh(sub)

    return SubmissionOut(
        id=sub.id,
        assignment_id=sub.assignment_id,
        assignment_title=sub.assignment.title if sub.assignment else None,
        student_id=sub.student_id,
        student_name=sub.student.user.name if sub.student and sub.student.user else None,
        student_roll=sub.student.roll_number if sub.student else None,
        submission_text=sub.submission_text,
        file_url=sub.file_url,
        submitted_at=sub.submitted_at,
        status=sub.status,
        marks_awarded=sub.marks_awarded,
        max_marks=sub.assignment.max_marks if sub.assignment else 20.0,
        feedback=sub.feedback
    )
