import io
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

class ReportCardPDFGenerator:
    """
    Generates professional, printable PDF report cards with school branding.
    """

    @staticmethod
    def generate_report_card(term_result, student_scores):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5 * cm,
            leftMargin=1.5 * cm,
            topMargin=1.5 * cm,
            bottomMargin=1.5 * cm
        )

        styles = getSampleStyleSheet()
        school = term_result.school
        student = term_result.student
        class_arm = term_result.class_arm
        session = term_result.academic_session
        term = term_result.academic_term

        # Custom typography styles
        school_title_style = ParagraphStyle(
            'SchoolTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#1e293b')
        )
        school_sub_style = ParagraphStyle(
            'SchoolSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#64748b')
        )
        report_title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#0f172a')
        )
        body_bold = ParagraphStyle('BodyBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11)
        body_regular = ParagraphStyle('BodyRegular', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11)
        body_center = ParagraphStyle('BodyCenter', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11, alignment=TA_CENTER)
        table_header = ParagraphStyle('TableHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=TA_CENTER, textColor=colors.white)

        elements = []

        # 1. School Header
        elements.append(Paragraph(school.name.upper(), school_title_style))
        if school.motto:
            elements.append(Paragraph(f'<i>"{school.motto}"</i>', school_sub_style))
        address_parts = [school.address, school.city, school.state, school.phone]
        clean_addr = ", ".join([p for p in address_parts if p])
        if clean_addr:
            elements.append(Paragraph(clean_addr, school_sub_style))

        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4f46e5'), spaceBefore=2, spaceAfter=8))
        elements.append(Paragraph(f"STUDENT PROGRESS REPORT &bull; {term.name.upper()} ({session.name})", report_title_style))
        elements.append(Spacer(1, 10))

        # 2. Student Biodata Grid
        pos_str = f"{term_result.position_in_class} of {term_result.total_students_in_class}" if term_result.position_in_class else "N/A"
        att_str = f"{term_result.attendance_present} / {term_result.attendance_total} days" if term_result.attendance_total > 0 else "N/A"

        bio_data = [
            [
                Paragraph("<b>Student Name:</b>", body_regular), Paragraph(student.full_name, body_bold),
                Paragraph("<b>Admission No:</b>", body_regular), Paragraph(student.admission_number, body_bold)
            ],
            [
                Paragraph("<b>Class / Arm:</b>", body_regular), Paragraph(class_arm.display_name, body_bold),
                Paragraph("<b>Gender:</b>", body_regular), Paragraph(student.get_gender_display(), body_regular)
            ],
            [
                Paragraph("<b>Class Position:</b>", body_regular), Paragraph(pos_str, body_bold),
                Paragraph("<b>Term Attendance:</b>", body_regular), Paragraph(att_str, body_regular)
            ],
        ]
        bio_table = Table(bio_data, colWidths=[2.5 * cm, 6.0 * cm, 3.0 * cm, 5.5 * cm])
        bio_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(bio_table)
        elements.append(Spacer(1, 12))

        # 3. Academic Performance Table
        score_headers = [
            Paragraph("Subject", table_header),
            Paragraph("CA 1", table_header),
            Paragraph("CA 2", table_header),
            Paragraph("Exam", table_header),
            Paragraph("Total", table_header),
            Paragraph("Grade", table_header),
            Paragraph("Remark", table_header),
        ]
        table_rows = [score_headers]

        for s in student_scores:
            comp = s.component_scores or {}
            ca1 = str(comp.get('CA1', '-'))
            ca2 = str(comp.get('CA2', '-'))
            exam = str(comp.get('EXAM', '-'))
            subj_name = s.submission.subject.name if hasattr(s, 'submission') and s.submission else 'Subject'
            table_rows.append([
                Paragraph(subj_name, body_bold),
                Paragraph(ca1, body_center),
                Paragraph(ca2, body_center),
                Paragraph(exam, body_center),
                Paragraph(f"<b>{s.total_score}</b>", body_center),
                Paragraph(f"<b>{s.grade}</b>", body_center),
                Paragraph(s.remark, body_regular),
            ])

        if len(table_rows) == 1:
            table_rows.append([Paragraph("No published subject scores available for this term.", body_regular)] + [Paragraph("", body_regular)] * 6)

        scores_table = Table(table_rows, colWidths=[5.5 * cm, 1.8 * cm, 1.8 * cm, 2.0 * cm, 2.0 * cm, 1.8 * cm, 2.6 * cm])
        scores_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4f46e5')),
            ('ALIGN', (1, 1), (-2, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(scores_table)
        elements.append(Spacer(1, 12))

        # 4. Summary & Comments Box
        avg_str = f"{term_result.average_score}%"
        tot_str = f"{term_result.total_marks_obtained} / {term_result.total_marks_possible}"

        summary_data = [
            [
                Paragraph("<b>Academic Summary</b>", body_bold),
                Paragraph(f"Total Marks: <b>{tot_str}</b> &bull; Term Average: <b>{avg_str}</b>", body_regular)
            ],
            [
                Paragraph("<b>Teacher's Remarks:</b>", body_bold),
                Paragraph(term_result.teacher_comment or "Satisfactory academic performance and conduct.", body_regular)
            ],
            [
                Paragraph("<b>Principal's Remarks:</b>", body_bold),
                Paragraph(term_result.principal_comment or "Promising effort. Keep striving for greater heights.", body_regular)
            ],
        ]
        summary_table = Table(summary_data, colWidths=[4.0 * cm, 13.0 * cm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94a3b8')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 18))

        # 5. Signatures Block
        sig_data = [
            [
                Paragraph("__________________________<br/><b>Class Teacher's Signature</b>", body_center),
                Paragraph("__________________________<br/><b>Principal's Signature & Stamp</b>", body_center)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[8.5 * cm, 8.5 * cm])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(sig_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
