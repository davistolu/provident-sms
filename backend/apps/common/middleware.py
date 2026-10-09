from django.utils.deprecation import MiddlewareMixin
from apps.schools.models import SchoolMembership

class TenantHeaderMiddleware(MiddlewareMixin):
    """
    Resolves the active School and SchoolMembership for the authenticated user.
    Uses X-School-ID header if provided, otherwise falls back to the user's default/first active membership.
    """
    def process_request(self, request):
        request.school = None
        request.school_membership = None

        if hasattr(request, 'user') and request.user.is_authenticated:
            school_id = request.headers.get('X-School-ID')
            memberships = SchoolMembership.objects.filter(
                user=request.user,
                is_active=True
            ).select_related('school')

            if school_id:
                membership = memberships.filter(school_id=school_id).first()
            else:
                membership = memberships.first()

            if membership:
                request.school_membership = membership
                request.school = membership.school
