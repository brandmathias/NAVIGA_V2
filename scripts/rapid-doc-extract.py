from html import escape
from pathlib import Path
import sys


def create_engine():
    from rapid_doc import RapidDoc

    return RapidDoc(
        formula_enable=False,
        table_enable=True,
        lang="en",
        pdf_pages_batch=1,
    )


GADAI_HEADERS = [
    "No.", "No. SBG", "Rubrik", "Nasabah", "Telp/HP.", "Tgl Kredit Tgl Jatuh Tempo",
    "Barang Jaminan", "Taksiran", "Uang Pinjaman", "SM",
]
GADAI_COLUMN_EDGES = (0.0325, 0.139, 0.198, 0.32, 0.417, 0.501, 0.771, 0.848, 0.952)
INSTALLMENT_HEADERS = [
    "Nasabah", "Produk", "Pinjaman", "OSL", "KOL", "HR TUNG", "Tenor",
    "Angsuran", "Kewajiban", "Pencairan", "Kunjungan Terakhir",
]
INSTALLMENT_COLUMN_STARTS = (0, 0.259, 0.518, 0.585, 0.65, 0.68, 0.72, 0.755, 0.805, 0.87, 1)


def normalize_label(value: str) -> str:
    return "".join(character for character in str(value).lower() if character.isalnum())


def gadai_header_column(text: str):
    normalized = normalize_label(text)
    if normalized == "no":
        return 0
    if "nosbg" in normalized:
        return 1
    if normalized == "rubrik":
        return 2
    if normalized == "nasabah":
        return 3
    if "telphp" in normalized:
        return 4
    if normalized.startswith("tglkredit") or "tgljatuhtempo" in normalized:
        return 5
    if "barangjaminan" in normalized:
        return 6
    if normalized == "taksiran":
        return 7
    if "uangpinjaman" in normalized:
        return 8
    if normalized == "sm":
        return 9
    return None


def gadai_header_anchors(boxes, texts):
    anchors = {}
    for box, text in zip(boxes, texts):
        column = gadai_header_column(text)
        if column is None:
            continue
        center_x = sum(point[0] for point in box) / len(box)
        anchors.setdefault(column, []).append(center_x)
    return {column: sum(values) / len(values) for column, values in anchors.items()}


def gadai_column(box, image_width: float, anchors, text: str = "") -> int:
    center_x_pixels = sum(point[0] for point in box) / len(box)
    if len(anchors) >= 6:
        if 1 in anchors and str(text).strip().isdigit() and len(str(text).strip()) <= 3 and center_x_pixels < anchors[1]:
            return 0
        return min(anchors, key=lambda column: abs(anchors[column] - center_x_pixels))

    center_x = center_x_pixels / image_width
    for index, edge in enumerate(GADAI_COLUMN_EDGES):
        if center_x < edge:
            return index
    return len(GADAI_HEADERS) - 1


def group_ocr_lines(boxes, texts, image_height: float):
    entries = []
    for box, text in zip(boxes, texts):
        value = str(text).strip()
        if not value:
            continue
        entries.append((min(point[1] for point in box), min(point[0] for point in box), box, value))

    tolerance = max(4, image_height * 0.008)
    lines = []
    for top, left, box, text in sorted(entries):
        if not lines or top - lines[-1][0] > tolerance:
            lines.append([top, []])
        lines[-1][1].append((left, box, text))
    return lines


def to_gadai_table(input_path: Path) -> str:
    from rapidocr import RapidOCR

    result = RapidOCR()(input_path)
    boxes = result.boxes if result.boxes is not None else []
    texts = result.txts if result.txts is not None else []
    image_shape = getattr(getattr(result, "img", None), "shape", (0, 0))
    image_height, image_width = image_shape[:2]
    if not image_width:
        image_width = max((point[0] for box in boxes for point in box), default=1)
    if not image_height:
        image_height = max((point[1] for box in boxes for point in box), default=1)
    anchors = gadai_header_anchors(boxes, texts)
    lines = group_ocr_lines(boxes, texts, image_height)

    rows = []
    started = False
    for _, entries in lines:
        cells = ["" for _ in GADAI_HEADERS]
        for _, box, text in entries:
            column = gadai_column(box, image_width, anchors, text)
            cells[column] = " ".join(part for part in (cells[column], text) if part)
        if not started:
            started = len("".join(cells[1]).replace(" ", "")) >= 10
        if started:
            rows.append(cells)

    if not rows:
        raise RuntimeError("OCR foto tidak menemukan baris gadai.")

    html_rows = ["<tr>" + "".join(f"<td>{escape(cell)}</td>" for cell in row) + "</tr>" for row in rows]
    header = "<tr>" + "".join(f"<td>{header}</td>" for header in GADAI_HEADERS) + "</tr>"
    return "<table>" + header + "".join(html_rows) + "</table>"


