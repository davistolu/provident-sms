from rest_framework import serializers
from django.contrib.auth import authenticate
from apps.accounts.models import User
from apps.schools.models import SchoolMembership

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'phone', 'is_active', 'is_staff', 'date_joined']
        read_only_fields = ['id', 'date_joined']

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
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value
