from rest_framework import serializers
from apps.students.models import Student, Guardian, StudentGuardian, StudentEnrollment
from apps.academics.models import ClassArm, AcademicSession

class GuardianSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Guardian
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'relationship',
            'phone_primary', 'phone_secondary', 'email', 'occupation', 'address'
        ]
        read_only_fields = ['id']

class StudentEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    class_arm_name = serializers.CharField(source='class_arm.display_name', read_only=True)
    session_name = serializers.CharField(source='academic_session.name', read_only=True)
    gender = serializers.CharField(source='student.gender', read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = [
            'id', 'student', 'student_name', 'admission_number', 'gender',
            'class_arm', 'class_arm_name', 'academic_session', 'session_name',
            'status', 'roll_number', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class StudentSerializer(serializers.ModelSerializer):
    admission_number = serializers.CharField(required=False, allow_blank=True)
    full_name = serializers.CharField(read_only=True)
    current_enrollment = serializers.SerializerMethodField()
    class_arm_id = serializers.UUIDField(write_only=True, required=False)
    academic_session_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'first_name', 'middle_name', 'last_name', 'full_name',
            'date_of_birth', 'gender', 'blood_group', 'genotype', 'passport_photo',
            'address', 'state_of_origin', 'status', 'admission_date', 'current_enrollment',
            'class_arm_id', 'academic_session_id', 'created_at'
        ]
        read_only_fields = ['id', 'admission_date', 'created_at']

    def get_current_enrollment(self, obj):
        latest = obj.enrollments.filter(status='ACTIVE').select_related('class_arm__class_level', 'academic_session').first()
        if latest:
            return {
                'id': str(latest.id),
                'class_arm_id': str(latest.class_arm_id),
                'class_arm_name': latest.class_arm.display_name,
                'session_name': latest.academic_session.name,
                'status': latest.status
            }
        return None

    def create(self, validated_data):
        class_arm_id = validated_data.pop('class_arm_id', None)
        academic_session_id = validated_data.pop('academic_session_id', None)
        school = validated_data.get('school')

        if not validated_data.get('admission_number') and school:
            validated_data['admission_number'] = Student.generate_admission_number(school)

        student = super().create(validated_data)

        if class_arm_id and academic_session_id:
            StudentEnrollment.objects.create(
                school=student.school,
                student=student,
                class_arm_id=class_arm_id,
                academic_session_id=academic_session_id,
                status=StudentEnrollment.EnrollmentStatus.ACTIVE
            )
        return student

    def update(self, instance, validated_data):
        class_arm_id = validated_data.pop('class_arm_id', None)
        academic_session_id = validated_data.pop('academic_session_id', None)
        student = super().update(instance, validated_data)

        if class_arm_id:
            active_enrollment = student.enrollments.filter(status='ACTIVE').first()
            if active_enrollment:
                active_enrollment.class_arm_id = class_arm_id
                if academic_session_id:
                    active_enrollment.academic_session_id = academic_session_id
                active_enrollment.save()
            elif academic_session_id:
                StudentEnrollment.objects.create(
                    school=student.school,
                    student=student,
                    class_arm_id=class_arm_id,
                    academic_session_id=academic_session_id,
                    status=StudentEnrollment.EnrollmentStatus.ACTIVE
                )
        return student
