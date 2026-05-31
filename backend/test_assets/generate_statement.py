import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def build_pdf_statement(filename, bank_name, subtitle, table_headers, transaction_data):
    """
    Build a clean, institutional bank statement latour for RAG parser testing. 
    """
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=40, 
        leftMargin=40,
        topMargin=40,
        bottomMargin=40 
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "BankTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1A365D")
    )

    meta_style = ParagraphStyle(
        "MetaText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4A5568")
    )

    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=12
    )

    cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12
    )

    content = []
    content.append(Paragraph(bank_name, title_style))
    content.append(Spacer(1,8))
    content.append(Paragraph(subtitle, meta_style))
    content.append(Spacer(1, 20))
    content.append(Paragraph("<b>TRANSACTION HISTORY</b>", cell_bold))
    content.append(Spacer(1,8))

    formatted_table_data = [[Paragraph(f"<b>{h}</b>", cell_bold) for h in table_headers]]

    for row in transaction_data:
        formatted_row = []
        for index, item in enumerate(row):
            if index >= 2:
                aligned_style = ParagraphStyle("RightCell", parent=cell_style, alignment=2)
                formatted_row.append(Paragraph(str(item), aligned_style))
            else:
                formatted_row.append(Paragraph(str(item), cell_style))
        formatted_table_data.append(formatted_row)
    
    tx_table = Table(formatted_table_data, colWidths=[80, 220, 110, 110] if len(table_headers) == 4 else [100, 300, 120])

    tx_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EDF2F7')), # Light grey header row
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.HexColor('#1A365D')), # Primary header border line
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.HexColor('#E2E8F0')), # Soft cell divider grids
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
    ]))

    content.append(tx_table)

    doc.build(content)
    print(f"Successfully generated structured PDF statement: {filename}")

if __name__ == "__main__":
    # === TEST CASE 1: The Two-Column (Debits vs Credits) Setup ===
    build_pdf_statement(
        filename="two_column_statement.pdf",
        bank_name="METRO PACIFIC TRUST BANK",
        subtitle="Statement Date: May 28, 2026<br/>Account Holder: Alex Mercer<br/>Account Number: 4412-8893-1102",
        table_headers=["Date", "Description", "Debits (-)", "Credits (+)"],
        transaction_data=[
            ["2026-05-02", "SAFEWAY SUPERMARKETS", "54.22", ""],
            ["2026-05-05", "AWS CLOUD BLOCKING", "14.99", ""],
            ["2026-05-12", "SHELL PETROL STATION", "45.00", ""],
            ["2026-05-15", "PAYROLL DIRECT DEP", "", "4,250.00"],
            ["2026-05-19", "CHEVRON STATION", "38.50", ""],
            ["2026-05-20", "STRIPE TRANSFER REVENUE", "", "1,120.00"],
            ["2026-05-24", "APPLE ONE SUBSCRIPTION", "22.95", ""],
            ["2026-05-26", "STARBUCKS COFFEE", "6.80", ""]
        ]
    )

    # === TEST CASE 2: Single Column Layout Using Plus / Minus Operators ===
    build_pdf_statement(
        filename="symbol_statement.pdf",
        bank_name="APEX PREMIUM CARD CORP",
        subtitle="Billing Cycle: 01 May 2026 To 25 May 2026<br/>Card Number: XXXX-XXXX-XXXX-5521",
        table_headers=["Transaction Date", "Description", "Amount (USD)"],
        transaction_data=[
            ["2026-05-01", "TRADER JOES GROCERY", "-112.40"],
            ["2026-05-03", "ADOBE CREATIVE CLOUD", "-54.99"],
            ["2026-05-07", "UBER TRIP TO AIRPORT", "-34.20"],
            ["2026-05-10", "ACH PAYMENT THANK YOU", "+2,500.00"],
            ["2026-05-14", "AIRBNB STAY BOOKING", "-420.00"],
            ["2026-05-18", "CASHBACK REWARD ACCRUAL", "+45.20"],
            ["2026-05-22", "MCALISTERS DELI", "-18.75"]
        ]
    )
    