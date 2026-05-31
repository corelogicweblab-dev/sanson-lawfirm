from app.models.legal import (
    Appointment,
    Case,
    CaseActivity,
    CaseAssignment,
    CaseStatus,
    Comment,
    ConsultationNote,
    ConsultationOutcome,
    LegalRequest,
    Task,
    Timeline,
)


def _enum_val(v) -> str:
    return v.value if hasattr(v, "value") else str(v)


def to_case_status(s: CaseStatus) -> dict:
    return {
        "id": str(s.id),
        "name": s.name,
        "display_name": s.display_name,
        "color": s.color,
        "is_terminal": s.is_terminal,
    }


def to_legal_request(r: LegalRequest) -> dict:
    return {
        "id": str(r.id),
        "client_id": str(r.client_id),
        "request_reference": r.request_reference,
        "case_category": _enum_val(r.case_category),
        "subject": r.subject,
        "description": r.description,
        "status": _enum_val(r.status),
        "priority": _enum_val(r.priority),
        "requested_at": r.requested_at.isoformat(),
        "created_at": r.created_at.isoformat(),
        "updated_at": r.updated_at.isoformat(),
    }


def to_appointment(a: Appointment) -> dict:
    return {
        "id": str(a.id),
        "request_id": str(a.request_id),
        "client_id": str(a.client_id),
        "lawyer_id": str(a.lawyer_id) if a.lawyer_id else None,
        "appointment_date": a.appointment_date.isoformat(),
        "appointment_time": a.appointment_time.isoformat(),
        "consultation_type": _enum_val(a.consultation_type),
        "status": _enum_val(a.status),
        "remarks": a.remarks,
        "created_at": a.created_at.isoformat(),
        "updated_at": a.updated_at.isoformat(),
    }


def to_case(c: Case) -> dict:
    return {
        "id": str(c.id),
        "case_number": c.case_number,
        "request_id": str(c.request_id) if c.request_id else None,
        "client_id": str(c.client_id),
        "assigned_lawyer_id": str(c.assigned_lawyer_id) if c.assigned_lawyer_id else None,
        "assigned_paralegal_id": str(c.assigned_paralegal_id) if c.assigned_paralegal_id else None,
        "status": to_case_status(c.status) if c.status else None,
        "case_category": _enum_val(c.case_category),
        "source_type": _enum_val(c.source_type),
        "title": c.title,
        "description": c.description,
        "priority": _enum_val(c.priority),
        "opened_at": c.opened_at.isoformat() if c.opened_at else None,
        "closed_at": c.closed_at.isoformat() if c.closed_at else None,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),
        "master_data": getattr(c, "master_data", None) or {},
        "parties": [
            {
                "id": str(p.id),
                "party_role": p.party_role,
                "party_type": p.party_type,
                "full_name": p.full_name,
                "contact_phone": p.contact_phone,
                "contact_email": p.contact_email,
                "address": p.address,
                "province": p.province,
                "city": p.city,
                "relationship_to_case": p.relationship_to_case,
                "position_in_case": p.position_in_case,
                "notes": p.notes,
                "details": p.details or {},
            }
            for p in (getattr(c, "parties", None) or [])
        ],
    }


def to_case_activity(a: CaseActivity) -> dict:
    return {
        "id": str(a.id),
        "case_id": str(a.case_id),
        "activity_type": a.activity_type,
        "description": a.description,
        "performed_by": str(a.performed_by) if a.performed_by else None,
        "metadata": a.metadata_,
        "created_at": a.created_at.isoformat(),
    }


def to_assignment(a: CaseAssignment) -> dict:
    return {
        "id": str(a.id),
        "case_id": str(a.case_id),
        "assignee_id": str(a.assignee_id),
        "assignee_role": _enum_val(a.assignee_role),
        "assigned_by": str(a.assigned_by),
        "is_active": a.is_active,
        "notes": a.notes,
        "assigned_at": a.assigned_at.isoformat(),
        "ended_at": a.ended_at.isoformat() if a.ended_at else None,
    }


def to_task(t: Task) -> dict:
    return {
        "id": str(t.id),
        "case_id": str(t.case_id) if t.case_id else None,
        "request_id": str(t.request_id) if t.request_id else None,
        "assigned_to": str(t.assigned_to) if t.assigned_to else None,
        "created_by": str(t.created_by),
        "title": t.title,
        "description": t.description,
        "status": _enum_val(t.status),
        "priority": _enum_val(t.priority),
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        "created_at": t.created_at.isoformat(),
    }


def to_comment(c: Comment) -> dict:
    return {
        "id": str(c.id),
        "case_id": str(c.case_id),
        "user_id": str(c.user_id),
        "content": c.content,
        "parent_id": str(c.parent_id) if c.parent_id else None,
        "mentions": c.mentions or [],
        "created_at": c.created_at.isoformat(),
    }


def to_consultation_note(n: ConsultationNote) -> dict:
    return {
        "id": str(n.id),
        "appointment_id": str(n.appointment_id) if n.appointment_id else None,
        "request_id": str(n.request_id) if n.request_id else None,
        "lawyer_id": str(n.lawyer_id),
        "findings": n.findings,
        "legal_assessment": n.legal_assessment,
        "recommendations": n.recommendations,
        "missing_requirements": n.missing_requirements,
        "next_actions": n.next_actions,
        "created_at": n.created_at.isoformat(),
    }


def to_consultation_outcome(o: ConsultationOutcome) -> dict:
    return {
        "id": str(o.id),
        "appointment_id": str(o.appointment_id) if o.appointment_id else None,
        "request_id": str(o.request_id) if o.request_id else None,
        "outcome": _enum_val(o.outcome),
        "notes": o.notes,
        "recorded_by": str(o.recorded_by),
        "created_at": o.created_at.isoformat(),
    }


def to_timeline(t: Timeline) -> dict:
    return {
        "id": str(t.id),
        "case_id": str(t.case_id),
        "event_type": _enum_val(t.event_type),
        "event_date": t.event_date.isoformat(),
        "title": t.title,
        "description": t.description,
        "source": t.source,
        "reference_id": str(t.reference_id) if t.reference_id else None,
        "created_by": str(t.created_by) if t.created_by else None,
        "created_at": t.created_at.isoformat(),
    }

