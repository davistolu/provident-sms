from rest_framework import serializers
from apps.schools.models import School, SchoolMembership, SchoolSettings
from apps.accounts.serializers import UserSerializer

class SchoolSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolSettings
        fields = ['id', 'enable_positions', 'grading_system', 'academic_calendar_type', 'receipt_prefix', 'invoice_prefix', 'admission_number_prefix']

class SchoolSerializer(serializers.ModelSerializer):
    settings = SchoolSettingsSerializer(read_only=True)

    class Meta:
        model = School
        fields = [
            'id', 'name', 'code', 'slug', 'motto', 'logo', 'email', 'phone',
            'address', 'city', 'state', 'country', 'timezone', 'currency',
            'currency_symbol', 'is_active', 'settings', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class SchoolMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = SchoolMembership
        fields = ['id', 'school', 'user', 'user_id', 'role', 'is_active', 'is_default', 'created_at']
        read_only_fields = ['id', 'created_at']
