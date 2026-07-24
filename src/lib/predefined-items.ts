export type PredefinedItem = {
  description: string;
  rate: number;
  hsnCode: string;
};

export const PREDEFINED_ITEMS: PredefinedItem[] = [
  { description: "CT Scan Cover", rate: 4.28, hsnCode: "4817" },
  { description: "MRI Scan Cover", rate: 4.28, hsnCode: "4817" },
  { description: "Doctor,S Order", rate: 100, hsnCode: "" },
  { description: "X-Ray Cover Size - 21 x 15 inches", rate: 15, hsnCode: "" },
  { description: "Discharge Summary Folder", rate: 9.5, hsnCode: "" },
];
