from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime, date

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str # student, faculty, hod, admin
    avatar: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    avatar: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    building: Optional[str] = None
    hod_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    building: Optional[str] = None
    hod_id: Optional[int] = None

class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

# Subject Schemas
class SubjectBase(BaseModel):
    name: str
    code: str
    credits: int = 4
    department_id: int
    semester: int = 5
    faculty_id: Optional[int] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    credits: Optional[int] = None
    department_id: Optional[int] = None
    semester: Optional[int] = None
    faculty_id: Optional[int] = None

class SubjectOut(SubjectBase):
    id: int
    department_name: Optional[str] = None
    faculty_name: Optional[str] = None
    class Config:
        from_attributes = True

# Student Schemas
class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = "Student@123"
    roll_number: str
    department_id: int
    year: int = 3
    semester: int = 5
    section: str = "A"
    phone: Optional[str] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    admission_year: int = 2023
    cgpa: float = 8.5

class StudentOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    roll_number: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    year: int
    semester: int
    section: str
    phone: Optional[str] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    admission_year: int
    cgpa: float
    avatar: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True

# Faculty Schemas
class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    roll_number: Optional[str] = None
    department_id: Optional[int] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    admission_year: Optional[int] = None
    cgpa: Optional[float] = None

class FacultyCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = "Faculty@123"
    employee_id: str
    department_id: int
    designation: str = "Assistant Professor"
    experience_years: int = 5
    phone: Optional[str] = None
    office_room: Optional[str] = None
    qualification: str = "M.Tech / Ph.D"

class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    employee_id: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    experience_years: Optional[int] = None
    phone: Optional[str] = None
    office_room: Optional[str] = None
    qualification: Optional[str] = None

class FacultyOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    employee_id: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    designation: str
    experience_years: int
    phone: Optional[str] = None
    office_room: Optional[str] = None
    qualification: str
    avatar: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceSessionCreate(BaseModel):
    subject_id: int
    date: date
    expires_in_minutes: int = 15

class AttendanceSessionOut(BaseModel):
    id: int
    subject_id: int
    subject_name: Optional[str] = None
    date: date
    qr_token: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AttendanceMarkBulkItem(BaseModel):
    student_id: int
    status: str # Present, Absent, Late

class AttendanceMarkBulkRequest(BaseModel):
    subject_id: int
    date: date
    records: List[AttendanceMarkBulkItem]

class AttendanceScanQRRequest(BaseModel):
    qr_token: str

class AttendanceRecordOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_roll: Optional[str] = None
    subject_id: int
    subject_name: Optional[str] = None
    date: date
    status: str
    method: str
    marked_at: datetime

    class Config:
        from_attributes = True

class StudentAttendanceStats(BaseModel):
    subject_id: int
    subject_name: str
    subject_code: str
    total_classes: int
    attended_classes: int
    missed_classes: int
    percentage: float
    is_warning: bool

# Marks Schemas
class MarkEntry(BaseModel):
    student_id: int
    marks_obtained: float
    remarks: Optional[str] = None

class MarkBulkCreate(BaseModel):
    subject_id: int
    exam_type: str # Internal 1, Internal 2, Lab Exam, Semester End, Assignment
    max_marks: float = 100.0
    semester: int = 5
    entries: List[MarkEntry]

class MarkOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_roll: Optional[str] = None
    subject_id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    exam_type: str
    marks_obtained: float
    max_marks: float
    percentage: float
    semester: int
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Timetable Schemas
class TimetableCreate(BaseModel):
    department_id: int
    semester: int
    section: str = "A"
    day_of_week: str
    start_time: str
    end_time: str
    subject_id: int
    room_number: str = "Room 301"

class TimetableOut(BaseModel):
    id: int
    department_id: int
    department_name: Optional[str] = None
    semester: int
    section: str
    day_of_week: str
    start_time: str
    end_time: str
    subject_id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    faculty_name: Optional[str] = None
    room_number: str

    class Config:
        from_attributes = True

