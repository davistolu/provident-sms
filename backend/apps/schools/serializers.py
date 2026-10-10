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
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        password = validated_data.pop('password', None) or 'SchoolUser123!'
        role = validated_data.get('role', SchoolMembership.RoleChoices.TEACHER)
        school = validated_data.get('school')

        if email:
            user, created = User.objects.get_or_create(
                email=email.lower().strip(),
                defaults={'first_name': first_name, 'last_name': last_name}
            )
            if created or password:
                user.set_password(password)
                user.first_name = first_name or user.first_name
                user.last_name = last_name or user.last_name
                user.save()
            validated_data['user'] = user

        return super().create(validated_data)

    def update(self, instance, validated_data):
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        if instance.user and (first_name is not None or last_name is not None):
            if first_name is not None:
                instance.user.first_name = first_name
            if last_name is not None:
                instance.user.last_name = last_name
            instance.user.save()
        return super().update(instance, validated_data)
