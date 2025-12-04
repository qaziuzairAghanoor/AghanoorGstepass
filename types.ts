export interface GatePassItem {
  id: string;
  orderNumber: string;
  workOrderNumber: string;
  description: string;
  orderQuantity: number;
  deliveredQuantity: number;
}

export interface GatePassData {
  id: string;
  passNumber: number; // The auto-incrementing number
  createdAt: string; // ISO Date string
  senderName: string;
  fromUnit: string; // "From which UNIT"
  receiverName?: string; // "To which Person/Name"
  targetUnit: string; // "To which UNIT the item transfer"
  items: GatePassItem[];
}

export interface GatePassContextType {
  passes: GatePassData[];
  nextPassNumber: number;
  addPass: (data: Omit<GatePassData, 'id' | 'passNumber' | 'createdAt'>) => void;
  deletePass: (id: string) => void;
}