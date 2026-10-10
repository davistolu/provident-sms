from django.urls import path
from apps.accounts.views import (
    LoginView, LogoutView, UserProfileView, PasswordChangeView, RegisterAndOnboardView
)

urlpatterns = [
    path('register-onboard/', RegisterAndOnboardView.as_view(), name='register-onboard'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', PasswordChangeView.as_view(), name='change-password'),
]
