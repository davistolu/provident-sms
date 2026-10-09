from rest_framework import serializers
from apps.attendance.models import AttendanceSession, AttendanceRecord
from apps.students.models import Student

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    gender = serializers.CharField(source='student.gender', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'student', 'student_name', 'admission_number', 'gender', 'status', 'remarks']
        read_only_fields = ['id']

class AttendanceSessionSerializer(serializers.ModelSerializer):
    class_arm_name = serializers.CharField(source='class_arm.display_name', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.full_name', read_only=True)
    records = AttendanceRecordSerializer(many=True, read_only=True)
    present_count = serializers.SerializerMethodField()
    absent_count = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'class_arm', 'class_arm_name', 'academic_session', 'academic_term',
            'date', 'marked_by', 'marked_by_name', 'status', 'records',
            'present_count', 'absent_count', 'total_students', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_present_count(self, obj):
        return obj.records.filter(status='PRESENT').count()

    def get_absent_count(self, obj):
        return obj.records.filter(status='ABSENT').count()

    def get_total_students(self, obj):
        return obj.records.count()
