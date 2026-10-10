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
from apps.common.pdf_utils import generate_qr_flowable, get_school_logo_flowable

class ReportCardPDFGenerator:
    """
    Generates professional, printable PDF report cards with school branding & QR authenticity verification.
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
            fontSize=15,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#064e3b')
        )
        school_sub_style = ParagraphStyle(
            'SchoolSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#52606d')
        )
        report_title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#064e3b')
        )
        body_bold = ParagraphStyle('BodyBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11)
        body_regular = ParagraphStyle('BodyRegular', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11)
        body_center = ParagraphStyle('BodyCenter', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10, alignment=TA_CENTER)
        sec_style = ParagraphStyle('RepSec', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#064e3b'))
        sec_sub = ParagraphStyle('RepSecSub', fontName='Helvetica', fontSize=7, leading=8.5, textColor=colors.HexColor('#64748b'))
        table_header = ParagraphStyle('TableHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=TA_CENTER, textColor=colors.white)

        elements = []

        # 1. School Header with Logo
        logo_flowable = get_school_logo_flowable(school, max_width=52, max_height=52)
        header_text_cells = [
            Paragraph(school.name.upper(), school_title_style),
        ]
        if school.motto:
            header_text_cells.append(Paragraph(f'<i>"{school.motto}"</i>', school_sub_style))
        address_parts = [school.address, school.city, school.state, school.phone]
        clean_addr = " | ".join([p for p in address_parts if p])
        if clean_addr:
            header_text_cells.append(Paragraph(clean_addr, school_sub_style))

        if logo_flowable:
            header_table_data = [[
                logo_flowable,
                header_text_cells
            ]]
            header_table = Table(header_table_data, colWidths=[2.2 * cm, 14.8 * cm])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ]))
            elements.append(header_table)
        else:
            for cell in header_text_cells:
                elements.append(cell)

        elements.append(Spacer(1, 6))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#064e3b'), spaceBefore=2, spaceAfter=6))
        elements.append(Paragraph(f"OFFICIAL STUDENT PROGRESS REPORT &bull; {term.name.upper()} ({session.name})", report_title_style))
        elements.append(Spacer(1, 8))

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
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(bio_table)
        elements.append(Spacer(1, 10))

        # 3. Academic Performance Table with dynamic component breakdown
        comp_codes = []
        for s in student_scores:
            if s.submission and s.submission.assessment_scheme:
                scheme = s.submission.assessment_scheme
                for c in scheme.components.order_by('order_index'):
                    if c.code not in comp_codes:
                        comp_codes.append(c.code)
            if not comp_codes and s.component_scores:
                for k in s.component_scores.keys():
                    if k not in comp_codes:
                        comp_codes.append(k)

        if not comp_codes:
            comp_codes = ['CA1', 'CA2', 'EXAM']

        # Construct headers
        score_headers = [Paragraph("Subject", table_header)]
        for code in comp_codes:
            score_headers.append(Paragraph(code, table_header))
        score_headers.extend([
            Paragraph("Total", table_header),
            Paragraph("Grade", table_header),
            Paragraph("Remark", table_header),
        ])
        table_rows = [score_headers]

        for s in student_scores:
            comp = s.component_scores or {}
            subj_name = s.submission.subject.name if hasattr(s, 'submission') and s.submission and s.submission.subject else 'Subject'
            row_cells = [Paragraph(subj_name, body_bold)]
            for code in comp_codes:
                val = comp.get(code, comp.get(code.upper(), '-'))
                row_cells.append(Paragraph(str(val), body_center))
            row_cells.extend([
                Paragraph(f"<b>{s.total_score}</b>", body_center),
                Paragraph(f"<b>{s.grade}</b>", body_center),
                Paragraph(s.remark or '', body_regular),
            ])
            table_rows.append(row_cells)

        if len(table_rows) == 1:
            empty_row = [Paragraph("No published subject scores available for this term.", body_regular)]
            empty_row.extend([Paragraph("", body_regular)] * (len(score_headers) - 1))
            table_rows.append(empty_row)

        # Dynamic column widths
        total_cols = len(score_headers)
        avail_width = 17.0  # cm
        subj_w = 5.0
        rem_w = 2.4
        tot_w = 1.8
        grd_w = 1.6
        comp_col_count = len(comp_codes)
        comp_w = max(1.2, (avail_width - subj_w - rem_w - tot_w - grd_w) / max(1, comp_col_count))
        col_widths = [subj_w * cm] + [comp_w * cm] * comp_col_count + [tot_w * cm, grd_w * cm, rem_w * cm]

        scores_table = Table(table_rows, colWidths=col_widths)
        scores_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#064e3b')),
            ('ALIGN', (1, 1), (-2, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(scores_table)
        elements.append(Spacer(1, 10))

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
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 12))

        # 5. Verification QR Code & Signatures Block
        qr_string = f"https://verify.providence.edu/report/{str(term_result.id)[:8].upper()}?adm={student.admission_number}"
        qr_flowable = generate_qr_flowable(qr_string, size=75)

        sig_data = [
            [
                qr_flowable,
                [
                    Paragraph("<b>OFFICIAL VERIFIED REPORT CARD</b>", sec_style),
                    Paragraph("Scan QR code with any camera to verify academic report authenticity.", sec_sub),
                    Spacer(1, 2),
                    Paragraph(f"Security ID: <b>SEC-{str(term_result.id)[:8].upper()}</b>", sec_sub),
                ],
                Paragraph("__________________________<br/><b>Class Teacher's Signature</b>", body_center),
                Paragraph("__________________________<br/><b>Principal's Signature & Stamp</b>", body_center)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[2.9 * cm, 4.3 * cm, 4.9 * cm, 4.9 * cm])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
        ]))
        elements.append(sig_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

