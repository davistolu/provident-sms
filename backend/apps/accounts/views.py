from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from apps.accounts.serializers import LoginSerializer, UserSerializer, SchoolMembershipDetailSerializer, PasswordChangeSerializer
from apps.schools.models import SchoolMembership

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        token, _ = Token.objects.get_or_create(user=user)
        memberships = SchoolMembership.objects.filter(user=user, is_active=True).select_related('school')
        active_membership = memberships.filter(is_default=True).first() or memberships.first()

        return Response({
            'status': 'success',
            'token': token.key,
            'user': UserSerializer(user).data,
            'memberships': SchoolMembershipDetailSerializer(memberships, many=True).data,
            'active_membership': SchoolMembershipDetailSerializer(active_membership).data if active_membership else None,
        })

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        logout(request)
        return Response({'status': 'success', 'message': 'Logged out successfully.'})

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        memberships = SchoolMembership.objects.filter(user=request.user, is_active=True).select_related('school')
        active_membership = getattr(request, 'school_membership', None) or memberships.filter(is_default=True).first() or memberships.first()
        return Response({
            'user': UserSerializer(request.user).data,
            'memberships': SchoolMembershipDetailSerializer(memberships, many=True).data,
            'active_membership': SchoolMembershipDetailSerializer(active_membership).data if active_membership else None,
        })

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'status': 'success', 'message': 'Password updated successfully.'})
