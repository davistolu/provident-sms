from rest_framework import serializers
from apps.schools.models import School, SchoolMembership, SchoolSettings
from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer

class SchoolSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolSettings
        fields = [
            'id', 'enable_positions', 'grading_system', 'academic_calendar_type',
            'receipt_prefix', 'invoice_prefix', 'admission_number_prefix'
        ]

class SchoolSerializer(serializers.ModelSerializer):
    settings = SchoolSettingsSerializer(read_only=True)

    class Meta:
        model = School
        fields = [
            'id', 'name', 'code', 'slug', 'motto', 'logo', 'email', 'phone',
            'address', 'city', 'state', 'country', 'timezone', 'currency',
            'currency_symbol', 'is_active', 'settings', 'created_at'
        ]
        read_only_fields = ['id', 'code', 'slug', 'created_at']

    def validate_logo(self, value):
        if not value:
            return value
        # Enforce max 2MB file size
        max_size = 2 * 1024 * 1024
        if hasattr(value, 'size') and value.size > max_size:
            raise serializers.ValidationError("School logo image must not exceed 2MB in file size.")
        
        # Enforce extension allowlist
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ['.png', '.jpg', '.jpeg', '.webp']:
            raise serializers.ValidationError("Unsupported image format. Allowed formats: PNG, JPG, JPEG, WEBP.")
        
        return value

class SchoolMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    email = serializers.EmailField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = SchoolMembership
        fields = [
            'id', 'school', 'user', 'role', 'role_display', 'is_active', 'is_default',
            'email', 'first_name', 'last_name', 'password', 'created_at'
        ]
        read_only_fields = ['id', 'school', 'created_at']

    def create(self, validated_data):
        email = validated_data.pop('email', None)
        first_name = validated_data.pop('first_name', '').strip()
        last_name = validated_data.pop('last_name', '').strip()
        password = validated_data.pop('password', None) or 'SchoolUser123!'
        school = validated_data.get('school')

        if email:
            normalized_email = email.lower().strip()
            user, created = User.objects.get_or_create(
                email=normalized_email,
                defaults={'first_name': first_name, 'last_name': last_name}
            )
            # SECURITY: Only set initial password if this user account was newly created
            # Never overwrite credentials for existing system users
            if created:
                user.set_password(password)
                user.first_name = first_name
                user.last_name = last_name
                user.save()
            validated_data['user'] = user

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Do not allow arbitrary mutation of user global details through membership endpoint
        validated_data.pop('first_name', None)
        validated_data.pop('last_name', None)
        validated_data.pop('email', None)
        validated_data.pop('password', None)
        return super().update(instance, validated_data)
