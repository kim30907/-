export interface ConsumableItem {
  id: string; // 품번
  supplier: string; // 업체명
  name: string; // 품명
  specification: string; // 규격
  unit: string; // 단위
  price: number; // 단가
}

export interface RequestLog {
  id: string; 
  requesterId: string;
  line: string;
  itemId: string;
  itemName: string; 
  quantity: number;
  totalCost: number;
  timestamp: number;
  desiredDeliveryDate?: string;
}
