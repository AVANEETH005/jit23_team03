import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable, PageBreak, KeepTogether
)

def build_pdf():
    pdf_filename = r"C:\Users\avane\.gemini\antigravity\brain\02bb323d-00df-445a-ad3a-9633561fe4ab\Smart_Stock_Intelligence_System_Complete_Documentation.pdf"
    
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor('#0F172A')    # Slate 900
    ACCENT = colors.HexColor('#2563EB')     # Primary Blue
    EMERALD = colors.HexColor('#059669')    # Success Emerald
    DARK_BG = colors.HexColor('#1E293B')    # Slate 800
    LIGHT_BG = colors.HexColor('#F8FAFC')   # Slate 50
    CARD_BG = colors.HexColor('#F1F5F9')    # Slate 100
    TEXT_MUTED = colors.HexColor('#64748B') # Slate 500
    TEXT_DARK = colors.HexColor('#0F172A')  # Dark Slate

    # Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=ACCENT,
        alignment=0,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY,
        spaceBefore=16,
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=ACCENT,
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=12,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0284C7'),
        backColor=LIGHT_BG,
        borderColor=colors.HexColor('#E2E8F0'),
        borderWidth=1,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6
    )

    story = []

    # ---------------------------------------------------------
    # COVER / HEADER BANNER
    # ---------------------------------------------------------
    story.append(Paragraph("Smart Stock Intelligence System", title_style))
    story.append(Paragraph("Full-Stack Enterprise Inventory Platform • YOLO v8 Neural QA • Demand Forecasting • Multi-Branch Logistics", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=15))

    # Meta Table Info
    meta_data = [
        [
            Paragraph("<b>Project Version:</b> 1.0.0 Production", body_style),
            Paragraph("<b>Currency Standard:</b> ₹ INR (Indian Rupee)", body_style),
            Paragraph("<b>Date:</b> July 2026", body_style)
        ],
        [
            Paragraph("<b>Frontend:</b> React 19 + Tailwind CSS", body_style),
            Paragraph("<b>Backend:</b> Node.js + Express + MongoDB", body_style),
            Paragraph("<b>AI Model:</b> TensorFlow.js YOLO COCO-SSD", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[2.5*inch, 2.5*inch, 2.5*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # 1. EXECUTIVE SUMMARY & ARCHITECTURE
    # ---------------------------------------------------------
    story.append(Paragraph("1. Executive Summary & Core Objectives", h1_style))
    exec_summary_text = (
        "The <b>Smart Stock Intelligence System</b> is an ultra-modern SaaS inventory platform designed "
        "for single-pane-of-glass warehouse control, automated computer vision quality assurance, "
        "predictive demand forecasting, and inter-company stock transfers. Built with an Apple-level clean "
        "aesthetic, it features full dual-database resilience (MongoDB Atlas + local JSON fallback), "
        "real-time TensorFlow.js YOLO neural object detection, and complete INR (₹) currency localization."
    )
    story.append(Paragraph(exec_summary_text, body_style))
    story.append(Spacer(1, 8))

    # Core Features Summary Box
    features_data = [
        [Paragraph("<b>Key System Capability</b>", body_style), Paragraph("<b>Technical Solution</b>", body_style)],
        [Paragraph("<b>Automated Stock Intake</b>", body_style), Paragraph("Real-time YOLO object detection automatically adds +1 stock on QA pass.", body_style)],
        [Paragraph("<b>Visual Defect Quarantine</b>", body_style), Paragraph("Webcam edge-contour scanning logs photo evidence and deducts defective stock.", body_style)],
        [Paragraph("<b>Predictive Demand Engine</b>", body_style), Paragraph("Recharts sales velocity analytics, seasonal indices, and safety buffer reordering.", body_style)],
        [Paragraph("<b>Expiry Markdown Engine</b>", body_style), Paragraph("Monitors perishable shelf-life with automated 20%-50% clearance discount prompts.", body_style)],
        [Paragraph("<b>5-Tier Routing & Marketplace</b>", body_style), Paragraph("Inter-branch stock transfers and partner company excess stock exchange network.", body_style)],
        [Paragraph("<b>Currency & Locale</b>", body_style), Paragraph("Native Indian Rupee (₹ INR) currency formatters and multi-category item support.", body_style)]
    ]
    feat_table = Table(features_data, colWidths=[2.2*inch, 5.3*inch])
    feat_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (1,0), colors.white),
        ('BACKGROUND', (0,1), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(feat_table)
    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # EMBEDDED SYSTEM SCREENSHOT 1
    # ---------------------------------------------------------
    img1_path = r"C:\Users\avane\.gemini\antigravity\brain\02bb323d-00df-445a-ad3a-9633561fe4ab\media__1784359718691.png"
    if os.path.exists(img1_path):
        story.append(Paragraph("<b>Figure 1: Defect Quarantine Audit Workspace & Historical Log Table</b>", h2_style))
        img1 = Image(img1_path, width=7.5*inch, height=3.5*inch)
        story.append(img1)
        story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # 2. YOLO AI WEBCAM ENGINE DETAILED WORKING
    # ---------------------------------------------------------
    story.append(Paragraph("2. Real-Time YOLO Neural Object Detection Engine", h1_style))
    yolo_text = (
        "The system incorporates a <b>TensorFlow.js COCO-SSD YOLO v8 Neural Network</b> operating 100% "
        "in client-side WebGL. The engine performs continuous 30 FPS inference directly on the webcam stream:"
    )
    story.append(Paragraph(yolo_text, body_style))
    
    story.append(Paragraph("• <b>Live Bounding Box Overlay:</b> Draws real-time emerald green tracking boxes with class names and confidence ratings (e.g. <i>CELL PHONE 96%</i>, <i>LAPTOP 94%</i>, <i>BOTTLE 88%</i>).", bullet_style))
    story.append(Paragraph("• <b>Automated Stock Intake (Mode A):</b> When an item passes QA checks, stock is automatically incremented (+1) or a new custom product is registered.", bullet_style))
    story.append(Paragraph("• <b>Defect Quarantine Audit (Mode B):</b> Isolates surface cracks, damaged packaging, or broken seals, captures Base64 photo proof, and adjusts inventory downwards.", bullet_style))
    story.append(Paragraph("• <b>Unlisted Item Support:</b> Allows auditing and defect-checking custom items not present in the current catalog.", bullet_style))
    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # EMBEDDED SYSTEM SCREENSHOT 2
    # ---------------------------------------------------------
    img2_path = r"C:\Users\avane\.gemini\antigravity\brain\02bb323d-00df-445a-ad3a-9633561fe4ab\media__1784359901519.png"
    if os.path.exists(img2_path):
        story.append(Paragraph("<b>Figure 2: Reports & Export Center with Multi-Branch Valuation Summary in ₹ INR</b>", h2_style))
        img2 = Image(img2_path, width=7.5*inch, height=3.5*inch)
        story.append(img2)
        story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # 3. COMPLETE MODULE SUMMARY & TECHNICAL DATA
    # ---------------------------------------------------------
    story.append(Paragraph("3. Detailed Module Specifications", h1_style))

    modules_info = [
        ("Authentication & RBAC", "JWT-based multi-role authorization (Admin, Manager, Staff, Branch User, Partner) with token persistence and input normalization."),
        ("Multi-Category Product Catalog", "Supports Electronics, Pharmaceuticals, Groceries & FMCG, Apparel, Hardware, Office Supplies, Home & Kitchen, Beverages, and Auto Parts priced in ₹ INR."),
        ("Predictive Reordering & Forecasting", "Calculates next-month demand velocity using moving averages and seasonal indices. Automatically computes safety buffer quantities."),
        ("Expiry & Markdown Intelligence", "Monitors perishable shelf-life. Suggests 20% promotional discounts for items < 30 days and 50% clearance markdowns for items < 7 days."),
        ("5-Tier Priority Transfer Engine", "Sequentially routes stock requests: 1. Current Branch -> 2. Sister Branch -> 3. Main Warehouse -> 4. Partner Marketplace Exchange -> 5. Supplier Purchase Order."),
        ("Domain AI Chatbot & Voice Assistant", "Integrated voice command recognition (`SpeechRecognition`) and text-to-speech response synthesis (`SpeechSynthesis`) for hands-free warehouse operations.")
    ]

    for title, desc in modules_info:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", body_style))

    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # 4. CURRENT SAMPLE INVENTORY CATALOG DATA (TABLE)
    # ---------------------------------------------------------
    story.append(Paragraph("4. Live Inventory Catalog Dataset (Prices in ₹ INR)", h1_style))

    catalog_headers = ["Product Name", "SKU", "Category", "Qty", "Unit Price (₹)", "Branch Location"]
    catalog_rows = [
        catalog_headers,
        ["MacBook Pro 16 M3", "MAC-PRO-16", "Electronics", "120", "₹2,49,900.00", "Main Warehouse (Bengaluru)"],
        ["iPhone 15 Pro 256GB", "IPHONE-15", "Electronics", "80", "₹1,34,900.00", "Main Warehouse (Bengaluru)"],
        ["Basmati Rice Premium 10kg", "RICE-BAS-10K", "Groceries & FMCG", "500", "₹1,250.00", "Main Warehouse (Bengaluru)"],
        ["Cotton Round Neck T-Shirt L", "APP-TSHIRT-L", "Apparel & Clothing", "250", "₹899.00", "Main Warehouse (Bengaluru)"],
        ["MacBook Pro 16 M3", "MAC-PRO-16", "Electronics", "5", "₹2,49,900.00", "Branch A - Downtown Hub"],
        ["iPhone 15 Pro 256GB", "IPHONE-15", "Electronics", "0", "₹1,34,900.00", "Branch A - Downtown Hub"],
        ["Paracetamol 500mg (15s)", "PARA-500", "Pharmaceuticals", "45", "₹45.00", "Branch A - Downtown Hub"],
        ["Amoxicillin 250mg Capsules", "AMOX-250", "Pharmaceuticals", "15", "₹120.00", "Branch A - Downtown Hub"],
        ["Bosch Power Drill 750W", "HW-DRILL-750", "Industrial & Hardware", "18", "₹4,299.00", "Branch A - Downtown Hub"],
        ["Samsung S24 Ultra 512GB", "SAMP-S24", "Electronics", "25", "₹1,29,999.00", "Apex Central Hub (Mumbai)"]
    ]

    cat_table_data = []
    for row_idx, row in enumerate(catalog_rows):
        formatted_row = []
        for cell in row:
            p_style = body_style if row_idx > 0 else ParagraphStyle('TableHeader', parent=body_style, fontName='Helvetica-Bold', textColor=colors.white)
            formatted_row.append(Paragraph(cell, p_style))
        cat_table_data.append(formatted_row)

    cat_table = Table(cat_table_data, colWidths=[1.8*inch, 1.0*inch, 1.3*inch, 0.5*inch, 1.1*inch, 1.8*inch])
    cat_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BACKGROUND', (0,1), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(cat_table)

    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=10))
    story.append(Paragraph("<b>Smart Stock Intelligence System © 2026 • Executive Technical Documentation</b>", ParagraphStyle('Footer', parent=body_style, alignment=1, textColor=TEXT_MUTED, fontSize=8)))

    # Build Document
    doc.build(story)
    print("PDF build successful!")

if __name__ == "__main__":
    build_pdf()
