import csv
import io
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Q
from apps.common.viewsets import TenantScopedModelViewSet
from apps.common.permissions import IsSchoolAdmin, IsSchoolMember
from apps.students.models import Student, Guardian, StudentGuardian, StudentEnrollment
from apps.students.serializers import StudentSerializer, GuardianSerializer, StudentEnrollmentSerializer
from apps.academics.models import ClassArm, AcademicSession

class StudentViewSet(TenantScopedModelViewSet):
    queryset = Student.objects.all().prefetch_related('enrollments__class_arm__class_level')
    serializer_class = StudentSerializer
    permission_classes = [IsSchoolMember]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        class_arm_id = self.request.query_params.get('class_arm')
        status_filter = self.request.query_params.get('status')
        session_id = self.request.query_params.get('session')

        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(middle_name__icontains=search) |
                Q(admission_number__icontains=search)
            )
        if status_filter:
            qs = qs.filter(status=status_filter)
        if class_arm_id:
            qs = qs.filter(enrollments__class_arm_id=class_arm_id, enrollments__status='ACTIVE')
        if session_id:
            qs = qs.filter(enrollments__academic_session_id=session_id)
        return qs.distinct()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_import']:
            return [IsSchoolAdmin()]
        return [IsSchoolMember()]

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export students to CSV with formula injection sanitization."""
        def sanitize_csv_cell(val):
            if val is None:
                return ''
            str_val = str(val).strip()
            # Prevent CSV / Excel formula injection
            if str_val and str_val[0] in ('=', '+', '-', '@', '\t', '\r'):
                return f"'{str_val}"
            return str_val

        students = self.get_queryset()
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="students.csv"'

        writer = csv.writer(response)
        writer.writerow(['Admission Number', 'First Name', 'Last Name', 'Gender', 'Date of Birth', 'Status', 'Current Class'])

        for s in students:
            enrollment = s.enrollments.filter(status='ACTIVE').first()
            class_name = enrollment.class_arm.display_name if enrollment else ''
            writer.writerow([
                sanitize_csv_cell(s.admission_number),
                sanitize_csv_cell(s.first_name),
                sanitize_csv_cell(s.last_name),
                sanitize_csv_cell(s.gender),
                sanitize_csv_cell(s.date_of_birth or ''),
                sanitize_csv_cell(s.status),
                sanitize_csv_cell(class_name)
            ])
        return response

    @action(detail=False, methods=['post'], permission_classes=[IsSchoolAdmin])
    def bulk_import(self, request):
        """Bulk import students from CSV file with security validation."""
        csv_file = request.FILES.get('file')
        class_arm_id = request.data.get('class_arm_id')
        session_id = request.data.get('session_id')

        if not csv_file:
            return Response({'error': 'CSV file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce max 5MB file size limit
        if csv_file.size > 5 * 1024 * 1024:
            return Response({'error': 'Uploaded file exceeds the maximum 5MB size limit.'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce file extension
        import os
        ext = os.path.splitext(csv_file.name)[1].lower()
        if ext != '.csv':
            return Response({'error': 'Invalid file type. Only standard .csv files are supported.'}, status=status.HTTP_400_BAD_REQUEST)

        def sanitize_input(val):
            if not val:
                return ''
            str_val = str(val).strip()
            # Strip formula injection triggers
            while str_val and str_val[0] in ('=', '+', '-', '@'):
                str_val = str_val[1:].strip()
            return str_val

        school = self.get_school()
        active_session = AcademicSession.objects.filter(school=school, id=session_id).first() if session_id else AcademicSession.objects.filter(school=school, is_current=True).first()
        target_class = ClassArm.objects.filter(school=school, id=class_arm_id).first() if class_arm_id else None

        try:
            decoded_file = csv_file.read().decode('utf-8-sig', errors='replace')
            reader = csv.DictReader(io.StringIO(decoded_file))
            created_count = 0
            errors = []

            with transaction.atomic():
                for row_idx, row in enumerate(reader, start=1):
                    adm_no = sanitize_input(row.get('Admission Number') or row.get('admission_number') or row.get('AdmissionNo'))
                    first_name = sanitize_input(row.get('First Name') or row.get('first_name'))
                    last_name = sanitize_input(row.get('Last Name') or row.get('last_name'))
                    gender_raw = sanitize_input(row.get('Gender') or row.get('gender') or 'MALE').upper()
                    dob_raw = sanitize_input(row.get('Date of Birth') or row.get('date_of_birth')) or None

                    if not adm_no or not first_name or not last_name:
                        errors.append(f"Row {row_idx}: Missing required fields (Admission Number, First Name, Last Name)")
                        continue

                    if Student.objects.filter(school=school, admission_number=adm_no).exists():
                        errors.append(f"Row {row_idx}: Admission number '{adm_no}' already exists")
                        continue

                    student = Student.objects.create(
                        school=school,
                        admission_number=adm_no,
                        first_name=first_name,
                        last_name=last_name,
                        gender='FEMALE' if gender_raw.startswith('F') else 'MALE',
                        date_of_birth=dob_raw if dob_raw else None,
                        status=Student.StatusChoices.ACTIVE
                    )
                    if target_class and active_session:
                        StudentEnrollment.objects.create(
                            school=school,
                            student=student,
                            class_arm=target_class,
                            academic_session=active_session,
                            status=StudentEnrollment.EnrollmentStatus.ACTIVE
                        )
                    created_count += 1

                # Audit Log
                self._log_audit(
                    action='CREATE',
                    model_name='Student',
                    entity_id=str(school.id),
                    details={
                        'message': f'Bulk imported {created_count} students from CSV ({csv_file.name})',
                        'created_count': created_count,
                        'errors_count': len(errors)
                    }
                )

            return Response({
                'status': 'success',
                'imported_count': created_count,
                'errors': errors
            })
        except Exception as e:
            return Response({'error': f"Failed to parse CSV file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class GuardianViewSet(TenantScopedModelViewSet):
    queryset = Guardian.objects.all()
    serializer_class = GuardianSerializer
    permission_classes = [IsSchoolAdmin]

class StudentEnrollmentViewSet(TenantScopedModelViewSet):
    queryset = StudentEnrollment.objects.all().select_related('student', 'class_arm__class_level', 'academic_session')
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [IsSchoolMember]

    def get_queryset(self):
        qs = super().get_queryset()
        class_arm_id = self.request.query_params.get('class_arm')
        session_id = self.request.query_params.get('session')
        status_filter = self.request.query_params.get('status')
        if class_arm_id:
            qs = qs.filter(class_arm_id=class_arm_id)
        if session_id:
            qs = qs.filter(academic_session_id=session_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin()]
        return [IsSchoolMember()]
