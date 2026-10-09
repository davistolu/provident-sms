from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Interactive Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Core API v1 routes
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.schools.urls')),
    path('api/v1/academics/', include('apps.academics.urls')),
    path('api/v1/students/', include('apps.students.urls')),
    path('api/v1/attendance/', include('apps.attendance.urls')),
    path('api/v1/assessments/', include('apps.assessments.urls')),
    path('api/v1/results/', include('apps.results.urls')),
    path('api/v1/finance/', include('apps.finance.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
