import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes conditionally */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function removeRomanianDiacritics(str: string): string {
  const map: Record<string, string> = {
    'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ş': 's', 'ț': 't', 'ţ': 't',
    'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ş': 'S', 'Ț': 'T', 'Ţ': 'T'
  };

  return str.replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, char => map[char] || char);
}


export const COUNTY_NAME_TO_ABBR: Record<string, string> = {
  "ALBA": "AB",
  "ARAD": "AR",
  "ARGES": "AG",
  "BACAU": "BC",
  "BIHOR": "BH",
  "BISTRITA-NASAUD": "BN",
  "BOTOSANI": "BT",
  "BRAILA": "BR",
  "BRASOV": "BV",
  "BUZAU": "BZ",
  "MUNICIPIUL BUCURESTI": "B",
  "BUCURESTI": "B",
  "CALARASI": "CL",
  "CARAS-SEVERIN": "CS",
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
};
