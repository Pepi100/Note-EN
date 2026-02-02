import pandas as pd
import os
import matplotlib.pyplot as plt
import numpy as np
import math
import unicodedata
import pdfplumber

def append_a_to_b(path_a: str, path_b: str, output_path: str):
    # Load CSVs
    df_a = pd.read_csv(path_a)
    df_b = pd.read_csv(path_b)

    existing_cod = set(df_b['Cod'].astype(str))  # existing CODs in B as strings
    max_nr = df_b['Nr'].max()
    if pd.isna(max_nr):
        max_nr = 0
    next_nr = max_nr + 1

    new_rows = []

    for _, row in df_a.iterrows():
        cod = str(row["Cod SIIIR"])
        if cod not in existing_cod:
            new_row = {
                "Nr": next_nr,
                "Cod": cod,
                "Denumire": row["Denumire"],
                "Denumire scurta": row["Denumire scurtă"],
                "Localitate": row["Localitate"],
                "Localitate superioara": row["Localitate superioară"],
                "Judet": row["Judet"],
                "Statut": row["Statut"],
                "Tip unitate": row["Tip unitate"],
                "Forma de proprietate": row["Formă de proprietate"]
            }
            new_rows.append(new_row)
            existing_cod.add(cod)  # prevent duplicates in the same run
            next_nr += 1

    df_new = pd.DataFrame(new_rows)
    df_result = pd.concat([df_b, df_new], ignore_index=True)

    df_result.to_csv(output_path, index=False)
    print(f"Appended {len(new_rows)} unique rows from A to B and saved to {output_path}")






