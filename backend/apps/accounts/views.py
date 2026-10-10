from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from apps.accounts.models import User
from apps.accounts.serializers import (
    LoginSerializer, UserSerializer, SchoolMembershipDetailSerializer,
    PasswordChangeSerializer, RegisterAndOnboardSerializer
)
from apps.schools.models import SchoolMembership
from apps.schools.services import SchoolProvisioningService

class RegisterAndOnboardView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = RegisterAndOnboardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email = data['email'].lower().strip()
        user = User.objects.filter(email=email).first()

        if user:
            if not user.check_password(data['password']):
                return Response(
                    {'error': 'An account with this email already exists. Please verify your password to attach a new school.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            user = User.objects.create_user(
                email=email,
                password=data['password'],
                first_name=data['first_name'].strip(),
                last_name=data['last_name'].strip(),
                phone=data.get('phone', '').strip(),
                is_staff=True
            )

        school, membership = SchoolProvisioningService.provision_school(
            user=user,
            school_name=data['school_name'],
            motto=data.get('motto', ''),
            email=data.get('school_email', ''),
            phone=data.get('school_phone', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            country=data.get('country', 'Nigeria'),
            currency_symbol=data.get('currency_symbol', '₦'),
            session_name=data.get('session_name', '2024/2025'),
            stages=data.get('stages'),
            create_standard_classes=data.get('create_standard_classes', True),
            create_standard_subjects=data.get('create_standard_subjects', True),
            create_standard_grading=data.get('create_standard_grading', True),
            school_code=data.get('school_code')
        )

        token, _ = Token.objects.get_or_create(user=user)
        memberships = SchoolMembership.objects.filter(user=user, is_active=True).select_related('school')

        return Response({
            'status': 'success',
            'message': f"School '{school.name}' provisioned successfully.",
            'token': token.key,
            'user': UserSerializer(user).data,
            'memberships': SchoolMembershipDetailSerializer(memberships, many=True).data,
            'active_membership': SchoolMembershipDetailSerializer(membership).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'auth'

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
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        # Token rotation & session invalidation for defense-in-depth
        Token.objects.filter(user=request.user).delete()
        new_token = Token.objects.create(user=request.user)

        return Response({
            'status': 'success',
            'message': 'Password updated successfully.',
            'token': new_token.key
        })
