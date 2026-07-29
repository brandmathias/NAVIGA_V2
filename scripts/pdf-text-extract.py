from pathlib import Path
import sys

from pypdf import PdfReader


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Gunakan: pdf-text-extract.py <input.pdf> <output.txt>")

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    reader = PdfReader(input_path, strict=False)
    pages = [page.extract_text(extraction_mode="layout") or "" for page in reader.pages]
    output_path.write_text("\n\f\n".join(pages), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
