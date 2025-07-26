import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

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




df = pd.read_csv(r"C:\Users\radun\Desktop\Note-EN\public\2025.csv")


# Replace '-' in final grade columns with the corresponding initial grade
columns_to_fix = [
    ("Nota_finala_ro", "Nota_ro"),
    ("Nota_finala_mate", "Nota_mate"),
    ("Nota_finala_lm", "Nota_lm")
]

for final_col, initial_col in columns_to_fix:
    df.loc[df[final_col] == "-", final_col] = df[initial_col]

# Save back to CSV (optional)
df.to_csv(r"C:\Users\radun\Desktop\Note-EN\csv\2025_updated.csv", index=False)

