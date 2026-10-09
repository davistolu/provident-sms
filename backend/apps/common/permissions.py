from rest_framework.permissions import BasePermission
from apps.schools.models import SchoolMembership

def resolve_membership_for_request(request):
    if not request.user or not request.user.is_authenticated:
        return None
    membership = getattr(request, 'school_membership', None)
    if not membership:
        school_id = request.headers.get('X-School-ID')
        qs = SchoolMembership.objects.filter(user=request.user, is_active=True).select_related('school')
        if school_id:
            membership = qs.filter(school_id=school_id).first()
        else:
            membership = qs.first()
        if membership:
            request.school_membership = membership
            request.school = membership.school
    return membership

class IsSchoolMember(BasePermission):
    """Allows access only to authenticated users with an active school membership."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        membership = resolve_membership_for_request(request)
        return membership is not None

class IsSchoolAdmin(BasePermission):
    """Allows access only to administrators/principals of the current school."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        membership = resolve_membership_for_request(request)
        if not membership:
            return False
        return membership.role in ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL', 'BURSAR']

class IsAssignedTeacher(BasePermission):
    """Allows access to teachers belonging to the school."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        membership = resolve_membership_for_request(request)
        if not membership:
            return False
        return membership.role in ['TEACHER', 'ADMIN', 'SUPER_ADMIN', 'PRINCIPAL']

class IsSchoolAdminOrReadOnly(BasePermission):
    """Allows full access to Admins, read-only to others in the school."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        membership = resolve_membership_for_request(request)
        if not membership:
            return False
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return membership.role in ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL']
