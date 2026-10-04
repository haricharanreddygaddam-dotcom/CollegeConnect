import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import CertificateRequest, Student, User, Faculty
from app.schemas import (
    CertificateRequestCreate, CertificateReview, CertificateOut
)
from app.dependencies import get_current_user, require_roles
from app.utils.qr import generate_qr_code_image

router = APIRouter(prefix="/certificates", tags=["Certificate Management"])

@router.get("/", response_model=List[CertificateOut])
def get_certificate_requests(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(CertificateRequest).join(Student).join(User, Student.user_id == User.id)

    if user.role == "student":
        stud = db.query(Student).filter(Student.user_id == user.id).first()
        if not stud:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found",
            )
        query = query.filter(CertificateRequest.student_id == stud.id)

    elif user.role == "hod":
        faculty = db.query(Faculty).filter(
            Faculty.user_id == user.id
        ).first()
        if not faculty:
            raise HTTPException(
                status_code=404,
                detail="Faculty profile not found",
            )

        query = query.filter(
            Student.department_id == faculty.department_id
        )

    if status_filter and status_filter != "All":
        query = query.filter(CertificateRequest.status == status_filter)

    certs = query.order_by(CertificateRequest.created_at.desc()).all()
    results = []
    for c in certs:
        results.append(CertificateOut(
            id=c.id,
            student_id=c.student_id,
            student_name=c.student.user.name if c.student and c.student.user else None,
            student_roll=c.student.roll_number if c.student else None,
            department_name=c.student.department.name if c.student and c.student.department else None,
            admission_year=c.student.admission_year if c.student else None,
            cgpa=c.student.cgpa if c.student else None,
            cert_type=c.cert_type,
            purpose=c.purpose,
            status=c.status,
            certificate_number=c.certificate_number,
            verification_hash=c.verification_hash,
            qr_code_url=c.qr_code_url,
            issued_date=c.issued_date,
            created_at=c.created_at
        ))
    return results

@router.post("/", response_model=CertificateOut)
def request_certificate(
    cert_in: CertificateRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["student"]))
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    cert = CertificateRequest(
        student_id=student.id,
        cert_type=cert_in.cert_type,
        purpose=cert_in.purpose,
        status="Pending"
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    return CertificateOut(
        id=cert.id,
        student_id=cert.student_id,
        student_name=user.name,
        student_roll=student.roll_number,
        department_name=student.department.name if student.department else None,
        admission_year=student.admission_year,
        cgpa=student.cgpa,
        cert_type=cert.cert_type,
        purpose=cert.purpose,
        status=cert.status,
        created_at=cert.created_at
    )

@router.post("/{cert_id}/review", response_model=CertificateOut)
def review_certificate(
    cert_id: int,
    review_in: CertificateReview,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "hod"]))
):
    cert = (
        db.query(CertificateRequest)
        .join(Student, CertificateRequest.student_id == Student.id)
        .filter(CertificateRequest.id == cert_id)
        .first()
    )
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate request not found")

    if user.role == "hod":
        faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty profile not found")

        if cert.student.department_id != faculty.department_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized for this department",
            )

    cert.status = review_in.status
    cert.approved_by = user.id

    if review_in.status == "Approved":
        cert.issued_date = date.today()
        cert_num = f"CC-2026-{1000 + cert.id:04d}"
        v_hash = uuid.uuid4().hex[:12]
        cert.certificate_number = cert_num
        cert.verification_hash = v_hash

        verification_url = f"https://campusconnect.edu/verify/{v_hash}"
        qr_url = generate_qr_code_image(verification_url, filename_prefix=f"cert_{v_hash}")
        cert.qr_code_url = qr_url

    db.commit()
    db.refresh(cert)

    return CertificateOut(
        id=cert.id,
        student_id=cert.student_id,
        student_name=cert.student.user.name if cert.student and cert.student.user else None,
        student_roll=cert.student.roll_number if cert.student else None,
        department_name=cert.student.department.name if cert.student and cert.student.department else None,
        admission_year=cert.student.admission_year if cert.student else None,
        cgpa=cert.student.cgpa if cert.student else None,
        cert_type=cert.cert_type,
        purpose=cert.purpose,
        status=cert.status,
        certificate_number=cert.certificate_number,
        verification_hash=cert.verification_hash,
        qr_code_url=cert.qr_code_url,
        issued_date=cert.issued_date,
        created_at=cert.created_at
    )

@router.get("/verify/{verification_hash}")
def verify_certificate_public(
    verification_hash: str,
    db: Session = Depends(get_db)
):
    """Public verification endpoint for scanned QR codes on certificates."""
    cert = db.query(CertificateRequest).filter(
        CertificateRequest.verification_hash == verification_hash,
        CertificateRequest.status == "Approved"
    ).first()

    if not cert:
        return {
            "valid": False,
            "message": "Certificate not found or has been revoked."
        }

    return {
        "valid": True,
        "message": "Certificate is genuine and verified by CampusConnect University Registrar.",
        "certificate_number": cert.certificate_number,
        "student_name": cert.student.user.name if cert.student and cert.student.user else "N/A",
        "roll_number": cert.student.roll_number if cert.student else "N/A",
        "department": cert.student.department.name if cert.student and cert.student.department else "N/A",
        "certificate_type": cert.cert_type,
        "purpose": cert.purpose,
        "issued_date": str(cert.issued_date),
        "institution": "CampusConnect Institute of Technology & Engineering",
        "seal_verified": True
    }
