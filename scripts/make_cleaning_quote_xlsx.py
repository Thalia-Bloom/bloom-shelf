#!/usr/bin/env python3
"""Build the Post-Construction Cleaning Quote workbook."""
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.comments import Comment
from openpyxl.worksheet.datavalidation import DataValidation

OUT = Path(__file__).resolve().parents[1] / "products" / "cleaning-quote-kit" / "build" / "Post-Construction-Cleaning-Quote.xlsx"

INK = "192722"
GREEN = "175B3F"
WASH = "E8EEE6"
INPUT = "D9EAD3"
OUTFILL = "FFF2CC"
MUTED = "58665E"
thin = Border(
    left=Side(style="thin", color="D5DDD5"),
    right=Side(style="thin", color="D5DDD5"),
    top=Side(style="thin", color="D5DDD5"),
    bottom=Side(style="thin", color="D5DDD5"),
)
title_font = Font(name="Calibri", size=18, bold=True, color=INK)
label_font = Font(name="Calibri", size=11, color=INK)
head_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
note_font = Font(name="Calibri", size=10, italic=True, color=MUTED)
money = '"$"#,##0.00'
hours = '0.00" h"'
pct = "0%"
num = "#,##0.00"


def style_input(cell, number=None):
    cell.fill = PatternFill("solid", fgColor=INPUT)
    cell.font = label_font
    cell.border = thin
    cell.alignment = Alignment(vertical="center")
    if number:
        cell.number_format = number


def style_out(cell, number=None):
    cell.fill = PatternFill("solid", fgColor=OUTFILL)
    cell.font = Font(name="Calibri", size=11, bold=True, color=INK)
    cell.border = thin
    if number:
        cell.number_format = number


def col_widths(ws, widths):
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w