# Assignment Schemas
class AssignmentCreate(BaseModel):
    subject_id: int
    title: str
    description: str
    max_marks: float = 20.0
    due_date: datetime
    file_url: Optional[str] = None

class AssignmentOut(BaseModel):
    id: int
    subject_id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    title: str
    description: str
    max_marks: float
    due_date: datetime
    file_url: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    submissions_count: Optional[int] = 0
    my_submission: Optional[Any] = None

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    assignment_id: int
    submission_text: Optional[str] = None
    file_url: Optional[str] = None

class SubmissionGrade(BaseModel):
    marks_awarded: float
    feedback: Optional[str] = None

class SubmissionOut(BaseModel):
    id: int
    assignment_id: int
    assignment_title: Optional[str] = None
    student_id: int
    student_name: Optional[str] = None
    student_roll: Optional[str] = None
    submission_text: Optional[str] = None
    file_url: Optional[str] = None
    submitted_at: datetime
    status: str
    marks_awarded: Optional[float] = None
    max_marks: Optional[float] = 20.0
    feedback: Optional[str] = None

    class Config:
        from_attributes = True

# Notice Schemas
class NoticeCreate(BaseModel):
    title: str
    content: str
    category: str = "Academic"
    priority: str = "Normal"
    target_role: str = "All"
    department_id: Optional[int] = None
    attachment_url: Optional[str] = None

class NoticeOut(BaseModel):
    id: int
    title: str
    content: str
    category: str
    priority: str
    target_role: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    attachment_url: Optional[str] = None
    author_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Event Schemas
class EventCreate(BaseModel):
    title: str
    description: str
    event_date: datetime
    venue: str
    category: str = "Technical"
    max_participants: int = 200
    organizer: str = "CampusConnect Student Council"
    image_url: Optional[str] = None
    registration_open: bool = True

class EventOut(BaseModel):
    id: int
    title: str
    description: str
    event_date: datetime
    venue: str
    category: str
    max_participants: int
    organizer: str
    image_url: Optional[str] = None
    registration_open: bool
    registered_count: int = 0
    is_registered: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

# Leave Schemas
class LeaveRequestCreate(BaseModel):
    from_date: date
    to_date: date
    reason: str
    attachment_url: Optional[str] = None

class LeaveRequestReview(BaseModel):
    status: str # Approved, Rejected
    reviewer_remarks: Optional[str] = None

class LeaveRequestOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_roll: Optional[str] = None
    department_name: Optional[str] = None
    from_date: date
    to_date: date
    days_count: int = 1
    reason: str
    attachment_url: Optional[str] = None
    status: str
    reviewer_remarks: Optional[str] = None
    reviewer_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Certificate Schemas
class CertificateRequestCreate(BaseModel):
    cert_type: str
    purpose: str

class CertificateReview(BaseModel):
    status: str # Approved, Rejected

class CertificateOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_roll: Optional[str] = None
    department_name: Optional[str] = None
    admission_year: Optional[int] = None
    cgpa: Optional[float] = None
    cert_type: str
    purpose: str
    status: str
    certificate_number: Optional[str] = None
    verification_hash: Optional[str] = None
    qr_code_url: Optional[str] = None
    issued_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Feedback Schemas
class FeedbackCreate(BaseModel):
    category: str
    target_name: str
    rating: int = 5
    comments: str
    is_anonymous: bool = False

class FeedbackOut(BaseModel):
    id: int
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    category: str
    target_name: str
    rating: int
    comments: str
    is_anonymous: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    category: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Stats Schemas
class DashboardStatsOut(BaseModel):
    total_students: int
    total_faculty: int
    total_departments: int
    total_subjects: int
    average_attendance: float
    pending_leaves: int
    pending_certificates: int
    active_assignments: int
    upcoming_events: int
    recent_notices: List[NoticeOut]
    attendance_trend: List[dict]
    department_distribution: List[dict]
