import io
from reportlab.lib.pagesizes import A5
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from apps.common.pdf_utils import generate_qr_flowable, get_school_logo_flowable

class PaymentReceiptPDFGenerator:
    """
    Generates official printable payment receipts with school branding & QR authenticity verification.
    """
    @staticmethod
    def generate_receipt(payment):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A5,
            rightMargin=1.0 * cm,
            leftMargin=1.0 * cm,
            topMargin=1.0 * cm,
            bottomMargin=1.0 * cm
        )

        styles = getSampleStyleSheet()
        school = payment.school
        student = payment.student
        invoice = payment.invoice

        title_style = ParagraphStyle('RTitle', fontName='Helvetica-Bold', fontSize=13, leading=16, alignment=TA_CENTER, textColor=colors.HexColor('#064e3b'))
        sub_style = ParagraphStyle('RSub', fontName='Helvetica', fontSize=7.5, leading=10, alignment=TA_CENTER, textColor=colors.HexColor('#52606d'))
        body_bold = ParagraphStyle('RBold', fontName='Helvetica-Bold', fontSize=8.5, leading=11)
        body_reg = ParagraphStyle('RReg', fontName='Helvetica', fontSize=8.5, leading=11)
        body_center = ParagraphStyle('RCenter', fontName='Helvetica', fontSize=8, leading=10, alignment=TA_CENTER)
        sec_style = ParagraphStyle('RSec', fontName='Helvetica-Bold', fontSize=7, leading=9, textColor=colors.HexColor('#064e3b'))
        sec_sub = ParagraphStyle('RSecSub', fontName='Helvetica', fontSize=6.5, leading=8.5, textColor=colors.HexColor('#64748b'))

        elements = []

        # 1. School Header with Logo
        logo_flowable = get_school_logo_flowable(school, max_width=45, max_height=45)
        header_text_cells = [
            Paragraph(school.name.upper(), title_style),
        ]
        if school.motto:
            header_text_cells.append(Paragraph(f'<i>"{school.motto}"</i>', sub_style))
        address_parts = [school.address, school.city, school.state, school.phone]
        clean_addr = " | ".join([p for p in address_parts if p])
        if clean_addr:
            header_text_cells.append(Paragraph(clean_addr, sub_style))

        if logo_flowable:
            header_table_data = [[
                logo_flowable,
                header_text_cells
            ]]
            header_table = Table(header_table_data, colWidths=[2.0 * cm, 11.5 * cm])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ]))
            elements.append(header_table)
        else:
            for cell in header_text_cells:
                elements.append(cell)

        elements.append(Spacer(1, 4))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#064e3b'), spaceBefore=2, spaceAfter=4))
        elements.append(Paragraph("OFFICIAL PAYMENT RECEIPT", ParagraphStyle('Heading', fontName='Helvetica-Bold', fontSize=10, alignment=TA_CENTER, textColor=colors.HexColor('#064e3b'))))
        elements.append(Spacer(1, 6))

        # 2. Receipt Meta
        meta_data = [
            [
                Paragraph("<b>Receipt No:</b>", body_reg), Paragraph(payment.reference_number, body_bold),
                Paragraph("<b>Date:</b>", body_reg), Paragraph(str(payment.payment_date), body_bold)
            ],
            [
                Paragraph("<b>Student:</b>", body_reg), Paragraph(student.full_name, body_bold),
                Paragraph("<b>Admission No:</b>", body_reg), Paragraph(student.admission_number, body_bold)
            ],
            [
                Paragraph("<b>Payment Method:</b>", body_reg), Paragraph(payment.get_payment_method_display(), body_reg),
                Paragraph("<b>Invoice No:</b>", body_reg), Paragraph(invoice.invoice_number, body_reg)
            ],
        ]
        meta_table = Table(meta_data, colWidths=[2.5 * cm, 4.5 * cm, 2.5 * cm, 4.0 * cm])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 6))

        # 3. Financial breakdown table
        curr = school.currency_symbol or '₦'
        amt_paid_str = f"{curr}{payment.amount:,.2f}"
        inv_tot_str = f"{curr}{invoice.total_amount:,.2f}"
        tot_paid_str = f"{curr}{invoice.amount_paid:,.2f}"
        bal_str = f"{curr}{invoice.balance:,.2f}"

        fin_data = [
            [Paragraph("<b>Item Description</b>", body_bold), Paragraph("<b>Amount</b>", body_bold)],
            [Paragraph(f"Fee Payment for {invoice.academic_term.name} ({invoice.academic_session.name})", body_reg), Paragraph(amt_paid_str, body_bold)],
            [Paragraph("Total Invoice Amount", body_reg), Paragraph(inv_tot_str, body_reg)],
            [Paragraph("Total Amount Paid to Date", body_reg), Paragraph(tot_paid_str, body_reg)],
            [Paragraph("<b>Remaining Outstanding Balance</b>", body_bold), Paragraph(f"<b>{bal_str}</b>", body_bold)],
        ]
        fin_table = Table(fin_data, colWidths=[9.5 * cm, 4.0 * cm])
        fin_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        elements.append(fin_table)
        elements.append(Spacer(1, 8))

        rec_by = payment.recorded_by.full_name if payment.recorded_by else "Accounts Officer"
        elements.append(Paragraph(f"Received By: <b>{rec_by}</b>", body_reg))
        elements.append(Spacer(1, 8))

        # 4. Verification QR Code & Authorized Signature Row
        qr_string = f"https://verify.providence.edu/receipt/{str(payment.id)[:8].upper()}?ref={payment.reference_number}"
        qr_flowable = generate_qr_flowable(qr_string, size=65)

        verification_cell = [
            qr_flowable,
        ]

        footer_data = [
            [
                verification_cell,
                [
                    Paragraph("<b>DIGITALLY VERIFIED DOCUMENT</b>", sec_style),
                    Paragraph("Scan QR code with any camera to verify payment authenticity.", sec_sub),
                    Spacer(1, 2),
                    Paragraph(f"Security ID: <b>SEC-{str(payment.id)[:8].upper()}</b>", sec_sub),
                ],
                [
                    Paragraph("______________________<br/><b>Authorized Signature / Stamp</b>", body_center)
                ]
            ]
        ]
        footer_table = Table(footer_data, colWidths=[2.5 * cm, 5.5 * cm, 5.5 * cm])
        footer_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('ALIGN', (2, 0), (2, 0), 'CENTER'),
        ]))
        elements.append(footer_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