def add_quote_sheet(wb):
    ws = wb.active
    ws.title = "Quote"
    ws.sheet_properties.tabColor = GREEN
    ws["A1"] = "Post-Construction Cleaning Quote"
    ws["A1"].font = title_font
    ws.merge_cells("A1:D1")
    ws["A2"] = (
        "Enter the green cells. Yellow cells calculate. This is not a market price list. "
        "It shows what YOUR rate, hours, and extras add up to. No income is guaranteed."
    )
    ws["A2"].font = note_font
    ws.merge_cells("A2:D2")
    ws.row_dimensions[2].height = 36
    ws["A2"].alignment = Alignment(wrap_text=True, vertical="center")

    for col, text in enumerate(["INPUTS — green cells only", "Value", "Note"], 1):
        cell = ws.cell(4, col, text)
        cell.font = head_font
        cell.fill = PatternFill("solid", fgColor=GREEN)

    labels = [
        ("Job name", "First commercial post-construction clean", None, "Your words, not a contract title."),
        ("Floor area (sq ft)", 10000, num, "From a tape, laser, or the plans. Not a parking-lot guess."),
        ("Stories", 2, "0", "Context only. Hours still come from your estimate."),
        ("Crew size (people)", 3, "0", "How many cleaners you will send."),
        ("Labor rate you will quote ($ per person-hour)", 65, money, "What YOU will charge. This sheet does not pick the rate for you."),
        ("Hours you expect each person to work", 8, "0.00", "On-site plus load-in/out. Walk the site before you lock this."),
        ("Debris level", "Typical post-construction", None, "Light dust / Typical post-construction / Heavy leftover debris."),
        ("Restrooms to detail", 8, "0", "Count fixtures you will actually clean."),
        ("Extra minutes per restroom", 20, "0", "Toilets, mirrors, restock if that is in scope."),
        ("Windows / glass panels", 40, "0", "Count the units you will wash."),
        ("Extra minutes per window", 6, "0", "Interior only unless you wrote exterior into the scope."),
        ("Supplies for this job ($)", 250, money, "Consumables for THIS job."),
        ("Dumpster / haul-away ($)", 450, money, "Put 0 if the GC already has one and you will not haul."),
        ("Travel / parking / after-hours ($)", 80, money, "One number. Itemize on the walk sheet if asked."),
        ("Overhead you want covered", 0.18, pct, "Insurance, fuel, unpaid admin, idle time."),
        ("Uncertainty buffer", 0.12, pct, "First commercial job: leave room for paint overspray and missed rooms."),
    ]
    for i, (label, value, fmt, note) in enumerate(labels):
        r = 5 + i
        ws.cell(r, 1, label).font = label_font
        ws.cell(r, 1).alignment = Alignment(vertical="center", wrap_text=True)
        ws.cell(r, 2, value)
        style_input(ws.cell(r, 2), fmt)
        ws.cell(r, 3, note).font = note_font
        ws.cell(r, 3).alignment = Alignment(wrap_text=True, vertical="center")
        ws.row_dimensions[r].height = 28

    dv = DataValidation(
        type="list",
        formula1='"Light dust,Typical post-construction,Heavy leftover debris"',
        allow_blank=False,
    )
    dv.error = "Pick one of the three debris levels."
    dv.errorTitle = "Debris level"
    ws.add_data_validation(dv)
    dv.add("B11")

    ws["A22"] = "RESULTS — do not type here"
    ws["A22"].font = head_font
    ws["A22"].fill = PatternFill("solid", fgColor="7A5C12")
    ws.merge_cells("A22:C22")

    # Debris factor
    ws["A23"] = "Debris factor"
    ws["B23"] = '=IF(B11="Light dust",1,IF(B11="Heavy leftover debris",1.7,1.35))'
    style_out(ws["B23"], "0.00")
    ws["C23"] = "Light 1.00 · Typical 1.35 · Heavy 1.70. Change the level, not this cell."
    ws["C23"].font = note_font

    ws["A24"] = "Base crew-hours (people × hours × debris)"
    ws["B24"] = "=B8*B10*B23"
    style_out(ws["B24"], "0.00")
    ws["C24"] = "If this looks short for the square footage, believe the building, not the cell."
    ws["C24"].font = note_font

    ws["A25"] = "Add-on hours (restrooms + windows)"
    ws["B25"] = "=(B12*B13+B14*B15)/60"
    style_out(ws["B25"], "0.00")
    ws["C25"] = "Converted from minutes."
    ws["C25"].font = note_font

    ws["A26"] = "Total labor hours"
    ws["B26"] = "=B24+B25"
    style_out(ws["B26"], "0.00")
    ws["C26"] = "Person-hours you are billing at the rate in B9."
    ws["C26"].font = note_font

    ws["A27"] = "Labor"
    ws["B27"] = "=B26*B9"
    style_out(ws["B27"], money)
    ws["C27"] = "Hours × the rate you typed. Not a prevailing-wage table."
    ws["C27"].font = note_font

    ws["A28"] = "Supplies + haul + travel"
    ws["B28"] = "=B16+B17+B18"
    style_out(ws["B28"], money)

    ws["A29"] = "Subtotal before overhead"
    ws["B29"] = "=B27+B28"
    style_out(ws["B29"], money)

    ws["A30"] = "Overhead"
    ws["B30"] = "=B29*B19"
    style_out(ws["B30"], money)

    ws["A31"] = "Uncertainty buffer"
    ws["B31"] = "=(B29+B30)*B20"
    style_out(ws["B31"], money)

    ws["A32"] = "QUOTE TOTAL"
    ws["B32"] = "=B29+B30+B31"
    style_out(ws["B32"], money)
    ws["A32"].font = Font(name="Calibri", size=13, bold=True, color=INK)
    ws["B32"].font = Font(name="Calibri", size=13, bold=True, color=INK)

    ws["A33"] = "Implied $ per sq ft"
    ws["B33"] = '=IF(B6=0,"",B32/B6)'
    style_out(ws["B33"], money)
    ws["C33"] = "A check against your own past jobs. Not a published market rate."
    ws["C33"].font = note_font

    ws["A34"] = "Implied $ per labor hour after overhead and buffer"
    ws["B34"] = '=IF(B26=0,"",B32/B26)'
    style_out(ws["B34"], money)
    ws["C34"] = "If this is below what you need to stay in business, raise the rate or the hours — on purpose, in writing."
    ws["C34"].font = note_font

    ws["A36"] = (
        "Before you send this number: walk the site with the checklist in this kit, write what is included and excluded, "
        "and name who supplies dumpsters, water, power, and a certificate of insurance. "
        "This workbook cannot see hidden construction dust, union rules, after-hours premiums, or what the GC will pay."
    )
    ws["A36"].font = note_font
    ws.merge_cells("A36:C36")
    ws["A36"].alignment = Alignment(wrap_text=True)
    ws.row_dimensions[36].height = 48

    ws["B9"].comment = Comment("Type the rate you will actually quote. The sheet will not argue with the client for you.", "Bloom Shelf")
    col_widths(ws, [52, 22, 78])
    ws.freeze_panes = "A5"
    ws.print_title_rows = "1:2"
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1
    ws.oddFooter.left.text = "Bloom Web Services LLC · not a market price list · support@thaliabloom.com"


