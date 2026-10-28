import argparse
import math
import re
import unicodedata
from pathlib import Path

import pandas as pd


COUNTY_NAME_TO_ABBR = {
    "ALBA": "AB",
    "ARAD": "AR",
    "ARGES": "AG",
    "BACAU": "BC",
    "BIHOR": "BH",
    "BISTRITA NASAUD": "BN",
    "BOTOSANI": "BT",
    "BRAILA": "BR",
    "BRASOV": "BV",
    "BUZAU": "BZ",
    "BUCURESTI": "B",
    "MUNICIPIUL BUCURESTI": "B",
    "CALARASI": "CL",
    "CARAS SEVERIN": "CS",
    "CLUJ": "CJ",
    "CONSTANTA": "CT",
    "COVASNA": "CV",
    "DAMBOVITA": "DB",
    "DOLJ": "DJ",
    "GALATI": "GL",
    "GIURGIU": "GR",
    "GORJ": "GJ",
    "HARGHITA": "HR",
    "HUNEDOARA": "HD",
    "IALOMITA": "IL",
    "IASI": "IS",
    "ILFOV": "IF",
    "MARAMURES": "MM",
    "MEHEDINTI": "MH",
    "MURES": "MS",
    "NEAMT": "NT",
    "OLT": "OT",
    "PRAHOVA": "PH",
    "SALAJ": "SJ",
    "SATU MARE": "SM",
    "SIBIU": "SB",
    "SUCEAVA": "SV",
    "TELEORMAN": "TR",
    "TIMIS": "TM",
    "TULCEA": "TL",
    "VALCEA": "VL",
    "VASLUI": "VS",
    "VRANCEA": "VN",
}

OUTPUT_COLUMNS = [
    "Cod",
    "Sex",
    "Mediu",
    "Judet",
    "SIIIR",
    "Nota_ro",
    "Con_ro",
    "Fin_ro",
    "Nota_mate",
    "Con_mate",
    "Fin_mate",
    "Lb_mat",
    "Nota_lm",
    "Fin_lm",
    "Medie_en",
    "Medie_5-8",
    "Admitere",
]

SOURCE_COLUMNS = {
    "COD UNIC CANDIDAT": "Cod",
    "SEX": "Sex",
    "MEDIU": "Mediu",
    "NOTA ROMANA": "Nota_ro",
    "NOTA CONTESTATIE ROMANA": "Con_ro",
    "NOTA FINALA ROMANA": "Fin_ro",
    "NOTA MATEMATICA": "Nota_mate",
    "NOTA CONTESTATIE MATEMATICA": "Con_mate",
    "NOTA FINALA MATEMATICA": "Fin_mate",
    "NOTA LIMBA MATERNA": "Nota_lm",
    "NOTA FINALA LB MATERNA": "Fin_lm",
    "MEDIA": "Medie_en",
    "MEDIA V-VIII": "Medie_5-8",
}


def normalize_county_name(name: str) -> str:
    romanian_characters = str.maketrans(
        {
            "Ă": "A",
            "Â": "A",
            "Î": "I",
            "Ș": "S",
            "Ş": "S",
            "Ț": "T",
            "Ţ": "T",
        }
    )
    name = name.upper().translate(romanian_characters)
    without_diacritics = "".join(
        character
        for character in unicodedata.normalize("NFKD", name)
        if not unicodedata.combining(character)
    )
    return re.sub(r"[^A-Z ]", " ", without_diacritics).strip()


def school_code_candidates(code: str) -> list[str]:
    candidates = [code]
    without_leading_zeroes = code.lstrip("0")
    if without_leading_zeroes and without_leading_zeroes not in candidates:
        candidates.append(without_leading_zeroes)

    if without_leading_zeroes.isdigit():
        number = int(without_leading_zeroes)
        for adjusted in (number - 1_000_000, number + 1_000_000):
            candidate = str(adjusted)
            if adjusted > 0 and candidate not in candidates:
                candidates.append(candidate)

    return candidates


def build_school_lookup(schools_path: Path) -> dict[str, str]:
    schools = pd.read_csv(schools_path, dtype=str, keep_default_na=False)
    lookup = {}
    for row in schools.itertuples(index=False):
        school_code = str(getattr(row, "Cod")).strip()
        county_name = normalize_county_name(str(getattr(row, "Judet")))
        county = COUNTY_NAME_TO_ABBR.get(county_name)
        if school_code and county:
            lookup[school_code] = county
    if not lookup:
        raise ValueError(f"No usable school/county records found in {schools_path}")
    return lookup