def installment_table_bounds(boxes, texts, image_width: float):
    left = None
    right = None
    header_top = None
    for box, text in zip(boxes, texts):
        normalized = normalize_label(text)
        if normalized == "nasabah":
            left = min(point[0] for point in box)
            header_top = min(point[1] for point in box)
        elif "kunjunganterakhir" in normalized:
            right = min(point[0] for point in box)
    if left is None or right is None or right <= left:
        return 0, image_width, -1
    return left, right, header_top


def installment_column(box, left: float, right: float) -> int:
    position = (min(point[0] for point in box) - left) / max(right - left, 1)
    return min(range(len(INSTALLMENT_COLUMN_STARTS)), key=lambda index: abs(INSTALLMENT_COLUMN_STARTS[index] - position))


def add_installment_cell(cells, column: int, text: str):
    import re

    combined_tenor = re.fullmatch(r"(\d+)\s+(\d+\s*/\s*\d+)", text)
    if combined_tenor:
        cells[5] = combined_tenor.group(1)
        cells[6] = combined_tenor.group(2).replace(" ", "")
        return

    combined_unit = re.fullmatch(r"([\d.,]+)\s+(\d{5}\s*-\s*UPC.*)", text, re.IGNORECASE)
    if combined_unit:
        cells[8] = combined_unit.group(1)
        cells[9] = combined_unit.group(2)
        return

    cells[column] = " ".join(part for part in (cells[column], text) if part)


def to_installment_table(input_path: Path) -> str:
    from rapidocr import RapidOCR

    result = RapidOCR()(input_path)
    boxes = result.boxes if result.boxes is not None else []
    texts = result.txts if result.txts is not None else []
    image_shape = getattr(getattr(result, "img", None), "shape", (0, 0))
    image_height, image_width = image_shape[:2]
    if not image_width:
        image_width = max((point[0] for box in boxes for point in box), default=1)
    if not image_height:
        image_height = max((point[1] for box in boxes for point in box), default=1)

    left, right, header_top = installment_table_bounds(boxes, texts, image_width)
    rows = []
    for top, entries in group_ocr_lines(boxes, texts, image_height):
        if top <= header_top:
            continue
        cells = ["" for _ in INSTALLMENT_HEADERS]
        for _, box, text in entries:
            if min(point[0] for point in box) < left:
                continue
            add_installment_cell(cells, installment_column(box, left, right), text)
        if cells[0] and cells[1] and cells[9]:
            rows.append(cells)

    if not rows:
        raise RuntimeError("OCR foto tidak menemukan baris angsuran.")

    def markdown_row(cells):
        return "| " + " | ".join(str(cell).replace("|", "\\|") for cell in cells) + " |"

    separator = ["---" for _ in INSTALLMENT_HEADERS]
    return "\n".join([markdown_row(INSTALLMENT_HEADERS), markdown_row(separator), *(markdown_row(row) for row in rows)])


def main() -> None:
    if len(sys.argv) == 2 and sys.argv[1] == "--warmup":
        create_engine().warmup()
        print("RapidDoc siap.")
        return

    arguments = sys.argv[1:]
    gadai_table = arguments[:1] == ["--gadai-table"]
    installment_table = arguments[:1] == ["--installment-table"]
    if gadai_table or installment_table:
        arguments = arguments[1:]

    if len(arguments) != 2:
        raise SystemExit("Gunakan: rapid-doc-extract.py [--gadai-table|--installment-table] <input-file> <output.md>")

    input_path = Path(arguments[0]).resolve()
    output_path = Path(arguments[1]).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if gadai_table:
        output_path.write_text(to_gadai_table(input_path), encoding="utf-8")
        return
    if installment_table:
        output_path.write_text(to_installment_table(input_path), encoding="utf-8")
        return

    outputs = create_engine()([input_path], output_dir=output_path.parent)
    if not outputs or not getattr(outputs[0], "markdown", "").strip():
        raise RuntimeError("RapidDoc tidak menghasilkan Markdown OCR.")

    output_path.write_text(outputs[0].markdown, encoding="utf-8")


if __name__ == "__main__":
    main()