def add_example_sheet(wb):
    ws = wb.create_sheet("Worked example")
    ws["A1"] = "Fictional worked example — Harbor Mill Medical Office"
    ws["A1"].font = title_font
    ws.merge_cells("A1:B1")
    ws["A2"] = (
        "Made-up building in a made-up town. 10,000 sq ft, two stories, three cleaners. "
        "This is not a customer, not a bid, and not a recommended rate."
    )
    ws["A2"].font = note_font
    ws.merge_cells("A2:B2")
    ws["A2"].alignment = Alignment(wrap_text=True)
    ws.row_dimensions[2].height = 36

    example = [
        ("Job name", "Harbor Mill Medical Office — post-construction (fictional)"),
        ("Floor area", "10,000 sq ft"),
        ("Stories", "2"),
        ("Crew", "3 people"),
        ("Quoted labor rate", "$65 per person-hour (the owner typed this; it is not advice)"),
        ("Hours each", "8"),
        ("Debris", "Typical post-construction (factor 1.35)"),
        ("Restrooms", "8 × 20 minutes"),
        ("Windows", "40 × 6 minutes"),
        ("Supplies", "$250"),
        ("Dumpster", "$450"),
        ("Travel", "$80"),
        ("Overhead", "18%"),
        ("Buffer", "12%"),
    ]
    ws["A4"] = "What they typed"
    ws["B4"] = "Value"
    ws["A4"].font = head_font
    ws["B4"].font = head_font
    ws["A4"].fill = PatternFill("solid", fgColor=GREEN)
    ws["B4"].fill = PatternFill("solid", fgColor=GREEN)
    for i, (k, v) in enumerate(example, 5):
        ws.cell(i, 1, k).font = label_font
        ws.cell(i, 2, v).font = label_font

    ws["A20"] = "What the Quote sheet should show with those inputs"
    ws["A20"].font = Font(name="Calibri", size=12, bold=True)
    calc = [
        ("Debris factor", "1.35"),
        ("Base crew-hours", "3 × 8 × 1.35 = 32.40"),
        ("Add-on hours", "(8×20 + 40×6) / 60 = 6.67"),
        ("Total labor hours", "39.07"),
        ("Labor", "39.07 × $65 ≈ $2,539.55"),
        ("Add-ons", "$250 + $450 + $80 = $780.00"),
        ("Subtotal", "$3,319.55"),
        ("Overhead 18%", "$597.52"),
        ("Buffer 12%", "$470.05"),
        ("Quote total", "$4,387.12"),
        ("$ / sq ft", "$0.44"),
        ("$ / labor hour after overhead and buffer", "$112.29"),
    ]
    for i, (k, v) in enumerate(calc, 21):
        ws.cell(i, 1, k).font = label_font
        ws.cell(i, 2, v).font = Font(name="Calibri", size=11, bold=True)

    ws["A34"] = (
        "If your Quote sheet is more than a few cents off, check that debris is the dropdown value "
        "'Typical post-construction' and that percentages are 18% and 12%, not 18 and 12."
    )
    ws["A34"].font = note_font
    ws.merge_cells("A34:B34")
    ws["A34"].alignment = Alignment(wrap_text=True)
    ws.row_dimensions[34].height = 36
    col_widths(ws, [52, 78])


def add_limits_sheet(wb):
    ws = wb.create_sheet("Limits")
    ws["A1"] = "Limits — read before you send a number"
    ws["A1"].font = title_font
    lines = [
        "This workbook is a calculator. It is not a bid, a contract, a prevailing-wage table, or legal, tax, insurance, or licensing advice.",
        "It does not know local labor rules, union requirements, after-hours premiums, or what a general contractor will pay.",
        "It does not inspect the building. Walk the site. Write inclusions and exclusions. Name who supplies dumpsters, water, power, and insurance certificates.",
        "Post-construction work can hide fine dust in HVAC, overspray on glass, grout haze, and rooms that were 'done' on the punch list and are not clean. Your buffer exists because of that. It is not extra profit you can spend.",
        "The labor rate is whatever you type. A client asking for $55/hour on a 10,000 sq ft two-story job is a negotiation, not a fact this sheet can settle.",
        "Do not send only the total. Send the walk sheet, the scope, and the number. If they change the building, change the sheet.",
        "No income, job, or customer acceptance is guaranteed.",
        "Seller: Bloom Web Services LLC. Support: support@thaliabloom.com. 14-day refund by email.",
    ]
    for i, line in enumerate(lines, 3):
        ws.cell(i, 1, line).font = label_font
        ws.cell(i, 1).alignment = Alignment(wrap_text=True)
        ws.row_dimensions[i].height = 48
    ws.column_dimensions["A"].width = 110


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb = Workbook()
    add_quote_sheet(wb)
    add_example_sheet(wb)
    add_limits_sheet(wb)
    wb.save(OUT)
    print(OUT, OUT.stat().st_size)


if __name__ == "__main__":
    main()
