import pandas as pd
import os
import matplotlib.pyplot as plt
import numpy as np
import math



judete = {
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
    "MUNICIPIULBUCURESTI": "B"
}

# df = pd.read_csv("2024.csv")
# df.loc[df["Nota_finala_ro"] == "-", "Nota_finala_ro"] = df["Nota_ro"]
# df.loc[df["Nota_finala_mate"] == "-", "Nota_finala_mate"] = df["Nota_mate"]
# df.loc[df["Nota_finala_lm"] == "-", "Nota_finala_lm"] = df["Nota_lm"]

# print(f"Total elevi: {df.shape[0]}")
# absent_count = (df["Medie_en"] == "Absent").sum()
# print(f'Absenti: {absent_count}')

# df = df[df["Medie_en"] != "Absent"]



# # Ensure both columns are floats
# df["Nota_finala_ro"] = df["Nota_finala_ro"].astype(float)
# df["Nota_ro"] = df["Nota_ro"].astype(float)

# # Compute the absolute difference
# df["diff_ro"] = (df["Nota_finala_ro"] - df["Nota_ro"])

# # Find the row with the maximum difference
# max_diff_row = df.loc[df["diff_ro"].idxmin()]

# print(max_diff_row)

# # Ensure both columns are floats
# df["Nota_finala_mate"] = df["Nota_finala_mate"].astype(float)
# df["Nota_mate"] = df["Nota_mate"].astype(float)

# # Compute the absolute difference
# df["diff_mate"] = (df["Nota_finala_mate"] - df["Nota_mate"])

# # Find the row with the maximum difference
# max_diff_mate_row = df.loc[df["diff_mate"].idxmax()]

# print(max_diff_mate_row)




# df = pd.read_csv(r"C:\Users\radun\Desktop\Note-EN\public\2025.csv")


# # Replace '-' in final grade columns with the corresponding initial grade
# columns_to_fix = [
#     ("Nota_finala_ro", "Nota_ro"),
#     ("Nota_finala_mate", "Nota_mate"),
#     ("Nota_finala_lm", "Nota_lm")
# ]

# for final_col, initial_col in columns_to_fix:
#     df.loc[df[final_col] == "-", final_col] = df[initial_col]

# # Save back to CSV (optional)
# df.to_csv(r"C:\Users\radun\Desktop\Note-EN\csv\2025_updated.csv", index=False)



def xlsx_to_csv(input_path: str, output_path: str = None):
    """
    Converts an XLSX file to CSV.
    
    Parameters:
        input_path (str): Path to the input .xlsx file.
        output_path (str, optional): Path to save the output .csv file.
                                     If None, saves in the same location 
                                     with .csv extension.
    """
    if output_path is None:
        base, _ = os.path.splitext(input_path)
        output_path = base + ".csv"

    # Read and convert
    df = pd.read_excel(input_path)
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

    # --- Rename columns to match requested format ---
    rename_map = {
        "COD UNIC CANDIDAT": "Cod",
        "SEX": "Sex",
        "MEDIU": "Mediu",
        "STATUS LIMBA MATERNA": "Lb_mat",
        "NOTA ROMANA": "Nota_ro",
        "CONTESTATIE ROMANA": "Contestatie_ro",
        "NOTA FINALA ROMANA": "Nota_finala_ro",
        "NOTA MATEMATICA": "Nota_mate",
        "CONTESTATIE MATEMATICA": "Con_mate",
        "NOTA FINALA MATEMATICA": "Fin_mate",
        "NOTA LIMBA MATERNA": "Nota_lm",
        "CONTESTATIE LIMBA MATERNA": "Con_lm",
        "NOTA FINALA LB MATERNA": "Fin_lm",
        "MEDIA": "Medie_en",
        "MEDIA V-VIII": "Medie_5-8",
        "JUDET": "Judet"
    }
    df = df.rename(columns=rename_map)

    # Abreviere
    df["Judet"] = df["Judet"].apply(lambda x: judete[x.upper().replace("-", "").replace(" ", "")])

    # medie admitere:
    df["Admitere"] = df.apply(
        lambda row: (
            "-" if row["Medie_en"] == "-" or row["Medie_5-8"] == "-"
            else math.floor( round(float(row["Medie_en"]) * (1 - p) + float(row["Medie_5-8"]) * p, 10) * 100) / 100
        ),
        axis=1
    )
    


    # --- Select and rearrange columns in requested order ---
    final_columns = [
        "Cod", "Sex", "Mediu","Judet",
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



transform_exam_csv(r"csv\2022.csv", r"public\2022.csv", 0.2)