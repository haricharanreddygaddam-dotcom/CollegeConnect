from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models import User, Student, Faculty, Department
from app.schemas import Token, LoginRequest, UserCreate, UserOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.email).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=dict)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "avatar": current_user.avatar,
        "created_at": current_user.created_at,
    }

    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            dept = db.query(Department).filter(Department.id == student.department_id).first()
            profile_data.update({
                "student_id": student.id,
                "roll_number": student.roll_number,
                "department_id": student.department_id,
                "department_name": dept.name if dept else None,
                "department_code": dept.code if dept else None,
                "year": student.year,
                "semester": student.semester,
                "section": student.section,
                "phone": student.phone,
                "address": student.address,
                "parent_name": student.parent_name,
                "admission_year": student.admission_year,
                "cgpa": student.cgpa,
            })
    elif current_user.role in ["faculty", "hod"]:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty:
            dept = db.query(Department).filter(Department.id == faculty.department_id).first()
            profile_data.update({
                "faculty_id": faculty.id,
                "employee_id": faculty.employee_id,
                "department_id": faculty.department_id,
                "department_name": dept.name if dept else None,
                "department_code": dept.code if dept else None,
                "designation": faculty.designation,
                "experience_years": faculty.experience_years,
                "phone": faculty.phone,
                "office_room": faculty.office_room,
                "qualification": faculty.qualification,
            })

    return profile_data

@router.get("/demo-users", response_model=list)
def get_demo_accounts():
    """Provides demo credentials only when explicitly enabled for presentations."""
    if not settings.ENABLE_DEMO_ACCOUNTS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo accounts are disabled",
        )

    return [
        {
            "role": "admin",
            "name": "Prof. Arthur Pendelton (Admin)",
            "email": "admin@campusconnect.edu",
            "password": "AdminPassword@123",
            "badge": "Super Administrator"
        },
        {
            "role": "hod",
            "name": "Dr. Sarah Mitchell (HOD CSE)",
            "email": "hod.cse@campusconnect.edu",
            "password": "HodPassword@123",
            "badge": "Head of Department - CSE"
        },
        {
            "role": "faculty",
            "name": "Prof. David Thorne (Faculty)",
            "email": "david.thorne@campusconnect.edu",
            "password": "FacultyPassword@123",
            "badge": "Associate Professor - Web Tech & AI"
        },
        {
            "role": "student",
            "name": "Haricharan Reddy (Student)",
            "email": "haricharan.reddy@campusconnect.edu",
            "password": "StudentPassword@123",
            "badge": "B.Tech CSE - 3rd Year / 5th Sem"
        }
    ]
