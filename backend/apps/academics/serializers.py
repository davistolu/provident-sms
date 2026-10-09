from rest_framework import serializers
from apps.academics.models import (
    AcademicSession, AcademicTerm, ClassLevel, TeacherProfile, ClassArm,
    Subject, TeacherSubjectAssignment
)
from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer

class AcademicTermSerializer(serializers.ModelSerializer):
    term_type_display = serializers.CharField(source='get_term_type_display', read_only=True)

    class Meta:
        model = AcademicTerm
        fields = ['id', 'session', 'term_type', 'term_type_display', 'name', 'start_date', 'end_date', 'is_current']
        read_only_fields = ['id']

class AcademicSessionSerializer(serializers.ModelSerializer):
    terms = AcademicTermSerializer(many=True, read_only=True)

    class Meta:
        model = AcademicSession
        fields = ['id', 'name', 'start_date', 'end_date', 'is_current', 'terms', 'created_at']
        read_only_fields = ['id', 'created_at']

class ClassLevelSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    arms_count = serializers.IntegerField(source='arms.count', read_only=True)

    class Meta:
        model = ClassLevel
        fields = ['id', 'name', 'code', 'category', 'category_display', 'order_index', 'arms_count']
        read_only_fields = ['id']

class TeacherProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    email = serializers.EmailField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'user', 'staff_id', 'qualification', 'specialization',
            'phone', 'gender', 'is_active', 'email', 'first_name', 'last_name', 'password', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        email = validated_data.pop('email', None)
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        password = validated_data.pop('password', None) or 'TeacherPass123!'
        school = validated_data.get('school')

        if email:
            user, created = User.objects.get_or_create(
                email=email.lower().strip(),
                defaults={'first_name': first_name, 'last_name': last_name}
            )
            if created:
                user.set_password(password)
                user.save()
            from apps.schools.models import SchoolMembership
            SchoolMembership.objects.get_or_create(
                school=school,
                user=user,
                defaults={'role': SchoolMembership.RoleChoices.TEACHER}
            )
            validated_data['user'] = user
        return super().create(validated_data)

class ClassArmSerializer(serializers.ModelSerializer):
    class_level_name = serializers.CharField(source='class_level.name', read_only=True)
    class_teacher_name = serializers.CharField(source='class_teacher.user.full_name', read_only=True)
    display_name = serializers.CharField(read_only=True)
    enrolled_students_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassArm
        fields = ['id', 'class_level', 'class_level_name', 'name', 'display_name', 'class_teacher', 'class_teacher_name', 'enrolled_students_count']
        read_only_fields = ['id', 'display_name']

    def get_enrolled_students_count(self, obj):
        return obj.enrollments.filter(status='ACTIVE').count()

class SubjectSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'category', 'category_display', 'is_active']
        read_only_fields = ['id']

class TeacherSubjectAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.user.full_name', read_only=True)
    staff_id = serializers.CharField(source='teacher.staff_id', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_arm_name = serializers.CharField(source='class_arm.display_name', read_only=True)
    session_name = serializers.CharField(source='academic_session.name', read_only=True)

    class Meta:
        model = TeacherSubjectAssignment
        fields = [
            'id', 'teacher', 'teacher_name', 'staff_id', 'subject', 'subject_name',
            'class_arm', 'class_arm_name', 'academic_session', 'session_name'
        ]
        read_only_fields = ['id']
