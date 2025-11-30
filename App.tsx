
import React, { useState, useCallback, useEffect } from 'react';
import type { ConsumableItem, RequestLog } from './types';
import Header from './components/Header';
import RequestForm from './components/RequestForm';
import RequestHistory from './components/RequestHistory';
import ConfirmationModal from './components/ConfirmationModal';
import AdminDashboard from './components/AdminDashboard';
import PasswordModal from './components/PasswordModal';
import UpdateSuccessModal from './components/UpdateSuccessModal';

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

  // Admin password state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('adminPassword') || '0000');

  // Master data update state
  const [lastMasterUpdate, setLastMasterUpdate] = useState<Date | null>(null);
  const [isUpdateSuccessModalOpen, setIsUpdateSuccessModalOpen] = useState(false);


  useEffect(() => {
    if (!localStorage.getItem('adminPassword')) {
      localStorage.setItem('adminPassword', '0000');
    }
    
    setIsLoading(true);
    
    // Load persisted data
    try {
      const storedItems = localStorage.getItem('masterItems');
      const storedUpdateDate = localStorage.getItem('lastMasterUpdate');
      const storedLogs = localStorage.getItem('requestLogs');
      const storedLines = localStorage.getItem('lines');
      const storedEquipmentCodes = localStorage.getItem('equipmentCodes');

      setMasterItems(storedItems ? JSON.parse(storedItems) : []);
      setLastMasterUpdate(storedUpdateDate ? new Date(storedUpdateDate) : null);
      setRequestLogs(storedLogs ? JSON.parse(storedLogs) : []);
      setLines(storedLines ? JSON.parse(storedLines) : []);
      setEquipmentCodes(storedEquipmentCodes ? JSON.parse(storedEquipmentCodes) : []);

    } catch (e) {
      console.error("Failed to load data from localStorage, initializing with empty state.", e);
      // Fallback to empty state on any parsing error
      setMasterItems([]);
      setRequestLogs([]);
      setLines([]);
      setEquipmentCodes([]);
      setLastMasterUpdate(null);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
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
        
        const newUpdateDate = new Date();
        setMasterItems(parsedItems);
        setLastMasterUpdate(newUpdateDate);
        localStorage.setItem('masterItems', JSON.stringify(parsedItems));
        localStorage.setItem('lastMasterUpdate', newUpdateDate.toISOString());

        setIsUpdateSuccessModalOpen(true);
        setError(null);
      } catch (err: any) {
        setError("CSV 처리 중 오류: " + err.message);
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

  const handleAddItem = (newItem: ConsumableItem): string | null => {
    if (masterItems.some(item => item.id.toLowerCase() === newItem.id.toLowerCase())) {
        return '오류: 동일한 품번(SKU)이 이미 존재합니다. 다른 품번을 사용해주세요.';
    }
    const newItems = [newItem, ...masterItems];
    const newUpdateDate = new Date();
    setMasterItems(newItems);
    setLastMasterUpdate(newUpdateDate);
    localStorage.setItem('masterItems', JSON.stringify(newItems));
    localStorage.setItem('lastMasterUpdate', newUpdateDate.toISOString());
    return null;
  };

  const handleAddLine = (newLine: string): string | null => {
    if (lines.some(line => line.toLowerCase() === newLine.toLowerCase())) {
        return '오류: 이미 존재하는 라인입니다.';
    }
    const newLines = [...lines, newLine];
    setLines(newLines);
    localStorage.setItem('lines', JSON.stringify(newLines));
    return null;
  };

  const handleDeleteLine = (lineToDelete: string) => {
    const newLines = lines.filter(line => line !== lineToDelete);
    setLines(newLines);
    localStorage.setItem('lines', JSON.stringify(newLines));
  };

  const handleAddEquipmentCode = (newCode: string): string | null => {
    if (equipmentCodes.some(code => code.toLowerCase() === newCode.toLowerCase())) {
        return '오류: 이미 존재하는 설비코드입니다.';
    }
    const newCodes = [...equipmentCodes, newCode];
    setEquipmentCodes(newCodes);
    localStorage.setItem('equipmentCodes', JSON.stringify(newCodes));
    return null;
  };

  const handleDeleteEquipmentCode = (codeToDelete: string) => {
    const newCodes = equipmentCodes.filter(code => code !== codeToDelete);
    setEquipmentCodes(newCodes);
    localStorage.setItem('equipmentCodes', JSON.stringify(newCodes));
  };

  const handleRequestSubmit = (
    cart: { item: ConsumableItem; quantity: number }[],
    line: string,
    equipmentCode: string,
    desiredDeliveryDate?: string
  ) => {
    const newLogs = cart.map(cartItem => ({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requester_id: MOCK_USER_ID,
      line,
      equipment_code: equipmentCode || undefined,
      item_id: cartItem.item.id,
      item_name: cartItem.item.name,
      quantity: cartItem.quantity,
      total_cost: cartItem.item.price * cartItem.quantity,
      timestamp: new Date().toISOString(),
      desired_delivery_date: desiredDeliveryDate || undefined,
    }));
    
    setRequestLogs(prevLogs => {
        const updatedLogs = [...newLogs, ...prevLogs];
        localStorage.setItem('requestLogs', JSON.stringify(updatedLogs));
        return updatedLogs;
    });
    setIsModalOpen(true);
  };

  const handleDeleteLog = (logId: string) => {
    setRequestLogs(prevLogs => {
      const updatedLogs = prevLogs.filter(log => log.id !== logId);
      localStorage.setItem('requestLogs', JSON.stringify(updatedLogs));
      
      if (updatedLogs.length === prevLogs.length) {
          console.warn(`Log with ID ${logId} not found. It might have been already deleted.`);
      }
      
      return updatedLogs;
    });
  };

  const handleUpdateLogQuantity = (logId: string, newQuantity: number) => {
    setRequestLogs(prevLogs => {
        const logToUpdate = prevLogs.find(log => log.id === logId);
        if (!logToUpdate) return prevLogs;
        
        const item = masterItems.find(i => i.id === logToUpdate.item_id);
        if (!item || newQuantity <= 0) return prevLogs;

        const newTotalCost = item.price * newQuantity;
        const updatedLogs = prevLogs.map(log => 
            log.id === logId 
                ? { ...log, quantity: newQuantity, total_cost: newTotalCost } 
                : log
        );
        localStorage.setItem('requestLogs', JSON.stringify(updatedLogs));
        return updatedLogs;
    });
  };


  const renderGeneralMode = () => (
     <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
                <p className="text-xl text-slate-600">데이터를 불러오는 중입니다...</p>
            </div>
        );
    }
    // Error for file upload is handled inside AdminDashboard, this is for more general errors
    const generalError = error && !fileUploadError ? error : null;
    if (generalError) {
        return (
            <div className="text-center bg-red-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-red-700">오류 발생</h3>
                <p className="text-red-600 mt-2">{generalError}</p>
            </div>
        )
    }
    return userMode === 'general' ? renderGeneralMode() : renderAdminMode();
  };
  
  const fileUploadError = error; // Pass all errors for now

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <Header 
        userMode={userMode}
        onModeChange={handleModeChange}
      />
      <main className="container mx-auto p-4 md:p-6">
        {renderContent()}
      </main>
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
