
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
  requester_id: string;
  line: string;
  equipment_code?: string; // 설비코드 (Optional)
  item_id: string;
  item_name: string; 
  quantity: number;
  total_cost: number;
  timestamp: string; // Changed from number to string for timestamptz
  desired_delivery_date?: string;
}
