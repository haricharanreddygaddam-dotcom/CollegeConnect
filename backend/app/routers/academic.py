from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models import Department, Subject, Student, Faculty, User, Mark, AttendanceRecord
from app.schemas import (
    DepartmentCreate, DepartmentOut, UserOut,
    SubjectCreate, SubjectOut,
    StudentCreate, StudentOut,
    FacultyCreate, FacultyOut,
    DepartmentUpdate, SubjectUpdate, StudentUpdate, FacultyUpdate
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
            avatar=s.user.avatar,
            is_active=s.user.is_active
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
        avatar=new_user.avatar,
        is_active=new_user.is_active
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
            avatar=f.user.avatar,
            is_active=f.user.is_active
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
        avatar=new_user.avatar,
        is_active=new_user.is_active
    )


# ==================== ADMIN MANAGEMENT ====================
def _check_unique(db: Session, model, field, value, current_id=None, label="Value"):
    if value is None:
        return
    q = db.query(model).filter(field == value)
    if current_id is not None:
        q = q.filter(model.id != current_id)
    if q.first():
        raise HTTPException(status_code=409, detail=f"{label} already exists")


def _student_out(s: Student) -> StudentOut:
    return StudentOut(
        id=s.id, user_id=s.user_id, name=s.user.name, email=s.user.email,
        roll_number=s.roll_number, department_id=s.department_id,
        department_name=s.department.name if s.department else None,
        year=s.year, semester=s.semester, section=s.section, phone=s.phone,
        address=s.address, parent_name=s.parent_name, parent_phone=s.parent_phone,
        admission_year=s.admission_year, cgpa=s.cgpa, avatar=s.user.avatar,
        is_active=s.user.is_active,
    )


def _faculty_out(f: Faculty) -> FacultyOut:
    return FacultyOut(
        id=f.id, user_id=f.user_id, name=f.user.name, email=f.user.email,
        employee_id=f.employee_id, department_id=f.department_id,
        department_name=f.department.name if f.department else None,
        designation=f.designation, experience_years=f.experience_years,
        phone=f.phone, office_room=f.office_room, qualification=f.qualification,
        avatar=f.user.avatar, is_active=f.user.is_active,
    )


@router.get("/users", response_model=List[UserOut])
def admin_list_users(
    role: Optional[str] = None,
    active: Optional[bool] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if active is not None:
        query = query.filter(User.is_active == active)
    return query.order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/status", response_model=UserOut)
def admin_update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == user.id and not is_active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
    target.is_active = is_active
    db.commit()
    db.refresh(target)
    return target


@router.put("/departments/{department_id}", response_model=DepartmentOut)
def admin_update_department(
    department_id: int,
    dept_in: DepartmentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    data = dept_in.dict(exclude_unset=True)
    if "name" in data:
        _check_unique(db, Department, Department.name, data["name"], department_id, "Department name")
    if "code" in data:
        _check_unique(db, Department, Department.code, data["code"], department_id, "Department code")
    if "hod_id" in data and data["hod_id"] is not None:
        hod = db.query(User).filter(User.id == data["hod_id"], User.role == "hod", User.is_active == True).first()
        if not hod:
            raise HTTPException(status_code=400, detail="hod_id must reference an active HOD")
    for key, value in data.items():
        setattr(dept, key, value)
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/departments/{department_id}")
def admin_delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    if db.query(Student).filter(Student.department_id == department_id).first() or db.query(Faculty).filter(Faculty.department_id == department_id).first() or db.query(Subject).filter(Subject.department_id == department_id).first():
        raise HTTPException(status_code=409, detail="Department cannot be deleted while students, faculty, or subjects are assigned to it")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted"}


@router.put("/subjects/{subject_id}", response_model=SubjectOut)
def admin_update_subject(
    subject_id: int,
    subj_in: SubjectUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    data = subj_in.dict(exclude_unset=True)
    if "code" in data:
        _check_unique(db, Subject, Subject.code, data["code"], subject_id, "Subject code")
    if "department_id" in data and not db.query(Department).filter(Department.id == data["department_id"]).first():
        raise HTTPException(status_code=400, detail="Department not found")
    if "faculty_id" in data and data["faculty_id"] is not None and not db.query(Faculty).filter(Faculty.id == data["faculty_id"]).first():
        raise HTTPException(status_code=400, detail="Faculty not found")
    for key, value in data.items():
        setattr(subj, key, value)
    db.commit()
    db.refresh(subj)
    return SubjectOut(
        id=subj.id, name=subj.name, code=subj.code, credits=subj.credits,
        department_id=subj.department_id, semester=subj.semester, faculty_id=subj.faculty_id,
        department_name=subj.department.name if subj.department else None,
        faculty_name=subj.faculty.user.name if subj.faculty and subj.faculty.user else None,
    )


@router.delete("/subjects/{subject_id}")
def admin_delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    if db.query(AttendanceRecord).filter(AttendanceRecord.subject_id == subject_id).first() or db.query(Mark).filter(Mark.subject_id == subject_id).first():
        raise HTTPException(status_code=409, detail="Subject cannot be deleted because academic records exist for it")
    db.delete(subj)
    db.commit()
    return {"message": "Subject deleted"}


@router.put("/students/{student_id}", response_model=StudentOut)
def admin_update_student(
    student_id: int,
    stud_in: StudentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    data = stud_in.dict(exclude_unset=True)
    if "email" in data:
        _check_unique(db, User, User.email, data["email"], student.user_id, "Email")
        student.user.email = data.pop("email")
    if "roll_number" in data:
        _check_unique(db, Student, Student.roll_number, data["roll_number"], student_id, "Roll number")
    if "name" in data:
        student.user.name = data.pop("name")
    if "password" in data:
        if data["password"]:
            student.user.password_hash = get_password_hash(data.pop("password"))
        else:
            data.pop("password")
    if "department_id" in data and data["department_id"] is not None and not db.query(Department).filter(Department.id == data["department_id"]).first():
        raise HTTPException(status_code=400, detail="Department not found")
    for key, value in data.items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return _student_out(student)


@router.put("/faculty/{faculty_id}", response_model=FacultyOut)
def admin_update_faculty(
    faculty_id: int,
    fac_in: FacultyUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    data = fac_in.dict(exclude_unset=True)
    if "email" in data:
        _check_unique(db, User, User.email, data["email"], faculty.user_id, "Email")
        faculty.user.email = data.pop("email")
    if "employee_id" in data:
        _check_unique(db, Faculty, Faculty.employee_id, data["employee_id"], faculty_id, "Employee ID")
    if "name" in data:
        faculty.user.name = data.pop("name")
    if "password" in data:
        if data["password"]:
            faculty.user.password_hash = get_password_hash(data.pop("password"))
        else:
            data.pop("password")
    if "department_id" in data and data["department_id"] is not None and not db.query(Department).filter(Department.id == data["department_id"]).first():
        raise HTTPException(status_code=400, detail="Department not found")
    for key, value in data.items():
        setattr(faculty, key, value)
    db.commit()
    db.refresh(faculty)
    return _faculty_out(faculty)


@router.delete("/students/{student_id}")
def admin_deactivate_student(
    student_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.user.is_active = False
    db.commit()
    return {"message": "Student account deactivated"}


@router.delete("/faculty/{faculty_id}")
def admin_deactivate_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    if faculty.user_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
    faculty.user.is_active = False
    db.commit()
    return {"message": "Faculty account deactivated"}
