from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models import Department, Subject, Student, Faculty, User
from app.schemas import (
    DepartmentCreate, DepartmentOut,
    SubjectCreate, SubjectOut,
    StudentCreate, StudentOut,
    FacultyCreate, FacultyOut
)
from app.dependencies import get_current_user, require_roles

router = APIRouter(tags=["Academic Management"])

# ==================== DEPARTMENTS ====================
@router.get("/departments", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.post("/departments", response_model=DepartmentOut)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"]))
):
    dept = Department(**dept_in.dict())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

# ==================== SUBJECTS ====================
@router.get("/subjects", response_model=List[SubjectOut])
def get_subjects(
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Subject)
    if department_id:
        query = query.filter(Subject.department_id == department_id)
    if semester:
        query = query.filter(Subject.semester == semester)
    if faculty_id:
        query = query.filter(Subject.faculty_id == faculty_id)
    
    subjects = query.all()
    results = []
    for s in subjects:
        out = SubjectOut(
            id=s.id,
            name=s.name,
            code=s.code,
            credits=s.credits,
            department_id=s.department_id,
            semester=s.semester,
            faculty_id=s.faculty_id,
            department_name=s.department.name if s.department else None,
            faculty_name=s.faculty.user.name if s.faculty and s.faculty.user else None
        )
        results.append(out)
    return results

@router.post("/subjects", response_model=SubjectOut)
def create_subject(
    subj_in: SubjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "hod"]))
):
    subj = Subject(**subj_in.dict())
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return SubjectOut(
        id=subj.id,
        name=subj.name,
        code=subj.code,
        credits=subj.credits,
        department_id=subj.department_id,
        semester=subj.semester,
        faculty_id=subj.faculty_id,
        department_name=subj.department.name if subj.department else None,
        faculty_name=subj.faculty.user.name if subj.faculty and subj.faculty.user else None
    )

# ==================== STUDENTS ====================
@router.get("/students", response_model=List[StudentOut])
def get_students(
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "hod", "faculty"]))
):
    query = db.query(Student).join(User)
    if department_id:
        query = query.filter(Student.department_id == department_id)
    if semester:
        query = query.filter(Student.semester == semester)
    if section:
        query = query.filter(Student.section == section)
    
    students = query.all()
    results = []
    for s in students:
        results.append(StudentOut(
            id=s.id,
            user_id=s.user_id,
            name=s.user.name,
            email=s.user.email,
            roll_number=s.roll_number,
            department_id=s.department_id,
            department_name=s.department.name if s.department else None,
            year=s.year,
            semester=s.semester,
            section=s.section,
            phone=s.phone,
            address=s.address,
            parent_name=s.parent_name,
            parent_phone=s.parent_phone,
            admission_year=s.admission_year,
            cgpa=s.cgpa,
            avatar=s.user.avatar
        ))
    return results

@router.post("/students", response_model=StudentOut)
def create_student(
    stud_in: StudentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "hod"]))
):
    existing_user = db.query(User).filter(User.email == stud_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        name=stud_in.name,
        email=stud_in.email,
        password_hash=get_password_hash(stud_in.password),
        role="student",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_student = Student(
        user_id=new_user.id,
        roll_number=stud_in.roll_number,
        department_id=stud_in.department_id,
        year=stud_in.year,
        semester=stud_in.semester,
        section=stud_in.section,
        phone=stud_in.phone,
        address=stud_in.address,
        parent_name=stud_in.parent_name,
        parent_phone=stud_in.parent_phone,
        admission_year=stud_in.admission_year,
        cgpa=stud_in.cgpa
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return StudentOut(
        id=new_student.id,
        user_id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        roll_number=new_student.roll_number,
        department_id=new_student.department_id,
        department_name=new_student.department.name if new_student.department else None,
        year=new_student.year,
        semester=new_student.semester,
        section=new_student.section,
        phone=new_student.phone,
        address=new_student.address,
        parent_name=new_student.parent_name,
        parent_phone=new_student.parent_phone,
        admission_year=new_student.admission_year,
        cgpa=new_student.cgpa,
        avatar=new_user.avatar
    )

# ==================== FACULTY ====================
@router.get("/faculty", response_model=List[FacultyOut])
def get_faculty_members(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Faculty).join(User)
    if department_id:
        query = query.filter(Faculty.department_id == department_id)
    
    faculty_list = query.all()
    results = []
    for f in faculty_list:
        results.append(FacultyOut(
            id=f.id,
            user_id=f.user_id,
            name=f.user.name,
            email=f.user.email,
            employee_id=f.employee_id,
            department_id=f.department_id,
            department_name=f.department.name if f.department else None,
            designation=f.designation,
            experience_years=f.experience_years,
            phone=f.phone,
            office_room=f.office_room,
            qualification=f.qualification,
            avatar=f.user.avatar
        ))
    return results

@router.post("/faculty", response_model=FacultyOut)
def create_faculty(
    fac_in: FacultyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"]))
):
    existing_user = db.query(User).filter(User.email == fac_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        name=fac_in.name,
        email=fac_in.email,
        password_hash=get_password_hash(fac_in.password),
        role="faculty",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_faculty = Faculty(
        user_id=new_user.id,
        employee_id=fac_in.employee_id,
        department_id=fac_in.department_id,
        designation=fac_in.designation,
        experience_years=fac_in.experience_years,
        phone=fac_in.phone,
        office_room=fac_in.office_room,
        qualification=fac_in.qualification
    )
    db.add(new_faculty)
    db.commit()
    db.refresh(new_faculty)

    return FacultyOut(
        id=new_faculty.id,
        user_id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        employee_id=new_faculty.employee_id,
        department_id=new_faculty.department_id,
        department_name=new_faculty.department.name if new_faculty.department else None,
        designation=new_faculty.designation,
        experience_years=new_faculty.experience_years,
        phone=new_faculty.phone,
        office_room=new_faculty.office_room,
        qualification=new_faculty.qualification,
        avatar=new_user.avatar
    )
