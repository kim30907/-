import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
const INITIAL_LINES = ["프레스", "파인프레스", "연마/바렐", "열처리", "링기어", "퀵커넥터", "타각/포장"];


const App: React.FC = () => {
  const [masterItems, setMasterItems] = useState<ConsumableItem[]>([]);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [lines, setLines] = useState<string[]>(INITIAL_LINES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMode, setUserMode] = useState<'general' | 'admin'>('general');

  // Admin password state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('adminPassword') || 'YSP2025');

  // Master data update state
  const [lastMasterUpdate, setLastMasterUpdate] = useState<Date | null>(null);
  const [isUpdateSuccessModalOpen, setIsUpdateSuccessModalOpen] = useState(false);


  useEffect(() => {
    if (!localStorage.getItem('adminPassword')) {
      localStorage.setItem('adminPassword', 'YSP2025');
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
      
      // Handle BOM (Byte Order Mark) often found in UTF-8 files from Windows
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }

      try {
        const parsedItems: ConsumableItem[] = [];
        // Use regex to handle both \n and \r\n line endings
        const rows = text.split(/\r?\n/).slice(1); // Skip header row

        rows.forEach((row, index) => {
          if (!row.trim()) return;

          // Split by commas not inside double quotes
          const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => {
            // Remove quotes from start and end, and handle escaped quotes ("")
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
            } else {
              console.warn(`[Row ${index + 2}] 유효하지 않은 데이터로 인해 건너뜁니다: ${row}`);
            }
          } else {
            console.warn(`[Row ${index + 2}] 컬럼 수가 맞지 않아 건너뜁니다: ${row}`);
          }
        });

        if(parsedItems.length === 0) {
            throw new Error("CSV 파일에서 유효한 데이터를 찾을 수 없습니다. 파일 형식과 내용을 확인해주세요.");
        }
        setMasterItems(parsedItems);
        setLastMasterUpdate(new Date());
        setIsUpdateSuccessModalOpen(true);
        setError(null); // Clear previous errors on success
      } catch (err) {
        setError("CSV 파일 처리 중 오류가 발생했습니다. 파일 인코딩이 UTF-8인지, 형식이 올바른지 확인해주세요.");
        console.error(err);
      } finally {
        // Reset the file input value to allow re-uploading the same file
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
    } else { // mode === 'general'
      setUserMode('general');
      setIsAdminAuthenticated(false); // De-authenticate when switching to general mode
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

  const handleAddItem = useCallback((newItem: ConsumableItem): string | null => {
    if (masterItems.some(item => item.id.toLowerCase() === newItem.id.toLowerCase())) {
        return '오류: 동일한 품번(SKU)이 이미 존재합니다. 다른 품번을 사용해주세요.';
    }
    setMasterItems(prevItems => [newItem, ...prevItems]);
    setLastMasterUpdate(new Date()); // Also update timestamp on manual add
    return null;
  }, [masterItems]);

  const handleAddLine = useCallback((newLine: string): string | null => {
    if (lines.some(line => line.toLowerCase() === newLine.toLowerCase())) {
        return '오류: 이미 존재하는 라인입니다.';
    }
    setLines(prevLines => [...prevLines, newLine]);
    return null;
  }, [lines]);

  const handleDeleteLine = useCallback((lineToDelete: string) => {
    setLines(prevLines => prevLines.filter(line => line !== lineToDelete));
  }, []);

  const handleRequestSubmit = useCallback((
    cart: { item: ConsumableItem; quantity: number }[],
    line: string,
    desiredDeliveryDate?: string
  ) => {
    const timestamp = Date.now();
    const newLogs: RequestLog[] = cart.map((cartItem, index) => ({
      id: `${timestamp}-${cartItem.item.id}-${index}`,
      requesterId: MOCK_USER_ID,
      line,
      itemId: cartItem.item.id,
      itemName: cartItem.item.name,
      quantity: cartItem.quantity,
      totalCost: cartItem.item.price * cartItem.quantity,
      timestamp: timestamp,
      desiredDeliveryDate: desiredDeliveryDate || undefined,
    }));
    
    setRequestLogs(prevLogs => [...newLogs, ...prevLogs]);
    setIsModalOpen(true);
  }, []);

  const handleDeleteLog = useCallback((logId: string) => {
    setRequestLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
  }, []);

  const handleUpdateLogQuantity = useCallback((logId: string, newQuantity: number) => {
    setRequestLogs(prevLogs => prevLogs.map(log => {
      if (log.id === logId) {
        const item = masterItems.find(i => i.id === log.itemId);
        if (item && newQuantity > 0) {
          return {
            ...log,
            quantity: newQuantity,
            totalCost: item.price * newQuantity,
          };
        }
      }
      return log;
    }));
  }, [masterItems]);


  const renderGeneralMode = () => (
     <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RequestForm
            items={masterItems}
            lines={lines}
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
        onAddItem={handleAddItem}
        onAddLine={handleAddLine}
        onDeleteLine={handleDeleteLine}
        onDeleteLog={handleDeleteLog}
        onUpdateLogQuantity={handleUpdateLogQuantity}
        onPasswordChange={handlePasswordChange}
        onMasterFileUpdate={handleFileChange}
        fileUploadError={error}
        lastMasterUpdate={lastMasterUpdate}
      />
  );


  const renderContent = () => {
    return userMode === 'general' ? renderGeneralMode() : renderAdminMode();
  };

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