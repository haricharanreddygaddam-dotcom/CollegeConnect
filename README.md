# CampusConnect — Complete Centralized College Management Portal

CampusConnect is a production-ready, full-stack college management and academic automation portal designed for **Students, Faculty, Heads of Department (HOD), and Administrators**.

---

## 🌟 Interactive Features & Highlights

1. **⚡ 1-Click Interactive Role Switcher**:
   - Floating role switcher bar at the top of the app allowing instant live role-switching during demonstrations (Student, Faculty, HOD, Admin) without retyping credentials.
2. **📱 Live QR Code Attendance System**:
   - Faculty can generate dynamic time-expiring QR Attendance Sessions.
   - Students can scan or submit the live token with animated scanlines, laser viewfinder simulation, and celebratory confetti upon verification.
   - Built-in attendance warning indicators and **"Classes needed to reach 75%"** calculator.
3. **📜 Authentic Certificate Generator & Public QR Verification**:
   - Generates official University Certificates (Bonafide, Study, Transfer, Character) with college seals and signed QR codes.
   - Includes full-screen print/PDF export styling.
   - Public QR verification portal accessible at `/verify/:hash`.
4. **📊 Results & Continuous Evaluation Hub**:
   - Interactive SGPA/CGPA visual gauges and Recharts score distribution charts.
   - Real-time faculty mark entry interface with auto-percentage calculation.
5. **📅 Chronological Lecture Timetable**:
   - Today's lecture stream with room tags and faculty names.
   - Interactive weekly timetable matrix for Monday through Friday.
6. **📝 Coursework & Assignment Workspace**:
   - Simulated file attachment drag-and-drop.
   - Faculty grading modal with instant feedback and awarded score updates.
7. **📢 Official Notices & Circulars**:
   - Filterable categories (Academic, Examination, Events, Emergency) with priority indicators and broadcast composer.
8. **🎉 Campus Events & Activities Hub**:
   - Live RSVP toggle with animated attendee counter and category filters.
9. **🏖️ Multi-Step Leave Application Workflow**:
   - Student application with date picker -> Faculty/HOD approval pipeline with reviewer remarks.
10. **⭐ Institutional Feedback & Star Rating**:
    - Interactive 5-star appraisal widget with anonymous feedback support and administrative rating analytics.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Canvas Confetti |
| **Backend** | FastAPI (Python), Pydantic v2, JWT (HS256), Argon2/Bcrypt |
| **Database** | SQLAlchemy 2.0 ORM, PostgreSQL-ready (with SQLite out-of-the-box support & PRAGMA foreign keys) |
| **QR Code Engine** | Python `qrcode` + PIL image generation & validation |

---

## 👥 Demo Accounts (Pre-seeded)

| Role | Name | Email | Password |
|---|---|---|---|
| **Student** | Haricharan Reddy | `haricharan.reddy@campusconnect.edu` | `StudentPassword@123` |
| **Faculty** | Prof. David Thorne | `david.thorne@campusconnect.edu` | `FacultyPassword@123` |
| **HOD** | Dr. Sarah Mitchell | `hod.cse@campusconnect.edu` | `HodPassword@123` |
| **Admin** | Prof. Arthur Pendelton | `admin@campusconnect.edu` | `AdminPassword@123` |

---

## 🚀 Quick Start Guide

### Running Both Servers Together

From the `campusconnect` directory:
```bash
./start.sh
```

Or run backend and frontend separately:

### Backend
```bash
cd backend
source venv/bin/activate
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```
Backend Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Frontend
```bash
cd frontend
npm run dev
```
Frontend Portal: [http://localhost:5173](http://localhost:5173)

### Running Automated Test Suite
```bash
cd backend
PYTHONPATH=. venv/bin/pytest tests/test_api.py
```
