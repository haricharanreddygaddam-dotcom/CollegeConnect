from datetime import datetime, date, time
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, Time, Text,
    ForeignKey, Float, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="student") # student, faculty, hod, admin
    avatar = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    event_registrations = relationship("EventRegistration", back_populates="user", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True) # CSE, ECE, IT, MECH
    description = Column(Text, nullable=True)
    building = Column(String(100), nullable=True)
    hod_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    hod = relationship("User")
    students = relationship("Student", back_populates="department")
    faculty_members = relationship("Faculty", back_populates="department")
    subjects = relationship("Subject", back_populates="department")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    roll_number = Column(String(50), unique=True, index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    year = Column(Integer, default=3)
    semester = Column(Integer, default=5)
    section = Column(String(10), default="A")
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    parent_name = Column(String(100), nullable=True)
    parent_phone = Column(String(20), nullable=True)
    admission_year = Column(Integer, default=2023)
    cgpa = Column(Float, default=8.5)

    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("AssignmentSubmission", back_populates="student", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="student", cascade="all, delete-orphan")
    certificate_requests = relationship("CertificateRequest", back_populates="student", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="student", cascade="all, delete-orphan")

class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    designation = Column(String(100), default="Assistant Professor")
    experience_years = Column(Integer, default=5)
    phone = Column(String(20), nullable=True)
    office_room = Column(String(50), nullable=True)
    qualification = Column(String(100), default="Ph.D / M.Tech")

    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty_members")
    subjects = relationship("Subject", back_populates="faculty")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    code = Column(String(30), unique=True, index=True, nullable=False)
    credits = Column(Integer, default=4)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    semester = Column(Integer, default=5)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)

    department = relationship("Department", back_populates="subjects")
    faculty = relationship("Faculty", back_populates="subjects")
    assignments = relationship("Assignment", back_populates="subject", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="subject", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="subject", cascade="all, delete-orphan")
    timetables = relationship("Timetable", back_populates="subject", cascade="all, delete-orphan")

class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    semester = Column(Integer, nullable=False)
    section = Column(String(10), default="A")
    day_of_week = Column(String(20), nullable=False) # Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
    start_time = Column(String(20), nullable=False) # e.g. "09:00 AM"
    end_time = Column(String(20), nullable=False) # e.g. "10:00 AM"
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String(50), default="Room 301")

    subject = relationship("Subject", back_populates="timetables")
    department = relationship("Department")

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=date.today)
    qr_token = Column(String(100), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    subject = relationship("Subject")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="SET NULL"), nullable=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=date.today)
    status = Column(String(20), default="Present") # Present, Absent, Late
    method = Column(String(20), default="Manual") # Manual, QR
    marked_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")

class Mark(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    exam_type = Column(String(50), nullable=False) # Internal 1, Internal 2, Lab Exam, Semester End, Assignment
    marks_obtained = Column(Float, nullable=False)
    max_marks = Column(Float, default=100.0)
    semester = Column(Integer, default=5)
    remarks = Column(String(255), nullable=True)
    entered_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    max_marks = Column(Float, default=20.0)
    due_date = Column(DateTime, nullable=False)
    file_url = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    submission_text = Column(Text, nullable=True)
    file_url = Column(String(255), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(30), default="Submitted") # Submitted, Late, Evaluated
    marks_awarded = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    graded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", back_populates="submissions")

class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="Academic") # Academic, Examination, Events, Department, General, Emergency
    priority = Column(String(30), default="Normal") # Low, Normal, Urgent
    target_role = Column(String(30), default="All") # All, Student, Faculty, HOD
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    attachment_url = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department")
    author = relationship("User", foreign_keys=[created_by])

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    event_date = Column(DateTime, nullable=False)
    venue = Column(String(150), nullable=False)
    category = Column(String(50), default="Technical") # Technical, Cultural, Sports, Workshop, Seminar
    max_participants = Column(Integer, default=200)
    organizer = Column(String(100), default="CampusConnect Student Council")
    image_url = Column(String(255), nullable=True)
    registration_open = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")

class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    registered_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="registrations")
    user = relationship("User", back_populates="event_registrations")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    attachment_url = Column(String(255), nullable=True)
    status = Column(String(30), default="Pending") # Pending, Approved, Rejected
    reviewer_remarks = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="leave_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

class CertificateRequest(Base):
    __tablename__ = "certificate_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    cert_type = Column(String(100), nullable=False) # Bonafide Certificate, Study Certificate, Transfer Certificate, Course Completion Certificate, Character Certificate
    purpose = Column(Text, nullable=False)
    status = Column(String(30), default="Pending") # Pending, Approved, Rejected
    certificate_number = Column(String(100), unique=True, index=True, nullable=True)
    verification_hash = Column(String(100), unique=True, index=True, nullable=True)
    qr_code_url = Column(String(255), nullable=True)
    issued_date = Column(Date, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="certificate_requests")
    approver = relationship("User", foreign_keys=[approved_by])

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), nullable=False) # Faculty, Course, Infrastructure, Library, Laboratory, Campus, General
    target_name = Column(String(100), nullable=False) # e.g. "Web Technologies" or "Main Library"
    rating = Column(Integer, default=5) # 1 to 5
    comments = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="feedbacks")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="General") # Attendance, Marks, Assignment, Notice, Leave, Certificate
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
