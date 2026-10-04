import uuid
from datetime import datetime, date, timedelta
from app.core.time import utc_now_naive
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models import (
    User, Department, Student, Faculty, Subject, Timetable,
    AttendanceRecord, Mark, Assignment, AssignmentSubmission,
    Notice, Event, EventRegistration, LeaveRequest, CertificateRequest,
    Feedback, Notification
)
from app.utils.qr import generate_qr_code_image

def seed_database(db: Session):
    # Check if database is already seeded
    if db.query(User).count() > 0:
        return

    print("🚀 Seeding CampusConnect complete college database...")

    # 1. Create Departments
    dept_cse = Department(
        name="Computer Science & Engineering",
        code="CSE",
        description="Department of Computer Science & Engineering - Center of Excellence in Computing",
        building="Block A - Turing Hall"
    )
    dept_ece = Department(
        name="Electronics & Communication Engineering",
        code="ECE",
        description="Department of ECE - Signal Processing, VLSI & Embedded Systems",
        building="Block B - Maxwell Hall"
    )
    dept_it = Department(
        name="Information Technology",
        code="IT",
        description="Department of IT - Enterprise Applications & Cloud Computing",
        building="Block C - Berners-Lee Hall"
    )
    dept_mech = Department(
        name="Mechanical Engineering",
        code="MECH",
        description="Department of Mechanical Engineering - Robotics & Thermal Systems",
        building="Block D - Newton Hall"
    )
    db.add_all([dept_cse, dept_ece, dept_it, dept_mech])
    db.commit()

    # 2. Create Users & Profiles
    # Admin
    admin_user = User(
        name="Prof. Arthur Pendelton",
        email="admin@campusconnect.edu",
        password_hash=get_password_hash("AdminPassword@123"),
        role="admin",
        avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    )
    db.add(admin_user)
    db.commit()

    # HOD CSE
    hod_user = User(
        name="Dr. Sarah Mitchell",
        email="hod.cse@campusconnect.edu",
        password_hash=get_password_hash("HodPassword@123"),
        role="hod",
        avatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
    )
    db.add(hod_user)
    db.commit()

    hod_faculty = Faculty(
        user_id=hod_user.id,
        employee_id="FAC-CSE-001",
        department_id=dept_cse.id,
        designation="Professor & Head of Department",
        experience_years=15,
        phone="+91 98765 43210",
        office_room="Block A, Room 101",
        qualification="Ph.D in Machine Learning (Stanford)"
    )
    db.add(hod_faculty)
    dept_cse.hod_id = hod_user.id
    db.commit()

    # Faculty 1 (David Thorne - Web Tech & AI)
    f1_user = User(
        name="Prof. David Thorne",
        email="david.thorne@campusconnect.edu",
        password_hash=get_password_hash("FacultyPassword@123"),
        role="faculty",
        avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    )
    db.add(f1_user)
    db.commit()
    f1 = Faculty(
        user_id=f1_user.id,
        employee_id="FAC-CSE-002",
        department_id=dept_cse.id,
        designation="Associate Professor",
        experience_years=8,
        phone="+91 98765 43211",
        office_room="Block A, Room 204",
        qualification="M.Tech (IIT Madras), Ph.D (Pursuing)"
    )
    db.add(f1)

    # Faculty 2 (Elena Rostova - DBMS)
    f2_user = User(
        name="Dr. Elena Rostova",
        email="elena.rostova@campusconnect.edu",
        password_hash=get_password_hash("FacultyPassword@123"),
        role="faculty",
        avatar="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
    )
    db.add(f2_user)
    db.commit()
    f2 = Faculty(
        user_id=f2_user.id,
        employee_id="FAC-CSE-003",
        department_id=dept_cse.id,
        designation="Assistant Professor (Senior)",
        experience_years=6,
        phone="+91 98765 43212",
        office_room="Block A, Room 205",
        qualification="Ph.D in Distributed Databases"
    )
    db.add(f2)

    # Faculty 3 (Marcus Vance - Networks & Cyber Security)
    f3_user = User(
        name="Prof. Marcus Vance",
        email="marcus.vance@campusconnect.edu",
        password_hash=get_password_hash("FacultyPassword@123"),
        role="faculty",
        avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
    )
    db.add(f3_user)
    db.commit()
    f3 = Faculty(
        user_id=f3_user.id,
        employee_id="FAC-CSE-004",
        department_id=dept_cse.id,
        designation="Assistant Professor",
        experience_years=5,
        phone="+91 98765 43213",
        office_room="Block A, Room 206",
        qualification="M.S in Information Security (Carnegie Mellon)"
    )
    db.add(f3)
    db.commit()

    # 3. Create Subjects
    sub_wt = Subject(
        name="Web Technologies & Cloud Applications",
        code="CS501WT",
        credits=4,
        department_id=dept_cse.id,
        semester=5,
        faculty_id=f1.id
    )
    sub_dbms = Subject(
        name="Database Management Systems & SQL",
        code="CS502DB",
        credits=4,
        department_id=dept_cse.id,
        semester=5,
        faculty_id=f2.id
    )
    sub_cn = Subject(
        name="Computer Networks & Protocols",
        code="CS503CN",
        credits=3,
        department_id=dept_cse.id,
        semester=5,
        faculty_id=f3.id
    )
    sub_ai = Subject(
        name="Artificial Intelligence & Neural Networks",
        code="CS504AI",
        credits=4,
        department_id=dept_cse.id,
        semester=5,
        faculty_id=f1.id
    )
    sub_cs = Subject(
        name="Cyber Security & Cryptography",
        code="CS505CS",
        credits=3,
        department_id=dept_cse.id,
        semester=5,
        faculty_id=f3.id
    )
    db.add_all([sub_wt, sub_dbms, sub_cn, sub_ai, sub_cs])
    db.commit()

    # 4. Create Students
    students_data = [
        ("Haricharan Reddy", "haricharan.reddy@campusconnect.edu", "21A81A0501", 3, 5, "A", "+91 91234 56780", "14/A Royal Palm St, Hyderabad", "K. V. Reddy", "+91 91234 56789", 8.8, "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"),
        ("Ananya Sharma", "ananya.sharma@campusconnect.edu", "21A81A0502", 3, 5, "A", "+91 91234 56781", "B-201 Silicon Valley, Hyderabad", "R. K. Sharma", "+91 91234 56788", 9.2, "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"),
        ("Rohit Varma", "rohit.varma@campusconnect.edu", "21A81A0503", 3, 5, "A", "+91 91234 56782", "Flat 402 Green Meadows, Hyderabad", "V. Varma", "+91 91234 56787", 7.9, "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"),
        ("Priya Nair", "priya.nair@campusconnect.edu", "21A81A0504", 3, 5, "A", "+91 91234 56783", "Villa 8 Lotus County, Hyderabad", "M. Nair", "+91 91234 56786", 9.4, "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"),
        ("Karthik Rajan", "karthik.rajan@campusconnect.edu", "21A81A0505", 3, 5, "A", "+91 91234 56784", "Plot 55 Jubilee Enclave, Hyderabad", "S. Rajan", "+91 91234 56785", 8.2, "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150"),
        ("Sneha Patel", "sneha.patel@campusconnect.edu", "21A81A0506", 3, 5, "A", "+91 91234 56795", "H-12 Hill Crest, Hyderabad", "D. Patel", "+91 91234 56796", 8.6, "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150"),
    ]

    created_students = []
    for name, email, roll, year, sem, sec, phone, addr, parent, p_phone, cgpa, avatar in students_data:
        u = User(
            name=name,
            email=email,
            password_hash=get_password_hash("StudentPassword@123"),
            role="student",
            avatar=avatar
        )
        db.add(u)
        db.commit()
        s = Student(
            user_id=u.id,
            roll_number=roll,
            department_id=dept_cse.id,
            year=year,
            semester=sem,
            section=sec,
            phone=phone,
            address=addr,
            parent_name=parent,
            parent_phone=p_phone,
            admission_year=2023,
            cgpa=cgpa
        )
        db.add(s)
        created_students.append(s)
    db.commit()

    main_student = created_students[0] # Haricharan Reddy

    # 5. Timetable Schedule (Mon-Fri)
    tt_slots = [
        # Monday
        (dept_cse.id, 5, "A", "Monday", "09:00 AM", "10:00 AM", sub_wt.id, "Lab 402 - Cloud Tech"),
        (dept_cse.id, 5, "A", "Monday", "10:00 AM", "11:00 AM", sub_dbms.id, "Room 301 - Block A"),
        (dept_cse.id, 5, "A", "Monday", "11:15 AM", "12:15 PM", sub_ai.id, "Room 301 - Block A"),
        (dept_cse.id, 5, "A", "Monday", "01:15 PM", "02:15 PM", sub_cn.id, "Room 302 - Block A"),
        (dept_cse.id, 5, "A", "Monday", "02:15 PM", "03:15 PM", sub_cs.id, "Security Lab 2"),
        # Tuesday
        (dept_cse.id, 5, "A", "Tuesday", "09:00 AM", "10:00 AM", sub_dbms.id, "Room 301 - Block A"),
        (dept_cse.id, 5, "A", "Tuesday", "10:00 AM", "11:00 AM", sub_wt.id, "Lab 402 - Cloud Tech"),
        (dept_cse.id, 5, "A", "Tuesday", "11:15 AM", "12:15 PM", sub_cn.id, "Room 302 - Block A"),
        (dept_cse.id, 5, "A", "Tuesday", "01:15 PM", "03:15 PM", sub_wt.id, "Web Dev Practical Studio"),
        # Wednesday
        (dept_cse.id, 5, "A", "Wednesday", "09:00 AM", "10:00 AM", sub_ai.id, "Room 301 - Block A"),
        (dept_cse.id, 5, "A", "Wednesday", "10:00 AM", "11:00 AM", sub_cs.id, "Room 301 - Block A"),
        (dept_cse.id, 5, "A", "Wednesday", "11:15 AM", "12:15 PM", sub_dbms.id, "DBMS Lab"),
        (dept_cse.id, 5, "A", "Wednesday", "01:15 PM", "02:15 PM", sub_wt.id, "Room 301 - Block A"),
        # Thursday
        (dept_cse.id, 5, "A", "Thursday", "09:00 AM", "10:00 AM", sub_cn.id, "Room 302 - Block A"),
        (dept_cse.id, 5, "A", "Thursday", "10:00 AM", "11:00 AM", sub_ai.id, "Room 301 - Block A"),
        (dept_cse.id, 5, "A", "Thursday", "11:15 AM", "12:15 PM", sub_wt.id, "Lab 402 - Cloud Tech"),
        (dept_cse.id, 5, "A", "Thursday", "01:15 PM", "03:15 PM", sub_ai.id, "AI Research Lab"),
        # Friday
        (dept_cse.id, 5, "A", "Friday", "09:00 AM", "10:00 AM", sub_cs.id, "Security Lab 2"),
        (dept_cse.id, 5, "A", "Friday", "10:00 AM", "11:00 AM", sub_cn.id, "Room 302 - Block A"),
        (dept_cse.id, 5, "A", "Friday", "11:15 AM", "12:15 PM", sub_dbms.id, "Room 301 - Block A"),
        (dept_cse.id, 5, "A", "Friday", "01:15 PM", "03:15 PM", sub_cs.id, "Cryptography Workshop"),
    ]

    for d_id, sem, sec, day, start, end, s_id, room in tt_slots:
        tt = Timetable(
            department_id=d_id,
            semester=sem,
            section=sec,
            day_of_week=day,
            start_time=start,
            end_time=end,
            subject_id=s_id,
            room_number=room
        )
        db.add(tt)
    db.commit()

    # 6. Seed Attendance History (Past 24 dates)
    subjects_list = [sub_wt, sub_dbms, sub_cn, sub_ai, sub_cs]
    today = date.today()
    for days_ago in range(24, 0, -1):
        dt = today - timedelta(days=days_ago)
        if dt.weekday() >= 5: # Skip weekends
            continue
        for s in created_students:
            for subj in subjects_list:
                # Haricharan has high attendance (around 90%), others realistic
                status = "Present"
                if s.id == main_student.id and (days_ago in [7, 14, 21]) and subj.code == "CS503CN":
                    status = "Absent"
                elif (days_ago + s.id + subj.id) % 9 == 0:
                    status = "Absent"

                rec = AttendanceRecord(
                    student_id=s.id,
                    subject_id=subj.id,
                    date=dt,
                    status=status,
                    method="QR" if days_ago % 2 == 0 else "Manual",
                    marked_at=datetime.combine(dt, datetime.min.time()) + timedelta(hours=9, minutes=15)
                )
                db.add(rec)
    db.commit()

    # 7. Seed Marks
    exam_configs = [
        ("Internal 1", 30.0),
        ("Internal 2", 30.0),
        ("Mid-Term Exam", 50.0),
        ("Lab Evaluation", 25.0)
    ]
    marks_distribution = {
        sub_wt.id: [28.5, 27.0, 47.0, 24.0],
        sub_dbms.id: [27.0, 28.0, 44.5, 23.5],
        sub_cn.id: [25.0, 26.5, 42.0, 22.0],
        sub_ai.id: [29.5, 29.0, 48.5, 25.0],
        sub_cs.id: [26.5, 27.5, 45.0, 23.0],
    }
    for subj_id, scores in marks_distribution.items():
        for idx, (exam_type, max_m) in enumerate(exam_configs):
            # Add for Haricharan
            m1 = Mark(
                student_id=main_student.id,
                subject_id=subj_id,
                exam_type=exam_type,
                marks_obtained=scores[idx],
                max_marks=max_m,
                semester=5,
                remarks="Excellent conceptual depth and clean code" if scores[idx] > 0.85 * max_m else "Good performance",
                entered_by=f1_user.id
            )
            db.add(m1)
            # Add for other students
            for s in created_students[1:]:
                offset = (s.id * 1.5) % 4
                obtained = max(12.0, round(scores[idx] - offset, 1))
                m2 = Mark(
                    student_id=s.id,
                    subject_id=subj_id,
                    exam_type=exam_type,
                    marks_obtained=obtained,
                    max_marks=max_m,
                    semester=5,
                    remarks="Consistent work",
                    entered_by=f1_user.id
                )
                db.add(m2)
    db.commit()

    # 8. Seed Assignments & Submissions
    a1 = Assignment(
        subject_id=sub_wt.id,
        title="REST API Architecture & Microservices with FastAPI",
        description="Design and build a modular REST API with JWT authentication, relational models in SQLAlchemy, and interactive OpenAPI documentation.",
        max_marks=20.0,
        due_date=utc_now_naive() + timedelta(days=5),
        created_by=f1_user.id
    )
    a2 = Assignment(
        subject_id=sub_dbms.id,
        title="Database Normalization (BCNF) & Complex Query Optimization",
        description="Solve ER diagram case studies, reduce relations to BCNF, and write optimized SQL queries utilizing B-tree indexing strategies.",
        max_marks=20.0,
        due_date=utc_now_naive() + timedelta(days=3),
        created_by=f2_user.id
    )
    a3 = Assignment(
        subject_id=sub_ai.id,
        title="Convolutional Neural Network for Medical Image Classification",
        description="Implement a PyTorch CNN model to classify X-Ray scans with >92% validation accuracy and plot confusion matrix metrics.",
        max_marks=25.0,
        due_date=utc_now_naive() + timedelta(days=8),
        created_by=f1_user.id
    )
    db.add_all([a1, a2, a3])
    db.commit()

    # Submissions for a1 & a2 by main student
    subm1 = AssignmentSubmission(
        assignment_id=a1.id,
        student_id=main_student.id,
        submission_text="Completed FastAPI RESTful services implementation with Pydantic v2 schemas and unit tests. GitHub repo: https://github.com/haricharan/fastapi-campus-api",
        status="Submitted",
        submitted_at=utc_now_naive() - timedelta(hours=6)
    )
    subm2 = AssignmentSubmission(
        assignment_id=a2.id,
        student_id=main_student.id,
        submission_text="Submitted full normalization report and indexed schema queries.",
        status="Evaluated",
        marks_awarded=19.5,
        feedback="Outstanding schema diagram and query plan analysis! Keep it up.",
        graded_by=f2_user.id,
        submitted_at=utc_now_naive() - timedelta(days=2)
    )
    db.add_all([subm1, subm2])
    db.commit()

    # 9. Seed Notices
    n1 = Notice(
        title="📅 Mid-Semester Examination Timetable & Seating Guidelines Released",
        content="The official schedule for Semester 5 Mid-Term examinations is now published. All students are required to carry their physical ID card and report 15 minutes prior to commencement.",
        category="Examination",
        priority="Urgent",
        target_role="All",
        department_id=None,
        created_by=admin_user.id
    )
    n2 = Notice(
        title="🚀 Annual National Hackathon: HACK-CAMPUS 2026 Registration Open",
        content="Registrations are now open for the 36-hour inter-college hackathon hosted by the Dept of CSE in collaboration with Google Cloud & IEEE. Cash prizes worth ₹2,50,000!",
        category="Events",
        priority="Normal",
        target_role="Student",
        department_id=dept_cse.id,
        created_by=f1_user.id
    )
    n3 = Notice(
        title="💡 Guest Lecture on Generative AI & Large Language Models in Production",
        content="Join us for a specialized industry keynote by AI Research Engineers from Google DeepMind on Thursday at 3:00 PM in the Block A Turing Auditorium.",
        category="Academic",
        priority="Normal",
        target_role="All",
        department_id=dept_cse.id,
        created_by=hod_user.id
    )
    n4 = Notice(
        title="⚠️ Maintenance Alert: Campus High-Speed WiFi Network Upgrade",
        content="The campus networking team will perform core routing hardware maintenance on Sunday from 1:00 AM to 5:00 AM. Academic portal access will remain uninterrupted.",
        category="General",
        priority="Low",
        target_role="All",
        department_id=None,
        created_by=admin_user.id
    )
    db.add_all([n1, n2, n3, n4])
    db.commit()

    # 10. Seed Events
    e1 = Event(
        title="CAMPUS-TECHFEST 2026: National Tech Symposium",
        description="The biggest annual technology festival of our institution featuring Hackathons, Robotics Arenas, Coding Challenges, Gaming Tournaments, and Startup Pitching.",
        event_date=utc_now_naive() + timedelta(days=12),
        venue="Block A & Central Auditorium",
        category="Technical",
        max_participants=500,
        organizer="Department of CSE & Student Council",
        registration_open=True
    )
    e2 = Event(
        title="Google Cloud & AI Developer Summit",
        description="Hands-on workshop on training, tuning, and deploying AI models on cloud infrastructure with live credit vouchers.",
        event_date=utc_now_naive() + timedelta(days=6),
        venue="Turing Hall - 402",
        category="Workshop",
        max_participants=120,
        organizer="Google Developer Student Club (GDSC)",
        registration_open=True
    )
    e3 = Event(
        title="Inter-Department Annual Cricket Championship",
        description="Cheer for your department in the thrilling 20-over league stage matches on the university ground.",
        event_date=utc_now_naive() + timedelta(days=18),
        venue="Campus Main Sports Ground",
        category="Sports",
        max_participants=250,
        organizer="CampusConnect Sports Committee",
        registration_open=True
    )
    db.add_all([e1, e2, e3])
    db.commit()

    # Register main student for e1 & e2
    db.add(EventRegistration(event_id=e1.id, user_id=main_student.user_id))
    db.add(EventRegistration(event_id=e2.id, user_id=main_student.user_id))
    db.commit()

    # 11. Seed Leave Requests
    lr1 = LeaveRequest(
        student_id=main_student.id,
        from_date=today + timedelta(days=10),
        to_date=today + timedelta(days=12),
        reason="Representing College at the Smart India National Hackathon Grand Finale in Bangalore.",
        status="Approved",
        reviewer_remarks="Permission granted. All the very best for the finals!",
        reviewed_by=hod_user.id
    )
    lr2 = LeaveRequest(
        student_id=main_student.id,
        from_date=today - timedelta(days=5),
        to_date=today - timedelta(days=4),
        reason="Viral fever and recovery as advised by medical officer.",
        status="Approved",
        reviewer_remarks="Approved based on medical certificate.",
        reviewed_by=f1_user.id
    )
    lr3 = LeaveRequest(
        student_id=created_students[1].id, # Ananya
        from_date=today + timedelta(days=2),
        to_date=today + timedelta(days=3),
        reason="Attending cousin's wedding in home town.",
        status="Pending"
    )
    db.add_all([lr1, lr2, lr3])
    db.commit()

    # 12. Seed Certificates with Signed QR Code
    v_hash = "cc89f2a41d01"
    cert_num = "CC-2026-001245"
    verification_url = f"https://campusconnect.edu/verify/{v_hash}"
    qr_url = generate_qr_code_image(verification_url, filename_prefix=f"cert_{v_hash}")

    c1 = CertificateRequest(
        student_id=main_student.id,
        cert_type="Bonafide Certificate",
        purpose="Application for Google Student Internship & Passport Verification",
        status="Approved",
        certificate_number=cert_num,
        verification_hash=v_hash,
        qr_code_url=qr_url,
        issued_date=today - timedelta(days=2),
        approved_by=admin_user.id
    )
    c2 = CertificateRequest(
        student_id=main_student.id,
        cert_type="Study Certificate",
        purpose="National Merit Scholarship Renewal",
        status="Pending"
    )
    db.add_all([c1, c2])
    db.commit()

    # 13. Seed Feedback
    fb1 = Feedback(
        student_id=main_student.id,
        category="Faculty",
        target_name="Prof. David Thorne (Web Tech)",
        rating=5,
        comments="Engaging practical sessions, real-world coding examples, and interactive project mentorship!",
        is_anonymous=False
    )
    fb2 = Feedback(
        student_id=created_students[1].id,
        category="Course",
        target_name="Database Management Systems",
        rating=5,
        comments="Very clear explanations of query optimizations and indexing strategies.",
        is_anonymous=True
    )
    fb3 = Feedback(
        student_id=main_student.id,
        category="Infrastructure",
        target_name="Computer Science High Performance Lab",
        rating=4,
        comments="High-speed systems and dual monitors are great, adding GPU nodes would be awesome.",
        is_anonymous=False
    )
    db.add_all([fb1, fb2, fb3])
    db.commit()

    # 14. Seed Notifications for users
    n_student = [
        Notification(
            user_id=main_student.user_id,
            title="Certificate Approved & Issued! 🎉",
            message="Your Bonafide Certificate (CC-2026-001245) is verified and ready for download.",
            category="Certificate",
            link="/student/certificates"
        ),
        Notification(
            user_id=main_student.user_id,
            title="New Assignment Posted 📝",
            message="Prof. David Thorne published: 'REST API Architecture with FastAPI'. Due in 5 days.",
            category="Assignment",
            link="/student/assignments"
        ),
        Notification(
            user_id=main_student.user_id,
            title="Leave Request Approved ✅",
            message="Your leave request for National Hackathon (10-12 Oct) has been approved by HOD.",
            category="Leave",
            link="/student/leaves"
        ),
        Notification(
            user_id=main_student.user_id,
            title="Attendance Status 📊",
            message="Your overall semester attendance stands at a solid 88.4%. Keep up the consistency!",
            category="Attendance",
            link="/student/attendance"
        )
    ]
    db.add_all(n_student)
    db.commit()

    print("✅ CampusConnect database seeding completed successfully!")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
