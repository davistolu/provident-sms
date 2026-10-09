from rest_framework import serializers
from apps.results.models import AssessmentSubmission, StudentScore, StudentTermResult
from apps.students.models import Student

class StudentScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    gender = serializers.CharField(source='student.gender', read_only=True)

    class Meta:
        model = StudentScore
        fields = [
            'id', 'student', 'student_name', 'admission_number', 'gender',
            'component_scores', 'total_score', 'grade', 'remark', 'teacher_comment'
        ]
        read_only_fields = ['id', 'total_score', 'grade', 'remark']

class AssessmentSubmissionSerializer(serializers.ModelSerializer):
    class_arm_name = serializers.CharField(source='class_arm.display_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    session_name = serializers.CharField(source='academic_session.name', read_only=True)
    term_name = serializers.CharField(source='academic_term.name', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    scores = StudentScoreSerializer(many=True, read_only=True)
    scores_count = serializers.IntegerField(source='scores.count', read_only=True)

    class Meta:
        model = AssessmentSubmission
        fields = [
            'id', 'class_arm', 'class_arm_name', 'subject', 'subject_name', 'subject_code',
            'academic_session', 'session_name', 'academic_term', 'term_name',
            'assessment_scheme', 'grading_scale', 'submitted_by', 'submitted_by_name',
            'status', 'status_display', 'feedback_notes', 'reviewed_by', 'reviewed_at',
            'published_at', 'scores', 'scores_count', 'updated_at'
        ]
        read_only_fields = ['id', 'status_display', 'updated_at']

class StudentTermResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    class_arm_name = serializers.CharField(source='class_arm.display_name', read_only=True)
    session_name = serializers.CharField(source='academic_session.name', read_only=True)
    term_name = serializers.CharField(source='academic_term.name', read_only=True)

    class Meta:
        model = StudentTermResult
        fields = [
            'id', 'student', 'student_name', 'admission_number', 'class_arm', 'class_arm_name',
            'academic_session', 'session_name', 'academic_term', 'term_name',
            'total_marks_obtained', 'total_marks_possible', 'average_score',
            'position_in_class', 'total_students_in_class', 'teacher_comment',
            'principal_comment', 'attendance_present', 'attendance_total',
            'is_published', 'published_at'
        ]
        read_only_fields = ['id']
