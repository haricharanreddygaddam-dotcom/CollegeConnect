from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Notice, User, Department
from app.schemas import NoticeCreate, NoticeOut
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/notices", tags=["Notices & Announcements"])

@router.get("/", response_model=List[NoticeOut])
def get_notices(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Notice).join(User, Notice.created_by == User.id, isouter=True)

    if category and category != "All":
        query = query.filter(Notice.category == category)
    if priority and priority != "All":
        query = query.filter(Notice.priority == priority)
    if department_id:
        query = query.filter((Notice.department_id == department_id) | (Notice.department_id == None))

    # Target role filtering
    if user.role != "admin":
        query = query.filter(Notice.target_role.in_(["All", user.role.capitalize()]))

    notices = query.order_by(Notice.created_at.desc()).all()
    results = []
    for n in notices:
        results.append(NoticeOut(
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
    return results

@router.post("/", response_model=NoticeOut)
def create_notice(
    notice_in: NoticeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["faculty", "hod", "admin"]))
):
    notice = Notice(
        title=notice_in.title,
        content=notice_in.content,
        category=notice_in.category,
        priority=notice_in.priority,
        target_role=notice_in.target_role,
        department_id=notice_in.department_id,
        attachment_url=notice_in.attachment_url,
        created_by=user.id
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    dept_name = "All Departments"
    if notice.department_id:
        dept = db.query(Department).filter(Department.id == notice.department_id).first()
        if dept:
            dept_name = dept.name

    return NoticeOut(
        id=notice.id,
        title=notice.title,
        content=notice.content,
        category=notice.category,
        priority=notice.priority,
        target_role=notice.target_role,
        department_id=notice.department_id,
        department_name=dept_name,
        attachment_url=notice.attachment_url,
        author_name=user.name,
        created_at=notice.created_at
    )
