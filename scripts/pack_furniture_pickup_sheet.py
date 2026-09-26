#!/usr/bin/env python3
"""Write furniture-pickup-sheet buyer files, xlsx, pdf, zip, and hashes."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROD = ROOT / "products" / "furniture-pickup-sheet"
BUILD = PROD / "build"
PREVIEW = PROD / "preview"

README = """Furniture Pickup Go/No-Go Sheet
Bloom Web Services LLC
$7 one-time download

WHAT YOU GOT
This zip is one decision sheet for ONE curb or Marketplace pickup.
You type the numbers you can see. The Pickup sheet adds them up.
Expected resale is YOUR GUESS. This is not an appraisal and not a
demand report. Bloom does not inspect, haul, or sell the piece.

Files in this zip:
  00-limits.txt                         Read first. What this sheet will not do.
  photo-checklist.md                    All sides, underside, joints, odor, measure.
  Furniture-Pickup-Go-No-Go.xlsx        Workbook: Limits, Pickup, Worked example.
  Furniture-Pickup-Go-No-Go-Sheet.pdf   Printable copy of the text files.

ORDER OF USE
  1. Read the Limits sheet in the workbook, or 00-limits.txt in this zip.
  2. See the piece in person with photo-checklist.md. Do not decide
     from listing photos alone if you can stand in front of it.
  3. Open the Pickup sheet. Type the green cells for THIS pickup.
  4. Read money left after costs, implied hourly, and GO / CAUTION /
     NO-GO. Yellow cells calculate. Do not type in them.
  5. Edit the GO and CAUTION hourly thresholds if your floor is not
     the starter rule (GO at your target hourly, CAUTION at half).

Starting numbers are a fictional Harbor Mill sideboard. Overwrite
them. A GO is not a sale. If a hard red flag is Yes, walk.

SUPPORT
  Email support@thaliabloom.com
  14-day refund by email. Say you bought the Furniture Pickup
  Go/No-Go Sheet and want a refund.
  Seller: Bloom Web Services LLC
"""

LIMITS = """LIMITS (read before you drive)

This kit is a calculator and a photo punch list for ONE pickup. It
is not an appraisal. It is not a market-demand report. It is not a
listing tool, a hauling service, or an inventory app. It is not
legal, tax, pest, or safety advice.

WHAT THIS DOWNLOAD DOES NOT DO
  - It does not inspect the piece. You have to see it, smell it,
    and measure it.
  - It does not know local demand or what a buyer will pay.
  - It does not pick a resale price. Expected resale is YOUR GUESS
    and is labeled that way on the Pickup sheet.
  - It does not book a truck, write a listing, or meet a buyer.
  - It does not guarantee a sale, income, profit, or a clear piece.

RED FLAGS
  Smoke, bedbugs/pests, structural damage, and too-big-for-today's
  vehicle each force NO-GO. Missing hardware caps the decision at
  CAUTION unless you set that flag to No after the parts cost is
  already in estimated repair.

THRESHOLDS
  GO and CAUTION hourly floors are green cells you can edit. The
  starter rule is GO at your target hourly and CAUTION at half of
  that. Below the CAUTION floor, the money side is NO-GO.

YOU ARE RESPONSIBLE
  Photograph all sides, the underside, and the joints. Smell the
  piece. Measure the piece against the vehicle opening and the
  doorway it must pass. Count unpaid hours. If the piece changes
  when you arrive, change the sheet or walk.

Seller: Bloom Web Services LLC
Support: support@thaliabloom.com
14-day refund by email.
"""

PHOTO = """# Photo and measure checklist

One pickup. Print this. Use it at the piece before you trust the
Pickup sheet. This is a punch list, not an inspection report, not
an appraisal, and not a haul plan.

Piece / listing: ________________________________

Where (curb / Marketplace / other): ________________________________

Date: ____________  Looked at by: ____________________

Vehicle that will show up today: ________________________________

## Do not skip seeing it

- [ ] You are standing at the piece (or you have already decided this is a walk)
- [ ] Listing photos are not a substitute for the next two sections
- [ ] You can load it with the people who will actually be there

## Photos - all sides

- [ ] Front
- [ ] Back
- [ ] Left
- [ ] Right
- [ ] Top / table surface / crown
- [ ] Underside (turn it or get on the floor)
- [ ] Each drawer box or door, open
- [ ] Close-ups of every ding you will have to explain later

