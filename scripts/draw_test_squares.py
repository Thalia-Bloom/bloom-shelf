#!/usr/bin/env python3
"""Printable test-square PDFs with exact 4-inch and 10 cm boxes. Stdlib only."""
from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "products" / "sewing-test-square-pack" / "build"

# PDF points: 1 inch = 72, 1 cm = 72/2.54
IN = 72.0
CM = 72.0 / 2.54
LETTER = (612.0, 792.0)
A4 = (595.28, 841.89)


def escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def pdf(page: tuple[float, float], box_pt: float, box_label: str, subtitle: str) -> bytes:
    w, h = page
    x = (w - box_pt) / 2
    y = (h - box_pt) / 2 - 18
    lines = [
        "0.5 w",
        "0 0 0 RG",
        "0 0 0 rg",
        f"{x:.3f} {y:.3f} {box_pt:.3f} {box_pt:.3f} re S",
        # tick marks at midpoints
        f"{x:.3f} {y + box_pt/2:.3f} m {x - 10:.3f} {y + box_pt/2:.3f} l S",
        f"{x + box_pt:.3f} {y + box_pt/2:.3f} m {x + box_pt + 10:.3f} {y + box_pt/2:.3f} l S",
        f"{x + box_pt/2:.3f} {y:.3f} m {x + box_pt/2:.3f} {y - 10:.3f} l S",
        f"{x + box_pt/2:.3f} {y + box_pt:.3f} m {x + box_pt/2:.3f} {y + box_pt + 10:.3f} l S",
        "BT",
        "/F1 16 Tf",
        f"1 0 0 1 {w/2 - 140:.3f} {h - 56:.3f} Tm",
        f"({escape('Print-scale test square')}) Tj",
        "/F1 12 Tf",
        f"1 0 0 1 {w/2 - 160:.3f} {h - 76:.3f} Tm",
        f"({escape(subtitle)}) Tj",
        f"1 0 0 1 {x + 12:.3f} {y + box_pt - 28:.3f} Tm",
        f"({escape(box_label)}) Tj",
        "/F1 10 Tf",
        f"1 0 0 1 48 56 Tm",
        "(Print at 100% / Actual size. Turn OFF fit-to-page and shrink-to-fit.) Tj",
        f"1 0 0 1 48 42 Tm",
        "(Measure the box with a hard ruler. If it is not exact, do not cut fabric yet.) Tj",
        f"1 0 0 1 48 28 Tm",
        "(Bloom Web Services LLC  ·  support@thaliabloom.com  ·  not a sewing pattern) Tj",
        "ET",
    ]
    stream = "\n".join(lines).encode("latin-1")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
        (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {w:.2f} {h:.2f}] "
            f"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>"
        ).encode(),
        f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out.extend(f"{i} 0 obj\n".encode())
        out.extend(obj)
        out.extend(b"\nendobj\n")
    xref = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode())
    out.extend(
        f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    )
    return bytes(out)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = {
        "letter-4-inch-test-square.pdf": pdf(
            LETTER, 4 * IN, "This box must measure 4 inches (10.16 cm) on each side.", "US Letter · 4 inch square"
        ),
        "letter-10cm-test-square.pdf": pdf(
            LETTER, 10 * CM, "This box must measure 10 cm (3.94 in) on each side.", "US Letter · 10 cm square"
        ),
        "a4-10cm-test-square.pdf": pdf(
            A4, 10 * CM, "This box must measure 10 cm (3.94 in) on each side.", "A4 · 10 cm square"
        ),
        "a4-4-inch-test-square.pdf": pdf(
            A4, 4 * IN, "This box must measure 4 inches (10.16 cm) on each side.", "A4 · 4 inch square"
        ),
    }
    for name, data in files.items():
        path = OUT / name
        path.write_bytes(data)
        print(name, len(data))


if __name__ == "__main__":
    main()
