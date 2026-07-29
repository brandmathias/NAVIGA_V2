from pathlib import Path
import sys

from rapid_doc import RapidDoc


def create_engine() -> RapidDoc:
    return RapidDoc(
        formula_enable=False,
        table_enable=True,
        lang="en",
        pdf_pages_batch=1,
    )


def main() -> None:
    if len(sys.argv) == 2 and sys.argv[1] == "--warmup":
        create_engine().warmup()
        print("RapidDoc siap.")
        return

    if len(sys.argv) != 3:
        raise SystemExit("Gunakan: rapid-doc-extract.py <input.pdf> <output.md>")

    input_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    outputs = create_engine()([input_path], output_dir=output_path.parent)
    if not outputs or not getattr(outputs[0], "markdown", "").strip():
        raise RuntimeError("RapidDoc tidak menghasilkan Markdown OCR.")

    output_path.write_text(outputs[0].markdown, encoding="utf-8")


if __name__ == "__main__":
    main()