Save the photos on your phone before you offer money.

## Joints, structure, hardware

- [ ] Corners, stretchers, and where legs meet the case - tight or moving
- [ ] Splits, rot, water rings that go into the wood, not just the finish
- [ ] Drawer slides and door sag
- [ ] Hardware present vs missing (knobs, pulls, clips, feet, glass knobs)
- [ ] Replacement parts already in the repair $ on the Pickup sheet: yes / no

Structural damage on the Pickup sheet is a Yes/No. If the frame is
shot, mark Yes and walk. Missing hardware is a separate flag.

## Odor

Smell the piece, not the listing, not the yard, not the seller's story.

- [ ] Smoke
- [ ] Pet / urine
- [ ] Mold / basement
- [ ] Bedbug or pest signs in joints, corners, and the underside
- [ ] No odor you would not want in your vehicle or house

Smoke or pests on the Pickup sheet is a Yes/No. Yes forces NO-GO.

## Measure doorway vs piece vs vehicle

Write inches. Guessing in the driveway is how pieces get stuck.

Piece width: ______   depth: ______   height: ______

Vehicle opening (door, hatch, or bed) width: ______   height: ______

Doorway the piece must pass (home or storage) width: ______   height: ______

Stairs / turns / elevator: ________________________________

- [ ] Piece fits today's vehicle without a second trip or a rented van
- [ ] Piece will pass the doorway it has to pass
- [ ] Weight is a load the people present can lift without a hero move

If it will not fit the vehicle that will show up, mark too-big as
Yes on the Pickup sheet. That flag forces NO-GO.

## Numbers to carry back to the workbook

- [ ] Asking price: $ ________
- [ ] Cash on hand for this pickup: $ ________
- [ ] Repair / parts guess: $ ________
- [ ] Hours (drive both ways, load, repair, photos, list, meetup): ________
- [ ] Round-trip miles: ________
- [ ] Fuel per mile: $ ________
- [ ] Platform fee % if you will list it (0 if local cash): ________
- [ ] Expected resale (YOUR GUESS, not a market value): $ ________

Notes from the piece:

________________________________________________________________

________________________________________________________________

Do not type a GO from memory in the van. The workbook cannot see
the piece, and it cannot sell it for you.
"""

LANDING = """# Furniture Pickup Go/No-Go Sheet

**$7 one-time.** Pay with Stripe. Download a zip.

One pickup. One keep-or-walk decision. You type the numbers you
can see. The sheet adds them up. It does not know what the piece
will sell for.

Seller: **Bloom Web Services LLC**
Support: **support@thaliabloom.com**
Refund: **14 days by email** (say you bought this sheet).

## What it is

You found one dresser, sideboard, or chair on a curb or a
Marketplace listing. You need a keep-or-walk call before you
drive, not a feeling in the driveway.

This download is:

- An Excel workbook (Pickup sheet, Limits sheet, fictional worked example)
- A photo and measure checklist (all sides, underside, joints, odor, doorway vs piece)
- A printable PDF of the text files

You type the green cells: asking price, cash on hand, repair guess,
hours, target hourly, miles, fuel, platform fees, expected resale
(labeled as your guess), and red flags. Yellow cells show money
left after costs, implied hourly, and GO / CAUTION / NO-GO from
thresholds you can edit.

## What it is not

- Not an appraisal and not a market-demand report
- Not a listing tool, not a hauling service, and not an inventory app
- Not legal, tax, pest, or safety advice
- It does not know local demand or the price a buyer will actually pay
- No income, sale, or "this piece will sell" promise

There are no testimonials on this page because we are not going to
invent them.

## Who it is for

Someone who flips one piece at a time and will look at that piece
in person before they type the sheet. If you can photograph all
sides, smell it, measure it against the vehicle and the doorway,
and type your own resale guess, you can use this sheet.

## Who it is not for

- Anyone who wants software to price a whole route of curb piles
- Anyone who will not look at the piece in person
- Anyone who wants Bloom to inspect, pick up, repair, or sell furniture
- Anyone who wants a guaranteed resale price

## Price and how it arrives

**$7 USD, one time.** Checkout is Stripe. You get a zip:
`Furniture-Pickup-Go-No-Go-Sheet.zip`. Open `README.txt` first,
then `00-limits.txt`, then use the photo checklist at the piece
before you trust the Pickup sheet.
"""

PREVIEW_TXT = """Furniture Pickup Go/No-Go Sheet - public sample (not the paid workbook)

