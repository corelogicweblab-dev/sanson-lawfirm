from app.models import AuditLog, Permission, Role, User, UserProfile


def to_role_response(role: Role) -> dict:
    return {
        "id": str(role.id),
        "name": role.name.value,
        "display_name": role.display_name,
        "description": role.description,
        "created_at": role.created_at.isoformat(),
        "updated_at": role.updated_at.isoformat(),
    }


def to_permission_response(perm: Permission) -> dict:
    return {
        "id": str(perm.id),
        "name": perm.name,
        "display_name": perm.display_name,
        "description": perm.description,
        "module": perm.module,
        "created_at": perm.created_at.isoformat(),
        "updated_at": perm.updated_at.isoformat(),
    }


def to_profile_response(profile: UserProfile) -> dict:
    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "first_name": profile.first_name,
        "middle_name": profile.middle_name,
        "last_name": profile.last_name,
        "suffix": profile.suffix,
        "phone": profile.phone,
        "address": profile.address,
        "profile_photo": profile.profile_photo,
        "created_at": profile.created_at.isoformat(),
        "updated_at": profile.updated_at.isoformat(),
    }


def to_user_response(user: User) -> dict:
    return {
        "id": str(user.id),
        "firebase_uid": user.firebase_uid,
        "email": user.email,
        "role_id": str(user.role_id),
        "role": to_role_response(user.role) if user.role else None,
        "status": user.status.value,
        "is_active": user.is_active,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "profile": to_profile_response(user.profile) if user.profile else None,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
    }


def to_audit_response(log: AuditLog) -> dict:
    return {
        "id": str(log.id),
        "action": log.action,
        "actionType": log.action,
        "entity_type": log.entity_type,
        "entity_id": str(log.entity_id) if log.entity_id else None,
        "actor_id": str(log.performed_by) if log.performed_by else None,
        "actor_role": log.actor_role,
        "resource_type": log.resource_type or log.entity_type,
        "resource_id": str(log.resource_id or log.entity_id) if (log.resource_id or log.entity_id) else None,
        "performed_by": str(log.performed_by) if log.performed_by else None,
        "before_state": log.before_state or log.old_values,
        "after_state": log.after_state or log.new_values,
        "ip_address": str(log.ip_address) if log.ip_address else None,
        "device_id": str(log.device_id) if log.device_id else None,
        "correlation_id": log.correlation_id,
        "user_agent": log.user_agent,
        "old_values": log.old_values,
        "new_values": log.new_values,
        "metadata": log.metadata_,
        "created_at": log.created_at.isoformat(),
        "timestamp": log.created_at.isoformat(),
    }
