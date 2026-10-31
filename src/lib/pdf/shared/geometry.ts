const PT_PER_MM = 2.83465; // 1 mm = 2.83465 pt

export const mmToPt = (mm: number) => mm * PT_PER_MM;
export const ptToMM = (pt: number) => pt / PT_PER_MM;