def convert_workbook(input_path: Path, output_path: Path, schools_path: Path) -> None:
    source = pd.read_excel(input_path, dtype=str)
    source.columns = source.columns.str.strip()
    required_source_columns = set(SOURCE_COLUMNS) | {
        "COD SIIIR",
        "STATUS LIMBA MATERNA",
    }
    missing_columns = required_source_columns - set(source.columns)
    if missing_columns:
        raise ValueError(f"Workbook is missing columns: {', '.join(sorted(missing_columns))}")

    for column in source.columns:
        source[column] = source[column].map(lambda value: value.strip() if isinstance(value, str) else "")

    school_lookup = build_school_lookup(schools_path)
    county_by_prefix: dict[str, set[str]] = {}
    school_code_by_source: dict[str, str] = {}
    county_by_source: dict[str, str] = {}

    for raw_code in source["COD SIIIR"].drop_duplicates():
        if not raw_code:
            raise ValueError("Workbook contains a record without a SIIIR school code")

        matched_codes = [candidate for candidate in school_code_candidates(raw_code) if candidate in school_lookup]
        matched_counties = {school_lookup[candidate] for candidate in matched_codes}
        if len(matched_counties) > 1:
            raise ValueError(f"School code {raw_code} resolves to multiple counties")

        if matched_codes:
            county = matched_counties.pop()
            school_code_by_source[raw_code] = matched_codes[0]
            county_by_source[raw_code] = county
            county_by_prefix.setdefault(raw_code[:2], set()).add(county)

    conflicting_prefixes = {
        prefix: counties for prefix, counties in county_by_prefix.items() if len(counties) != 1
    }
    if conflicting_prefixes:
        raise ValueError(f"School-code county prefixes are ambiguous: {conflicting_prefixes}")

    resolved_counties = {}
    for raw_code in source["COD SIIIR"].drop_duplicates():
        county = county_by_source.get(raw_code)
        if county is None:
            prefix_counties = county_by_prefix.get(raw_code[:2], set())
            if len(prefix_counties) != 1:
                raise ValueError(f"Cannot determine county for school code {raw_code}")
            county = next(iter(prefix_counties))
            school_code_by_source[raw_code] = raw_code
        resolved_counties[raw_code] = county

    output = pd.DataFrame(index=source.index)
    for source_column, output_column in SOURCE_COLUMNS.items():
        output[output_column] = source[source_column].replace("", "-")

    output["Judet"] = source["COD SIIIR"].map(resolved_counties)
    output["SIIIR"] = source["COD SIIIR"].map(school_code_by_source)
    output["Lb_mat"] = source["STATUS LIMBA MATERNA"].map(
        lambda status: "DA" if status in {"PREZENT", "ABSENT"} else "-"
    )
    output["Admitere"] = output["Medie_en"]
    output = output[OUTPUT_COLUMNS]

    if output["Cod"].eq("-").any() or output["Cod"].duplicated().any():
        raise ValueError("Candidate codes must be present and unique")
    if set(output["Sex"]) - {"F", "M"} or set(output["Mediu"]) - {"RURAL", "URBAN"}:
        raise ValueError("Workbook contains unknown sex or environment values")
    if set(output["Judet"]) - set(COUNTY_NAME_TO_ABBR.values()):
        raise ValueError("Workbook contains an unknown county")

    grade_columns = [
        "Nota_ro",
        "Con_ro",
        "Fin_ro",
        "Nota_mate",
        "Con_mate",
        "Fin_mate",
        "Nota_lm",
        "Fin_lm",
        "Medie_en",
        "Medie_5-8",
        "Admitere",
    ]
    for column in grade_columns:
        values = output[column]
        numeric = pd.to_numeric(values.where(values != "-", "0"), errors="coerce")
        if numeric.isna().any() or ((numeric < 0) | (numeric > 10)).any():
            raise ValueError(f"Column {column} contains invalid grades")

    average_rows = output[
        (output["Fin_ro"] != "-")
        & (output["Fin_mate"] != "-")
        & (output["Medie_en"] != "-")
    ]
    for row in average_rows.itertuples(index=False):
        final_ro = getattr(row, "Fin_ro")
        final_math = getattr(row, "Fin_mate")
        final_native = getattr(row, "Fin_lm")
        grades = [float(final_ro), float(final_math)]
        if row.Lb_mat == "DA" and final_native != "-":
            grades.append(float(final_native))
        expected_average = math.floor(sum(grades) * 100 / len(grades) + 1e-9) / 100
        if abs(float(row.Medie_en) - expected_average) > 0.000001:
            raise ValueError(f"Exam average mismatch for candidate {row.Cod}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.to_csv(output_path, index=False, lineterminator="\n")
    print(
        f"Converted {len(output):,} records to {output_path}; "
        f"{output['Judet'].nunique()} counties; "
        f"{len(average_rows):,} exam averages validated."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert the official exam workbook to the website CSV schema.")
    parser.add_argument("year", nargs="?", default="2026", help="Exam year (default: 2026)")
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parent.parent
    public_directory = project_root / "public"
    convert_workbook(
        public_directory / f"{args.year}.xlsx",
        public_directory / f"{args.year}.csv",
        public_directory / "scoli.csv",
    )


if __name__ == "__main__":
    main()
