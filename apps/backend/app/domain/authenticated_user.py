from dataclasses import dataclass
from uuid import UUID


@dataclass
class AuthenticatedUser:
    id: UUID
    firebase_uid: str
    email: str
    role_name: str
    permissions: list[str]
    is_active: bool

    def has_permission(self, permission: str) -> bool:
        if "*" in self.permissions:
            return True
        return permission in self.permissions

    def has_role(self, *roles: str) -> bool:
        return self.role_name in roles