You type these inputs on the Pickup sheet (green cells). Yellow cells
add them up.

  Asking price
  Cash on hand for this pickup
  Estimated repair / parts
  Estimated hours (drive, load, repair, photos, listing, meetup)
  Your target hourly
  Round-trip miles and fuel per mile
  Platform fees % (0% if you sell for local cash)
  Expected resale - labeled YOUR GUESS, not a market value
  Red flags: smoke, bedbugs/pests, structural damage, missing
  hardware, too big for today's vehicle
  GO and CAUTION hourly floors (you can edit them)

The sheet then shows money left after costs, implied hourly, and
GO / CAUTION / NO-GO. It does not know local demand or what the
piece will actually sell for. A GO is not a sale.

Paid download after Stripe checkout: Excel workbook, photo and
measure checklist, and a printable PDF.

Support: support@thaliabloom.com. $7 USD one-time. Refund by email
within 14 days of purchase. Seller: Bloom Web Services LLC.
"""

COMBINED_HEAD = """# Furniture Pickup Go/No-Go Sheet

Bloom Web Services LLC. $7 one-time download.
One pickup. One keep-or-walk decision. Not an appraisal.
Support: support@thaliabloom.com. 14-day refund by email.

----- README -----

"""


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text if text.endswith("\n") else text + "\n", encoding="utf-8")


def main() -> int:
    if importlib.util.find_spec("openpyxl") is None:
        raise SystemExit("Requires openpyxl; run with a Python environment that has it installed.")
    BUILD.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    write_text(BUILD / "README.txt", README)
    write_text(BUILD / "00-limits.txt", LIMITS)
    write_text(BUILD / "photo-checklist.md", PHOTO)
    write_text(PROD / "LANDING.md", LANDING)
    write_text(PREVIEW / "what-you-get.txt", PREVIEW_TXT)
    combined = COMBINED_HEAD + README + "\n\n----- LIMITS -----\n\n" + LIMITS + "\n\n" + PHOTO
    write_text(BUILD / "combined.md", combined)

    subprocess.check_call([sys.executable, str(ROOT / "scripts" / "make_furniture_pickup_xlsx.py")])
    pdf = BUILD / "Furniture-Pickup-Go-No-Go-Sheet.pdf"
    subprocess.check_call(
        [
            sys.executable,
            str(ROOT / "scripts" / "write_pdf.py"),
            str(BUILD / "combined.md"),
            str(pdf),
            "--title",
            "Furniture Pickup Go/No-Go Sheet",
        ]
    )
    stale = BUILD / "Furniture-Pickup-Go-No-Go.pdf"
    if stale.exists():
        stale.unlink()

    names = [
        "README.txt",
        "00-limits.txt",
        "photo-checklist.md",
        "Furniture-Pickup-Go-No-Go.xlsx",
        "Furniture-Pickup-Go-No-Go-Sheet.pdf",
    ]
    zip_path = PROD / "buyer.zip"
    if zip_path.exists():
        zip_path.unlink()
    # zip -X: no extra attributes, stored names only
    subprocess.check_call(["zip", "-X", str(zip_path), *names], cwd=BUILD)

    blob = zip_path.read_bytes()
    if blob[:2] != b"PK":
        raise SystemExit("buyer.zip is not a zip")
    sha = hashlib.sha256(blob).hexdigest()
    meta = {
        "slug": "furniture-pickup-sheet",
        "name": "Furniture Pickup Go/No-Go Sheet",
        "tagline": "One pickup. One keep-or-walk decision.",
        "price_cents": 700,
        "project_id": "shelf-furniture-pickup-v1",
        "zip_filename": "Furniture-Pickup-Go-No-Go-Sheet.zip",
        "bytes": len(blob),
        "sha256": sha,
        "contains": ["xlsx", "pdf", "md", "txt"],
        "for_who": ["furniture flipper screening one curb or Marketplace pickup"],
        "not_for": [
            "buyers who want software to price every piece",
            "anyone who wants Bloom to inspect, haul, or sell the furniture",
        ],
    }
    write_text(PROD / "product.json", json.dumps(meta, indent=2))
    with zipfile.ZipFile(zip_path) as zf:
        listing = zf.namelist()
    if listing != names:
        raise SystemExit(f"zip listing mismatch: {listing}")
    print(json.dumps({"bytes": len(blob), "sha256": sha, "zip": listing}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
