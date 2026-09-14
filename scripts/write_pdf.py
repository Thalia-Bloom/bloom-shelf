#!/usr/bin/env python3
"""Write a plain multi-page Helvetica PDF from UTF-8 text. Stdlib only."""
from __future__ import annotations

import argparse
import re
from pathlib import Path


def escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def wrap(line: str, width: int = 92) -> list[str]:
    line = line.rstrip()
    if not line:
        return [""]
    words = line.split(" ")
    rows: list[str] = []
    current = ""
    for word in words:
        trial = word if not current else f"{current} {word}"
        if len(trial) <= width:
            current = trial
        else:
            if current:
                rows.append(current)
            current = word
    if current:
        rows.append(current)
    return rows or [""]


def lines_from_text(text: str) -> list[str]:
    lines: list[str] = []
    for raw in text.splitlines():
        if raw.startswith("# "):
            lines.extend([raw[2:].strip(), ""])
        elif raw.startswith("## "):
            lines.extend([raw[3:].strip(), ""])
        elif raw.startswith("- "):
            lines.extend(wrap("• " + raw[2:]))
        else:
            lines.extend(wrap(raw))
    return lines or [""]


def build_pdf(title: str, body: str) -> bytes:
    all_lines = lines_from_text(body)
    per_page = 46
    pages = [all_lines[i : i + per_page] for i in range(0, len(all_lines), per_page)]
    n = len(pages)
    font_id = 3 + 2 * n
    objects: list[bytes] = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        f"<< /Type /Pages /Count {n} /Kids [{' '.join(f'{3 + i} 0 R' for i in range(n))}] >>".encode(),
    ]
    content_streams: list[bytes] = []
    for page_lines in pages:
        commands = ["BT /F1 11 Tf 48 770 Td 14 TL", f"({escape(title[:90])}) Tj T*", "T*"]
        for line in page_lines:
            commands.append(f"({escape(line[:120])}) Tj T*")
        commands.append("ET")
        content_streams.append("\n".join(commands).encode("latin-1", "replace"))
    for i in range(n):
        content_id = 3 + n + i
        objects.append(
            (
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
                f"/Resources << /Font << /F1 {font_id} 0 R >> >> "
                f"/Contents {content_id} 0 R >>"
            ).encode()
        )
    for stream in content_streams:
        objects.append(f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream")
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

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
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--title", default="")
    args = parser.parse_args()
    body = Path(args.input).read_text(encoding="utf-8")
    first = body.splitlines()[0] if body else "Document"
    title = args.title or re.sub(r"^#\s+", "", first)
    Path(args.output).write_bytes(build_pdf(title, body))


if __name__ == "__main__":
    main()
