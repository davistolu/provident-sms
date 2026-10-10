import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from apps.common.pdf_utils import generate_qr_flowable, get_school_logo_flowable

class StudentInvoicePDFGenerator:
    """
    Generates official printable Student Fee Invoices with school branding & QR authenticity verification.
    """

    @staticmethod
    def generate_invoice(invoice):
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
        school = invoice.school
        student = invoice.student
        session = invoice.academic_session
        term = invoice.academic_term

        title_style = ParagraphStyle(
            'InvTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=15,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#064e3b')
        )
        sub_style = ParagraphStyle(
            'InvSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#52606d')
        )
        heading_style = ParagraphStyle(
            'InvHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#064e3b')
        )
        body_bold = ParagraphStyle('InvBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11)
        body_reg = ParagraphStyle('InvReg', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11)
        body_right = ParagraphStyle('InvRight', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11, alignment=TA_RIGHT)
        body_right_bold = ParagraphStyle('InvRightBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=TA_RIGHT)
        body_center = ParagraphStyle('InvCenter', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10, alignment=TA_CENTER)
        sec_style = ParagraphStyle('InvSec', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#064e3b'))
        sec_sub = ParagraphStyle('InvSecSub', fontName='Helvetica', fontSize=7, leading=8.5, textColor=colors.HexColor('#64748b'))
        table_header = ParagraphStyle('InvTableHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.white)
        table_header_right = ParagraphStyle('InvTableHeaderR', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=TA_RIGHT, textColor=colors.white)

        elements = []

        # 1. School Header with Logo
        logo_flowable = get_school_logo_flowable(school, max_width=52, max_height=52)
        header_text_cells = [
            Paragraph(school.name.upper(), title_style),
        ]
        if school.motto:
            header_text_cells.append(Paragraph(f'<i>"{school.motto}"</i>', sub_style))
        address_parts = [school.address, school.city, school.state, school.phone, school.email]
        clean_addr = " | ".join([p for p in address_parts if p])
        if clean_addr:
            header_text_cells.append(Paragraph(clean_addr, sub_style))

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
        elements.append(Paragraph(f"STUDENT FEE INVOICE &bull; {term.name.upper()} ({session.name})", heading_style))
        elements.append(Spacer(1, 8))

        # 2. Invoice Meta Table
        curr = school.currency_symbol or '₦'
        status_color = '#059669' if invoice.status == 'PAID' else ('#d97706' if invoice.status == 'PARTIALLY_PAID' else '#dc2626')
        status_html = f'<font color="{status_color}"><b>{invoice.get_status_display().upper()}</b></font>'

        meta_data = [
            [
                Paragraph("<b>Invoice No:</b>", body_reg), Paragraph(invoice.invoice_number, body_bold),
                Paragraph("<b>Date Issued:</b>", body_reg), Paragraph(str(invoice.issue_date), body_reg)
            ],
            [
                Paragraph("<b>Student Name:</b>", body_reg), Paragraph(student.full_name, body_bold),
                Paragraph("<b>Admission No:</b>", body_reg), Paragraph(student.admission_number, body_bold)
            ],
            [
                Paragraph("<b>Academic Term:</b>", body_reg), Paragraph(f"{term.name} ({session.name})", body_reg),
                Paragraph("<b>Status:</b>", body_reg), Paragraph(status_html, body_reg)
            ]
        ]
        meta_table = Table(meta_data, colWidths=[3.0 * cm, 6.0 * cm, 3.0 * cm, 5.0 * cm])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 10))

        # 3. Items Breakdown Table
        items_headers = [
            Paragraph("Item #", table_header),
            Paragraph("Fee Description", table_header),
            Paragraph(f"Amount ({curr})", table_header_right),
        ]
        table_rows = [items_headers]

        items = invoice.items.all().select_related('fee_category')
        idx = 1
        for itm in items:
            desc = itm.description or (itm.fee_category.name if itm.fee_category else "Fee Item")
            amt_str = f"{itm.amount:,.2f}"
            table_rows.append([
                Paragraph(str(idx), body_reg),
                Paragraph(desc, body_bold),
                Paragraph(amt_str, body_right),
            ])
            idx += 1

        if len(table_rows) == 1:
            table_rows.append([
                Paragraph("1", body_reg),
                Paragraph("General Term Tuition & Academic Fees", body_bold),
                Paragraph(f"{invoice.total_amount:,.2f}", body_right)
            ])

        items_table = Table(table_rows, colWidths=[2.0 * cm, 11.0 * cm, 4.0 * cm])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#064e3b')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 8))

        # 4. Totals Summary Box
        tot_billed_str = f"{curr}{invoice.total_amount:,.2f}"
        tot_paid_str = f"{curr}{invoice.amount_paid:,.2f}"
        bal_str = f"{curr}{invoice.balance:,.2f}"

        summary_data = [
            [Paragraph("Total Amount Billed:", body_reg), Paragraph(tot_billed_str, body_right_bold)],
            [Paragraph("Total Amount Paid to Date:", body_reg), Paragraph(tot_paid_str, body_right_bold)],
            [Paragraph("<b>Outstanding Balance Due:</b>", body_bold), Paragraph(f"<b>{bal_str}</b>", body_right_bold)],
        ]
        summary_table = Table(summary_data, colWidths=[12.0 * cm, 5.0 * cm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94a3b8')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 10))

        # 5. Payment Details / Bank Notice
        elements.append(Paragraph("<b>PAYMENT INSTRUCTIONS</b>", body_bold))
        elements.append(Paragraph(
            f"Please make bank payments or electronic transfers quoting student admission number <b>{student.admission_number}</b> or invoice reference <b>{invoice.invoice_number}</b> in the payment remarks.",
            body_reg
        ))
        elements.append(Spacer(1, 12))

        # 6. Verification QR Code & Bursar Sign / Stamp
        qr_string = f"https://verify.providence.edu/invoice/{str(invoice.id)[:8].upper()}?inv={invoice.invoice_number}"
        qr_flowable = generate_qr_flowable(qr_string, size=75)

        sig_data = [
            [
                qr_flowable,
                [
                    Paragraph("<b>OFFICIAL VERIFIED BILLING</b>", sec_style),
                    Paragraph("Scan QR code with any camera to verify invoice authenticity.", sec_sub),
                    Spacer(1, 2),
                    Paragraph(f"Security ID: <b>SEC-{str(invoice.id)[:8].upper()}</b>", sec_sub),
                ],
                Paragraph("Prepared By: ___________________<br/><b>Accounts Department</b>", body_center),
                Paragraph("__________________________<br/><b>Bursar / Authorized Stamp</b>", body_center)
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

