from rest_framework import serializers
from django.contrib.auth import authenticate
from apps.accounts.models import User
from apps.schools.models import SchoolMembership

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'phone', 'is_active', 'is_staff', 'date_joined']
        read_only_fields = ['id', 'email', 'is_staff', 'is_active', 'date_joined']

class SchoolMembershipDetailSerializer(serializers.ModelSerializer):
    school_id = serializers.UUIDField(source='school.id', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    school_code = serializers.CharField(source='school.code', read_only=True)
    school_logo = serializers.ImageField(source='school.logo', read_only=True)
    currency_symbol = serializers.CharField(source='school.currency_symbol', read_only=True)

    class Meta:
        model = SchoolMembership
        fields = ['id', 'school_id', 'school_name', 'school_code', 'school_logo', 'currency_symbol', 'role', 'is_active', 'is_default']

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password')
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid email address or password.')
        if not user.is_active:
            raise serializers.ValidationError('This user account has been deactivated.')
        attrs['user'] = user
        return attrs

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_password(self, value):
        from django.contrib.auth.password_validation import validate_password
        user = self.context['request'].user
        validate_password(value, user=user)
        return value

class RegisterAndOnboardSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')

    school_name = serializers.CharField(max_length=255)
    school_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    motto = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    school_email = serializers.EmailField(required=False, allow_blank=True, default='')
    school_phone = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    address = serializers.CharField(required=False, allow_blank=True, default='')
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    state = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    country = serializers.CharField(max_length=100, required=False, default='Nigeria')
    currency_symbol = serializers.CharField(max_length=10, required=False, default='₦')
    session_name = serializers.CharField(max_length=50, required=False, default='2024/2025')
    stages = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=['NURSERY', 'PRIMARY', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY']
    )
    create_standard_classes = serializers.BooleanField(default=True)
    create_standard_subjects = serializers.BooleanField(default=True)
    create_standard_grading = serializers.BooleanField(default=True)

class CreateSchoolSerializer(serializers.Serializer):
    school_name = serializers.CharField(max_length=255)
    school_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    motto = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    address = serializers.CharField(required=False, allow_blank=True, default='')
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    state = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    country = serializers.CharField(max_length=100, required=False, default='Nigeria')
    currency_symbol = serializers.CharField(max_length=10, required=False, default='₦')
    session_name = serializers.CharField(max_length=50, required=False, default='2024/2025')
    stages = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=['NURSERY', 'PRIMARY', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY']
    )
    create_standard_classes = serializers.BooleanField(default=True)
    create_standard_subjects = serializers.BooleanField(default=True)
    create_standard_grading = serializers.BooleanField(default=True)
