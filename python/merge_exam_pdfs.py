import argparse
import os
import re
import shutil
from pathlib import Path
from tempfile import mkstemp

from pypdf import PdfReader, PdfWriter


EXAM_FILENAME = re.compile(r"^(?P<base>.+)_(?P<year>\d{4})(?P<barem>_Barem)?$")
MERGED_MARKER = "/NoteENExamBaremMerged"


def merge_exam_pdfs(input_dir: Path, output_dir: Path) -> int:
    input_dir = input_dir.resolve()
    output_dir = output_dir.resolve()
    if not input_dir.is_dir():
        raise FileNotFoundError(f"Input directory does not exist: {input_dir}")

    pdf_paths = sorted(input_dir.rglob("*.pdf"), key=lambda path: str(path).casefold())
    exam_pairs: list[tuple[Path, Path]] = []
    unmatched: list[Path] = []

    for path in pdf_paths:
        match = EXAM_FILENAME.fullmatch(path.stem)
        if match is None:
            unmatched.append(path)
            continue

        exam_stem = f"{match.group('base')}_{match.group('year')}"
        exam_path = path.with_name(f"{exam_stem}.pdf")
        barem_path = path.with_name(f"{exam_stem}_Barem.pdf")
        if match.group("barem"):
            if exam_path.is_file():
                exam_pairs.append((exam_path, barem_path))
            else:
                unmatched.append(path)
        elif barem_path.is_file():
            exam_pairs.append((exam_path, barem_path))
        else:
            exam_metadata = PdfReader(exam_path).metadata
            if not exam_metadata or exam_metadata.get(MERGED_MARKER) != "true":
                unmatched.append(path)

    if unmatched:
        paths = "\n".join(f"  - {path}" for path in unmatched)
        raise ValueError(f"Could not find a matching exam/Barem PDF for:\n{paths}")
    if not exam_pairs:
        print(f"No exam/Barem PDF pairs found in {input_dir}.")
        return 0

    unique_pairs = sorted(
        set(exam_pairs),
        key=lambda pair: str(pair[0]).casefold(),
    )
    merged_count = 0
    for exam_path, barem_path in unique_pairs:
        relative_directory = exam_path.parent.relative_to(input_dir)
        destination = output_dir / relative_directory / exam_path.name
        destination.parent.mkdir(parents=True, exist_ok=True)

        destination_metadata = (
            PdfReader(destination).metadata if destination.is_file() else None
        )
        if destination_metadata and destination_metadata.get(MERGED_MARKER) == "true":
            barem_path.unlink()
            print(f"Already combined; deleted {barem_path}")
            continue

        exam_metadata = PdfReader(exam_path).metadata
        if exam_metadata and exam_metadata.get(MERGED_MARKER) == "true":
            if destination.resolve() != exam_path.resolve():
                file_descriptor, temporary_name = mkstemp(
                    dir=destination.parent,
                    prefix=f".{destination.stem}.",
                    suffix=".tmp.pdf",
                )
                os.close(file_descriptor)
                temporary_path = Path(temporary_name)
                try:
                    shutil.copyfile(exam_path, temporary_path)
                    os.replace(temporary_path, destination)
                finally:
                    temporary_path.unlink(missing_ok=True)
            barem_path.unlink()
            print(f"Already combined: {destination}")
            continue

        file_descriptor, temporary_name = mkstemp(
            dir=destination.parent,
            prefix=f".{destination.stem}.",
            suffix=".tmp.pdf",
        )
        os.close(file_descriptor)
        temporary_path = Path(temporary_name)
        try:
            with PdfWriter() as writer:
                writer.append(str(exam_path))
                writer.append(str(barem_path))
                writer.add_metadata({MERGED_MARKER: "true"})
                with temporary_path.open("wb") as output_file:
                    writer.write(output_file)
            os.replace(temporary_path, destination)
        finally:
            temporary_path.unlink(missing_ok=True)

        print(f"Replaced {destination}")
        barem_path.unlink()
        print(f"Deleted {barem_path}")
        merged_count += 1

    return merged_count


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(
        description="Combine each exam PDF with its matching Barem PDF."
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=project_root / "public" / "teste" / "evaluare",
        help="Directory to search for exam and Barem PDFs.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=project_root / "public" / "teste" / "evaluare",
        help="Directory where combined PDFs will be written (defaults to replacing exam PDFs).",
    )
    args = parser.parse_args()

    count = merge_exam_pdfs(args.input_dir, args.output_dir)
    print(f"Created {count} combined PDFs.")


if __name__ == "__main__":
    main()