def remove_diacritics(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


judete_long_short = {
    "ALBA": "AB",
    "ARAD": "AR",
    "ARGES": "AG",
    "BACAU": "BC",
    "BIHOR": "BH",
    "BISTRITANASAUD": "BN",
    "BOTOSANI": "BT",
    "BRAILA": "BR",
    "BRASOV": "BV",
    "BUZAU": "BZ",
    "CALARASI": "CL",
    "CARASSEVERIN": "CS",
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
    "SATUMARE": "SM",
    "SIBIU": "SB",
    "SUCEAVA": "SV",
    "TELEORMAN": "TR",
    "TIMIS": "TM",
    "TULCEA": "TL",
    "VALCEA": "VL",
    "VASLUI": "VS",
    "VRANCEA": "VN",
    "BUCURESTI": "B",
    "MUNICIPIULBUCURESTI": "B",
    "X":"X"
}


judete_short_long = {
    "AB": "ALBA",
    "AR": "ARAD",
    "AG": "ARGES",
    "BC": "BACAU",
    "BH": "BIHOR",
    "BN": "BISTRITA NASAUD",
    "BT": "BOTOSANI",
    "BR": "BRAILA",
    "BV": "BRASOV",
    "BZ": "BUZAU",
    "CL": "CALARASI",
    "CS": "CARAS SEVERIN",
    "CJ": "CLUJ",
    "CT": "CONSTANTA",
    "CV": "COVASNA",
    "DB": "DAMBOVITA",
    "DJ": "DOLJ",
    "GL": "GALATI",
    "GR": "GIURGIU",
    "GJ": "GORJ",
    "HR": "HARGHITA",
    "HD": "HUNEDOARA",
    "IL": "IALOMITA",
    "IS": "IASI",
    "IF": "ILFOV",
    "MM": "MARAMURES",
    "MH": "MEHEDINTI",
    "MS": "MURES",
    "NT": "NEAMT",
    "OT": "OLT",
    "PH": "PRAHOVA",
    "SJ": "SALAJ",
    "SM": "SATU MARE",
    "SB": "SIBIU",
    "SV": "SUCEAVA",
    "TR": "TELEORMAN",
    "TM": "TIMIS",
    "TL": "TULCEA",
    "VL": "VALCEA",
    "VS": "VASLUI",
    "VN": "VRANCEA",
    "B": "BUCURESTI",
    "X":"X"
}

# SIIR
siir_DF = pd.read_csv(r"csv\scoli.csv")
unknown = []

def SIIR_to_judet(code):
    global unknown

    if code in unknown:
        return "X"

    try:
        row = siir_DF[siir_DF["Cod"] == code].iloc[0]
    except Exception as e:
        try:
            val = int(str(code)[3:])
            dg = int(str(code)[4])
            if dg == 2:
               row = siir_DF[siir_DF["Cod"] == code - 1000000].iloc[0]
            else:
                row = siir_DF[siir_DF["Cod"] == code + 1000000].iloc[0]
        except Exception as e:
            print(f"Codul {code} nu a fost gasit!")
            unknown += [code]
            return "X"

    return remove_diacritics(row["Judet"])


def xlsx_to_csv(input_path: str, output_path: str = None):

    if output_path is None:
        base, _ = os.path.splitext(input_path)
        output_path = base + ".csv"

    # Read and convert
    df = pd.read_excel(input_path)
    print("Read Excel")
    df.columns = df.columns.str.strip()

    df.to_csv(output_path, index=False)
    print(f"Converted: {input_path} -> {output_path}")



def clean_csv(input_path: str, output_path: str = None):
    """
    Replaces all 'NU' or empty values in a CSV file with '-'.

    Parameters:
        input_path (str): Path to the input CSV file.
        output_path (str, optional): Path to save the cleaned CSV file.
                                     If None, it overwrites the original file.
    """
    # If no output path is given, overwrite the input file
    if output_path is None:
        output_path = input_path

    # Load the CSV
    df = pd.read_csv(input_path)

    # Replace "NU" and empty values (NaN or "")
    df = df.replace(["NU", ""], "-")
    df = df.fillna("-")  # Handle NaN values

    # Save the cleaned CSV
    df.to_csv(output_path, index=False)
    print(f"Cleaned CSV saved to: {output_path}")




def transform_exam_csv(input_path: str, output_path: str = None, p: float = 0):
    """
    Transforms the CSV of exam results into the requested format.
    - Keeps COD UNIC CANDIDAT, SEX, MEDIU, COD SIIIR as extra columns.
    - Renames and rearranges columns to requested order.
    - Removes unwanted columns.
    - Calculates 'Medie_en' (average of final grades).
    - Renames 'MEDIA' to 'medie-finala'.
    """
    if output_path is None:
        output_path = input_path  # overwrite by default

    # Load CSV
    df = pd.read_csv(input_path)
    df.columns = df.columns.str.strip()

    # check judet
    if "JUDET" not in df.columns:
        df["JUDET"] = df.apply(lambda row: SIIR_to_judet(row["COD SIIIR"]), axis=1)

    # --- Rename columns to match requested format ---
    rename_map = {
        "COD UNIC CANDIDAT": "Cod",
        "SEX": "Sex",
        "MEDIU": "Mediu",
        "STATUS LIMBA MATERNA": "Lb_mat",

        "NOTA ROMANA": "Nota_ro",
        "NOTA CONTESTATIE ROMANA": "Con_ro",
        "NOTA FINALA ROMANA": "Fin_ro",

        "NOTA MATEMATICA": "Nota_mate",
        "NOTA CONTESTATIE MATEMATICA": "Con_mate",
        "NOTA FINALA MATEMATICA": "Fin_mate",

        "NOTA LIMBA MATERNA": "Nota_lm",
        "NOTA CONTESTATIE LIMBA MATERNA": "Con_lm",
        "NOTA FINALA LB MATERNA": "Fin_lm",

        "MEDIA": "Medie_en",
        "MEDIA V-VIII": "Medie_5-8",
        "JUDET": "Judet",
        "COD SIIIR":"SIIIR"
    }
    df = df.rename(columns=rename_map)

    # fix lb mat
    df["Lb_mat"] = df["Lb_mat"].apply(lambda x: "DA" if x == "ABSENT" or x == "PREZENT" else "-" )

    # Abreviere
    df["Judet"] = df["Judet"].apply(lambda x: judete_long_short[x.upper().replace("-", "").replace(" ", "")])

    # medie admitere:
    def calculate_admitere(row, p):
        try:
            if row["Medie_en"] == "-" or row["Medie_5-8"] == "-":
                return "-"
            return math.floor(
                round(float(row["Medie_en"]) * (1 - p) + float(row["Medie_5-8"]) * p, 10) * 100
            ) / 100
        except Exception as e:
            print("Error row:", row)
            return "-"

    df["Admitere"] = df.apply(lambda row: calculate_admitere(row, p), axis=1)
    


    # --- Select and rearrange columns in requested order ---
    final_columns = [
        "Cod", "Sex", "Mediu","Judet","SIIIR",
        "Nota_ro", "Con_ro", "Fin_ro",
        "Nota_mate", "Con_mate", "Fin_mate",
        "Lb_mat", "Nota_lm", "Con_lm", "Fin_lm",
        "Medie_en", "Medie_5-8", "Admitere"
    ]

    # Remove duplicates in case some appear twice
    final_columns = [col for col in final_columns if col in df.columns]

    df = df[final_columns]

    # --- Save transformed CSV ---
    df.to_csv(output_path, index=False)
    print(f"Transformed CSV saved to: {output_path}")


def fix_coduri():
    siir_DF = pd.read_csv(r"csv\CODURI SIIIR.csv")
    siir_DF["Judet"] = siir_DF["Judet"].apply(lambda x: x if len(x) > 2 else judete_short_long[x])
    siir_DF.to_csv(r"csv\CODURI SIIIR.csv", index=False)

# fix_coduri()
# append_a_to_b(r"csv\datedeschise-retea-2019-2020.csv", r"csv\CODURI SIIIR.csv", r"csv\CODURI SIIIR.csv")






def xlsx_to_final(year, p):
    xlsx_to_csv(f"csv\{year}.xlsx",f"csv\{year}.csv")
    clean_csv(f"csv\{year}.csv")
    transform_exam_csv(f"csv\{year}.csv", f"public\{year}.csv", p)
    print(unknown)
    print(len(unknown))
    print(f"Finished year {year}!")




year = 2025
# xlsx_to_csv(f"csv\{year}.xlsx",f"csv\{year}.csv")
# clean_csv(f"csv\{year}.csv")
transform_exam_csv(f"csv\{year}.csv", f"public\{year}.csv", 0)

# print(unknown)
# print(len(unknown))
# print(f"Finished year {year}!")

# xlsx_to_final(2022,0.2)
# xlsx_to_final(2023,0)
# xlsx_to_final(2024,0)


import re

def transform_csv(input_path, output_path):
    df = pd.read_csv(input_path)

    # Apply transformations
    df_out = pd.DataFrame()
    df_out['Cod'] = df['ID_candidat'].apply(lambda x: re.sub(r'\D', '', x))
    df_out['Sex'] = 'M'
    df_out['Mediu'] = 'RURAL'
    df_out['Judet'] = df['Judet']
    df_out['SIIIR'] = '1061105062'

    df_out['Nota_ro'] = df['Nota_ro']
    df_out['Con_ro'] = df['Contestatie_ro']
    df_out['Fin_ro'] = df['Nota_finala_ro']
    df_out['Nota_mate'] = df['Nota_mate']
    df_out['Con_mate'] = df['Contestatie_mate']
    df_out['Fin_mate'] = df['Nota_finala_mate']
    df_out['Lb_mat'] = df['Limba_materna']
    df_out['Nota_lm'] = df['Nota_lm']
    df_out['Fin_lm'] = df['Nota_finala_lm']
    df_out['Medie_en'] = df['Medie_en']

    df_out['Medie_5-8'] = '-'
    df_out['Admitere'] = df['Medie_en']

    # Save to CSV
    df_out.to_csv(output_path, index=False)

# # Usage:
# year = 2025
# transform_csv(f"csv\{year}.csv", f"public\{year}.csv")