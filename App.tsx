import React, { useState, useCallback, useEffect } from 'react';
import type { ConsumableItem, RequestLog } from './types';
import Header from './components/Header';
import RequestForm from './components/RequestForm';
import RequestHistory from './components/RequestHistory';
import ConfirmationModal from './components/ConfirmationModal';
import AdminDashboard from './components/AdminDashboard';
import PasswordModal from './components/PasswordModal';
import UpdateSuccessModal from './components/UpdateSuccessModal';
import { supabase } from './supabaseClient';

// Mock user ID
const MOCK_USER_ID = 'user-12345';

const App: React.FC = () => {
  const [masterItems, setMasterItems] = useState<ConsumableItem[]>([]);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [equipmentCodes, setEquipmentCodes] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMode, setUserMode] = useState<'general' | 'admin'>('general');
  const [isLoading, setIsLoading] = useState(true);

  // Admin password state (Keep local for simple UI lock)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('adminPassword') || '0000');

  // Master data update state
  const [lastMasterUpdate, setLastMasterUpdate] = useState<Date | null>(null);
  const [isUpdateSuccessModalOpen, setIsUpdateSuccessModalOpen] = useState(false);


  // Fetch initial data from Supabase
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Master Items
      const { data: itemsData, error: itemsError } = await supabase
        .from('master_items')
        .select('*')
        .order('name');
      
      if (itemsError) throw itemsError;

      // 2. Fetch Request Logs
      const { data: logsData, error: logsError } = await supabase
        .from('request_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (logsError) throw logsError;

      // 3. Fetch Lines
      const { data: linesData, error: linesError } = await supabase
        .from('lines')
        .select('name')
        .order('name');

      if (linesError) throw linesError;

      // 4. Fetch Equipment Codes
      const { data: eqData, error: eqError } = await supabase
        .from('equipment_codes')
        .select('code')
        .order('code');

      if (eqError) throw eqError;

      setMasterItems(itemsData || []);
      setRequestLogs(logsData || []);
      setLines(linesData?.map((l: any) => l.name) || []);
      setEquipmentCodes(eqData?.map((e: any) => e.code) || []);
      
      // We don't track master update time in DB table separately in this simple schema, 
      // but we could use the most recent created_at if needed. For now leaving null.
      setLastMasterUpdate(null);

    } catch (err: any) {
      console.error('Error fetching data from Supabase:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('adminPassword')) {
      localStorage.setItem('adminPassword', '0000');
    }
    fetchData();
  }, [fetchData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      let text = e.target?.result as string;
      if (!text) {
          setError("파일을 읽을 수 없습니다. 비어있는 파일인지 확인해주세요.");
          return;
      }
      
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }

      try {
        const parsedItems: ConsumableItem[] = [];
        const rows = text.split(/\r?\n/).slice(1); 

        rows.forEach((row) => {
          if (!row.trim()) return;
          const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => {
            let clean = c.trim();
            if (clean.startsWith('"') && clean.endsWith('"')) {
              clean = clean.substring(1, clean.length - 1);
            }
            return clean.replace(/""/g, '"');
          });

          if (columns.length >= 6) {
            const [id, supplier, name, specification, unit, priceStr] = columns;
            const price = parseFloat(String(priceStr).replace(/,/g, ''));

            if (id && name && !isNaN(price)) {
               parsedItems.push({
                id: id.trim(),
                supplier: supplier.trim(),
                name: name.trim(),
                specification: specification.trim(),
                unit: unit.trim(),
                price,
              });
            }
          }
        });

        if(parsedItems.length === 0) {
            throw new Error("CSV 파일에서 유효한 데이터를 찾을 수 없습니다.");
        }
        
        // Supabase Upsert (Insert or Update)
        const { error: upsertError } = await supabase
            .from('master_items')
            .upsert(parsedItems, { onConflict: 'id' });

        if (upsertError) throw upsertError;

        await fetchData(); // Refresh data
        setIsUpdateSuccessModalOpen(true);
        setError(null);
      } catch (err: any) {
        setError("CSV 처리 또는 업로드 중 오류: " + (err.message || JSON.stringify(err)));
        console.error(err);
      } finally {
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
        setError("파일 읽기 중 오류가 발생했습니다.");
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleModeChange = (mode: 'general' | 'admin') => {
    if (mode === 'admin') {
      if (isAdminAuthenticated) {
        setUserMode('admin');
      } else {
        setIsPasswordModalOpen(true);
      }
    } else { 
      setUserMode('general');
      setIsAdminAuthenticated(false);
    }
  };

  const handlePasswordSubmit = (password: string): boolean => {
    if (password === adminPassword) {
      setIsAdminAuthenticated(true);
      setUserMode('admin');
      setIsPasswordModalOpen(false);
      return true;
    }
    return false;
  };

  const handlePasswordChange = (oldPass: string, newPass: string): string | null => {
    if (oldPass !== adminPassword) {
      return "현재 비밀번호가 일치하지 않습니다.";
    }
    setAdminPassword(newPass);
    localStorage.setItem('adminPassword', newPass);
    return null;
  };

  const handleAddItem = async (newItem: ConsumableItem): Promise<string | null> => {
    try {
        const { error } = await supabase
            .from('master_items')
            .insert([newItem]);
            
        if (error) {
            if (error.code === '23505') return '오류: 동일한 품번(SKU)이 이미 존재합니다.';
            throw error;
        }
        await fetchData();
        return null;
    } catch (e: any) {
        return '추가 실패: ' + e.message;
    }
  };

  const handleAddLine = async (newLine: string): Promise<string | null> => {
    try {
        const { error } = await supabase
            .from('lines')
            .insert([{ name: newLine }]);
        
        if (error) {
             if (error.code === '23505') return '오류: 이미 존재하는 라인입니다.';
             throw error;
        }
        await fetchData();
        return null;
    } catch (e: any) {
        return '라인 추가 실패: ' + e.message;
    }
  };

  const handleDeleteLine = async (lineToDelete: string) => {
    try {
        const { error } = await supabase
            .from('lines')
            .delete()
            .eq('name', lineToDelete);
        
        if (error) throw error;
        await fetchData();
    } catch (e) {
        console.error('Delete line error:', e);
        setError('라인 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddEquipmentCode = async (newCode: string): Promise<string | null> => {
    try {
        const { error } = await supabase
            .from('equipment_codes')
            .insert([{ code: newCode }]);
        
        if (error) {
            if (error.code === '23505') return '오류: 이미 존재하는 설비코드입니다.';
            throw error;
        }
        await fetchData();
        return null;
    } catch (e: any) {
        return '설비코드 추가 실패: ' + e.message;
    }
  };

  const handleDeleteEquipmentCode = async (codeToDelete: string) => {
    try {
        const { error } = await supabase
            .from('equipment_codes')
            .delete()
            .eq('code', codeToDelete);
        
        if (error) throw error;
        await fetchData();
    } catch (e) {
         console.error('Delete equipment error:', e);
         setError('설비코드 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleRequestSubmit = async (
    cart: { item: ConsumableItem; quantity: number }[],
    line: string,
    equipmentCode: string,
    desiredDeliveryDate?: string
  ) => {
    try {
        const newLogs = cart.map(cartItem => ({
            // ID is auto-generated in logic or we can create a UUID. 
            // Since we defined ID as text in SQL, we can generate a UUID-like string or let DB handle it if it was uuid type.
            // But types.ts says RequestLog has id. Let's generate one.
            id: crypto.randomUUID(),
            requester_id: MOCK_USER_ID,
            line,
            equipment_code: equipmentCode || null, // Supabase expects null for optional
            item_id: cartItem.item.id,
            item_name: cartItem.item.name,
            quantity: cartItem.quantity,
            total_cost: cartItem.item.price * cartItem.quantity,
            timestamp: new Date().toISOString(),
            desired_delivery_date: desiredDeliveryDate || null,
        }));

        const { error } = await supabase
            .from('request_logs')
            .insert(newLogs);

        if (error) throw error;

        await fetchData(); // Refresh logs
        setIsModalOpen(true);
    } catch (e) {
        console.error('Submit request error:', e);
        setError('요청 제출 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
        const { error } = await supabase
            .from('request_logs')
            .delete()
            .eq('id', logId);
            
        if (error) throw error;
        
        // Optimistic update or refetch
        setRequestLogs(prev => prev.filter(log => log.id !== logId));
    } catch (e) {
        console.error('Delete log error:', e);
        setError('요청 기록 삭제 실패');
    }
  };

  const handleUpdateLogQuantity = async (logId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const log = requestLogs.find(l => l.id === logId);
    if (!log) return;
    
    // Find item to calculate price
    const item = masterItems.find(i => i.id === log.item_id);
    const unitPrice = item ? item.price : (log.total_cost / log.quantity);
    const newTotalCost = unitPrice * newQuantity;

    try {
        const { error } = await supabase
            .from('request_logs')
            .update({ quantity: newQuantity, total_cost: newTotalCost })
            .eq('id', logId);
            
        if (error) throw error;
        
        // Optimistic update
        setRequestLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, quantity: newQuantity, total_cost: newTotalCost } : l
        ));
    } catch (e) {
        console.error('Update log error:', e);
        setError('수량 업데이트 실패');
    }
  };


  const renderGeneralMode = () => (
     <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        <div className="lg:col-span-3">
          <RequestForm
            items={masterItems}
            lines={lines}
            equipmentCodes={equipmentCodes}
            onSubmit={handleRequestSubmit}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <RequestHistory logs={requestLogs} />
        </div>
      </div>
  );

  const renderAdminMode = () => (
      <AdminDashboard
        logs={requestLogs}
        items={masterItems}
        lines={lines}
        equipmentCodes={equipmentCodes}
        onAddItem={handleAddItem}
        onAddLine={handleAddLine}
        onDeleteLine={handleDeleteLine}
        onAddEquipmentCode={handleAddEquipmentCode}
        onDeleteEquipmentCode={handleDeleteEquipmentCode}
        onDeleteLog={handleDeleteLog}
        onUpdateLogQuantity={handleUpdateLogQuantity}
        onPasswordChange={handlePasswordChange}
        onMasterFileUpdate={handleFileChange}
        fileUploadError={error}
        lastMasterUpdate={lastMasterUpdate}
      />
  );


  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-lg text-slate-600 font-medium">데이터 불러오는 중...</p>
                </div>
            </div>
        );
    }
    // Error for file upload is handled inside AdminDashboard, this is for more general errors
    const generalError = error && !fileUploadError ? error : null;
    if (generalError) {
        return (
            <div className="text-center bg-red-50 border border-red-200 p-6 rounded-2xl max-w-lg mx-auto mt-10">
                <h3 className="text-xl font-bold text-red-700 mb-2">오류 발생</h3>
                <p className="text-red-600">{generalError}</p>
                <button 
                    onClick={() => { setError(null); fetchData(); }}
                    className="mt-4 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                >
                    다시 시도
                </button>
            </div>
        )
    }
    return userMode === 'general' ? renderGeneralMode() : renderAdminMode();
  };
  
  const fileUploadError = error; // Pass all errors for now

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header 
        userMode={userMode}
        onModeChange={handleModeChange}
      />
      <main className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow">
        {renderContent()}
      </main>
      
      <footer className="py-8 text-center">
        <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase opacity-70">
          made by Martin
        </p>
      </footer>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordSubmit}
      />
      <UpdateSuccessModal
        isOpen={isUpdateSuccessModalOpen}
        onClose={() => setIsUpdateSuccessModalOpen(false)}
      />
    </div>
  );
};

export default App;