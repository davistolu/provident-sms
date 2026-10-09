import io
from reportlab.lib.pagesizes import A5
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

class PaymentReceiptPDFGenerator:
    """
    Generates official printable payment receipts.
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

        title_style = ParagraphStyle('RTitle', fontName='Helvetica-Bold', fontSize=14, leading=18, alignment=TA_CENTER, textColor=colors.HexColor('#0f172a'))
        sub_style = ParagraphStyle('RSub', fontName='Helvetica', fontSize=8, leading=11, alignment=TA_CENTER, textColor=colors.HexColor('#64748b'))
        body_bold = ParagraphStyle('RBold', fontName='Helvetica-Bold', fontSize=9, leading=12)
        body_reg = ParagraphStyle('RReg', fontName='Helvetica', fontSize=9, leading=12)
        body_center = ParagraphStyle('RCenter', fontName='Helvetica', fontSize=8.5, leading=11, alignment=TA_CENTER)

        elements = []

        elements.append(Paragraph(school.name.upper(), title_style))
        if school.address:
            elements.append(Paragraph(f"{school.address}, {school.city} {school.state}", sub_style))
        elements.append(Paragraph(f"Phone: {school.phone} | Email: {school.email}", sub_style))
        elements.append(Spacer(1, 6))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#059669'), spaceBefore=2, spaceAfter=6))
        elements.append(Paragraph("OFFICIAL PAYMENT RECEIPT", ParagraphStyle('Heading', fontName='Helvetica-Bold', fontSize=11, alignment=TA_CENTER, textColor=colors.HexColor('#059669'))))
        elements.append(Spacer(1, 8))

        # Receipt Meta
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
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 10))

        # Financial breakdown table
        curr = school.currency_symbol
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
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        elements.append(fin_table)
        elements.append(Spacer(1, 14))

        rec_by = payment.recorded_by.full_name if payment.recorded_by else "Accounts Officer"
        elements.append(Paragraph(f"Received By: <b>{rec_by}</b>", body_reg))
        elements.append(Spacer(1, 14))

        sig_data = [
            [Paragraph("______________________<br/><b>Authorized Signature / Stamp</b>", body_center)]
        ]
        sig_table = Table(sig_data, colWidths=[13.5 * cm])
        sig_table.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER')]))
        elements.append(sig_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
