export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'BURSAR';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  slug: string;
  motto?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  timezone: string;
  currency: string;
  currency_symbol: string;
  is_active: boolean;
  settings?: SchoolSettings;
}

export interface SchoolSettings {
  id: string;
  enable_positions: boolean;
  grading_system: string;
  academic_calendar_type: string;
  receipt_prefix: string;
  invoice_prefix: string;
  admission_number_prefix: string;
}

export interface SchoolMembership {
  id: string;
  school_id?: string;
  school_name?: string;
  school_code?: string;
  school_logo?: string;
  currency_symbol?: string;
  user?: User;
  role: Role;
  role_display?: string;
  is_active: boolean;
  is_default?: boolean;
  created_at?: string;
}

export interface AcademicSession {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  terms?: AcademicTerm[];
  created_at: string;
}

export interface AcademicTerm {
  id: string;
  session: string;
  term_type: 'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM';
  term_type_display: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export type ClassCategory = 'NURSERY' | 'PRIMARY' | 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY';

export interface ClassLevel {
  id: string;
  name: string;
  code: string;
  category: ClassCategory;
  category_display: string;
  order_index: number;
  arms_count?: number;
}

export interface ClassArm {
  id: string;
  class_level: string;
  class_level_name: string;
  name: string;
  display_name: string;
  class_teacher?: string;
  class_teacher_name?: string;
  enrolled_students_count?: number;
}

export interface TeacherProfile {
  id: string;
  user: User;
  staff_id: string;
  qualification?: string;
  specialization?: string;
  phone?: string;
  gender: 'MALE' | 'FEMALE';
  is_active: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
  category_display: string;
  is_active: boolean;
}

export interface TeacherSubjectAssignment {
  id: string;
  teacher: string;
  teacher_name: string;
  staff_id: string;
  subject: string;
  subject_name: string;
  class_arm: string;
  class_arm_name: string;
  academic_session: string;
  session_name: string;
}

export interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name: string;
  date_of_birth?: string;
  gender: 'MALE' | 'FEMALE';
  blood_group?: string;
  genotype?: string;
  passport_photo?: string;
  address?: string;
  state_of_origin?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'WITHDRAWN' | 'SUSPENDED';
  admission_date: string;
  current_enrollment?: {
    id: string;
    class_arm_id: string;
    class_arm_name: string;
    session_name: string;
    status: string;
  };
  created_at: string;
}

export interface StudentEnrollment {
  id: string;
  student: string;
  student_name: string;
  admission_number: string;
  gender: string;
  class_arm: string;
  class_arm_name: string;
  academic_session: string;
  session_name: string;
  status: 'ACTIVE' | 'PROMOTED' | 'REPEATED' | 'TRANSFERRED' | 'GRADUATED';
  roll_number?: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student: string;
  student_name: string;
  admission_number: string;
  gender: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export interface AttendanceSession {
  id: string;
  class_arm: string;
  class_arm_name: string;
  academic_session: string;
  academic_term: string;
  date: string;
  marked_by?: string;
  marked_by_name?: string;
  status: 'DRAFT' | 'SUBMITTED';
  records: AttendanceRecord[];
  present_count: number;
  absent_count: number;
  total_students: number;
  created_at: string;
}

export interface AssessmentComponent {
  id: string;
  scheme: string;
  name: string;
  code: string;
  max_score: number;
  order_index: number;
}

export interface AssessmentScheme {
  id: string;
  name: string;
  max_total_score: number;
  is_default: boolean;
  components: AssessmentComponent[];
  created_at: string;
}

export interface GradeRule {
  id: string;
  grading_scale: string;
  grade: string;
  min_score: number;
  max_score: number;
  grade_point: number;
  remark: string;
  order_index: number;
}

export interface GradingScale {
  id: string;
  name: string;
  is_default: boolean;
  rules: GradeRule[];
  created_at: string;
}

export interface StudentScore {
  id: string;
  student: string;
  student_name: string;
  admission_number: string;
  gender: string;
  component_scores: Record<string, number>;
  total_score: number;
  grade: string;
  remark: string;
  teacher_comment?: string;
}

export interface AssessmentSubmission {
  id: string;
  class_arm: string;
  class_arm_name: string;
  subject: string;
  subject_name: string;
  subject_code?: string;
  academic_session: string;
  session_name: string;
  academic_term: string;
  term_name: string;
  assessment_scheme?: string;
  grading_scale?: string;
  submitted_by?: string;
  submitted_by_name?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  status_display: string;
  feedback_notes?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  published_at?: string;
  scores: StudentScore[];
  scores_count: number;
  updated_at: string;
}

export interface StudentTermResult {
  id: string;
  student: string;
  student_name: string;
  admission_number: string;
  class_arm: string;
  class_arm_name: string;
  academic_session: string;
  session_name: string;
  academic_term: string;
  term_name: string;
  total_marks_obtained: number;
  total_marks_possible: number;
  average_score: number;
  position_in_class?: number;
  total_students_in_class: number;
  teacher_comment?: string;
  principal_comment?: string;
  attendance_present: number;
  attendance_total: number;
  is_published: boolean;
  published_at?: string;
}

export interface FeeCategory {
  id: string;
  name: string;
  description?: string;
}

export interface FeeStructure {
  id: string;
  fee_category: string;
  fee_category_name: string;
  academic_session: string;
  session_name: string;
  academic_term: string;
  term_name: string;
  class_level?: string;
  class_level_name?: string;
  amount: number;
  is_mandatory: boolean;
}

export interface InvoiceItem {
  id: string;
  invoice: string;
  fee_category?: string;
  fee_category_name?: string;
  description: string;
  amount: number;
}

export interface Payment {
  id: string;
  student: string;
  student_name: string;
  admission_number: string;
  invoice: string;
  reference_number: string;
  payment_date: string;
  amount: number;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'POS' | 'CHEQUE' | 'ONLINE';
  payment_method_display: string;
  recorded_by?: string;
  recorded_by_name?: string;
  notes?: string;
  created_at: string;
}

export interface StudentInvoice {
  id: string;
  student: string;
  student_name: string;
  admission_number: string;
  academic_session: string;
  session_name: string;
  academic_term: string;
  term_name: string;
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  status_display: string;
  items: InvoiceItem[];
  payments: Payment[];
  created_at: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  recorded_by?: string;
  recorded_by_name?: string;
  receipt_voucher_no?: string;
  notes?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor?: string;
  actor_name?: string;
  actor_email?: string;
  action: string;
  action_display: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
