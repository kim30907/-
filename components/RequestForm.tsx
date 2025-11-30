import React, { useState, useMemo, useEffect } from 'react';
import type { ConsumableItem } from '../types';
import { SearchIcon, ChevronDownIcon, PlusIcon, MinusIcon, TrashIcon, XIcon } from './Icons';

interface RequestFormProps {
  items: ConsumableItem[];
  lines: string[];
  equipmentCodes: string[];
  onSubmit: (cart: { item: ConsumableItem; quantity: number }[], line: string, equipmentCode: string, desiredDeliveryDate?: string) => void;
}

interface CartItem {
  item: ConsumableItem;
  quantity: number;
}

const RequestForm: React.FC<RequestFormProps> = ({ items, lines, equipmentCodes, onSubmit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [line, setLine] = useState('');
  
  // Equipment Code Search States
  const [equipmentCode, setEquipmentCode] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [showEquipmentOptions, setShowEquipmentOptions] = useState(false);

  const [desiredDate, setDesiredDate] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Filter equipment codes based on search input
  const filteredEquipmentCodes = useMemo(() => {
    const term = equipmentSearch.trim().toLowerCase();
    if (!term) return equipmentCodes;
    return equipmentCodes.filter(code => code.toLowerCase().includes(term));
  }, [equipmentCodes, equipmentSearch]);

  const handleEquipmentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEquipmentSearch(val);
    setShowEquipmentOptions(true);

    // If the user types an exact match (case-insensitive), select it automatically
    const exactMatch = equipmentCodes.find(code => code.toLowerCase() === val.toLowerCase());
    if (exactMatch) {
      setEquipmentCode(exactMatch);
    } else {
      setEquipmentCode(''); 
    }
  };

  const selectEquipmentCode = (code: string) => {
    setEquipmentCode(code);
    setEquipmentSearch(code);
    setShowEquipmentOptions(false);
  };

  const clearEquipmentCode = () => {
      setEquipmentCode('');
      setEquipmentSearch('');
      setShowEquipmentOptions(false);
  };

  const filteredItems = useMemo(() => {
    const trimmedSearchQuery = searchQuery.trim();

    if (!line || !trimmedSearchQuery) {
      return [];
    }
    
    const normalizedTerm = trimmedSearchQuery.toLowerCase().normalize('NFC');

    return items.filter(item => {
      const isItemInCart = cart.some(cartItem => cartItem.item.id === item.id);
      if (isItemInCart) {
        return false;
      }

      const normalizedItemName = item.name.toLowerCase().normalize('NFC');
      const normalizedSpec = item.specification.toLowerCase().normalize('NFC');
      
      return normalizedItemName.includes(normalizedTerm) || normalizedSpec.includes(normalizedTerm);
    });
  }, [searchQuery, line, items, cart]);
  
  const handleItemSelect = (item: ConsumableItem) => {
    if (!cart.some(cartItem => cartItem.item.id === item.id)) {
      setCart(prevCart => [...prevCart, { item, quantity: 1 }]);
    }
    setSearchTerm('');
    setSearchQuery('');
    setIsFocused(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.item.id !== itemId));
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    const updatedQuantity = Math.max(1, newQuantity);
    setCart(prevCart =>
      prevCart.map(cartItem =>
        cartItem.item.id === itemId ? { ...cartItem, quantity: updatedQuantity } : cartItem
      )
    );
  };
  
  const totalCost = useMemo(() => {
    return cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0);
  }, [cart]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length > 0 && line) {
      onSubmit(cart, line, equipmentCode, desiredDate);
      setCart([]);
      setLine(''); 
      setEquipmentCode(''); 
      setEquipmentSearch(''); 
      setDesiredDate(''); 
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.nativeEvent.isComposing) {
        return;
      }
      setSearchQuery(searchTerm);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (searchQuery) {
        setSearchQuery('');
    }
  };

  const isFormValid = cart.length > 0 && line;

  const inputClasses = "w-full p-3 border border-slate-200 bg-slate-50 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 outline-none";
  const labelClasses = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2";

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-slate-100">
      <h2 className="text-2xl font-bold mb-8 text-slate-800 tracking-tight">새 요청 작성</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="line" className={labelClasses}>1. 요청 라인 (필수)</label>
                <div className="relative">
                <select
                    id="line"
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                    className={`${inputClasses} appearance-none pr-10`}
                >
                    <option value="">라인 선택</option>
                    {lines.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <ChevronDownIcon />
                </div>
                </div>
            </div>
            
            <div>
                <label htmlFor="equipmentCodeSearch" className={labelClasses}>2. 설비코드 (선택)</label>
                <div className="relative">
                    <input
                        type="text"
                        id="equipmentCodeSearch"
                        value={equipmentSearch}
                        onChange={handleEquipmentSearchChange}
                        onFocus={() => setShowEquipmentOptions(true)}
                        onBlur={() => setTimeout(() => setShowEquipmentOptions(false), 200)}
                        placeholder="검색 (예: NA-01)"
                        autoComplete="off"
                        className={inputClasses}
                    />
                    {equipmentSearch && (
                        <button 
                            type="button" 
                            onClick={clearEquipmentCode}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    )}
                    {!equipmentSearch && (
                         <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                             <SearchIcon />
                         </div>
                    )}
                    
                    {showEquipmentOptions && (
                        <ul className="absolute z-20 w-full bg-white border border-slate-100 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-xl ring-1 ring-black/5">
                             {filteredEquipmentCodes.length > 0 ? (
                                filteredEquipmentCodes.map(code => (
                                    <li 
                                        key={code} 
                                        onMouseDown={() => selectEquipmentCode(code)}
                                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-700 text-sm"
                                    >
                                        {code}
                                    </li>
                                ))
                             ) : (
                                 <li className="px-4 py-3 text-slate-500 text-sm">결과 없음</li>
                             )}
                        </ul>
                    )}
                </div>
            </div>

            <div className="md:col-span-2">
                <label htmlFor="desired-date" className={labelClasses}>3. 희망 납기일 (선택)</label>
                <input
                    type="date"
                    id="desired-date"
                    value={desiredDate}
                    onChange={(e) => setDesiredDate(e.target.value)}
                    className={inputClasses}
                />
            </div>
        </div>
        
        <div className={`transition-all duration-300 ${!line ? 'opacity-50 grayscale' : 'opacity-100'}`}>
          <div className="relative">
            <label htmlFor="item-search" className={labelClasses}>4. 품목 검색</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                id="item-search"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder={line ? '품명 또는 규격 입력 후 Enter' : '라인을 먼저 선택하세요'}
                className={`${inputClasses} pl-10`}
                autoComplete="off"
                disabled={!line}
              />
            </div>
            {isFocused && searchQuery.trim() && line && (
              <ul className="absolute z-10 w-full bg-white border border-slate-100 rounded-lg mt-1 max-h-64 overflow-y-auto shadow-xl ring-1 ring-black/5">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <li
                      key={item.id}
                      onMouseDown={() => handleItemSelect(item)}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="flex justify-between items-center">
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{item.price.toLocaleString()}원</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.id} &middot; {item.specification}</p>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-4 text-center text-slate-500 text-sm">검색 결과가 없거나 이미 추가되었습니다.</li>
                )}
              </ul>
            )}
          </div>
        </div>
        
        <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">요청 목록</h3>
            <div className="min-h-[120px]">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-sm">품목을 검색하여 추가해주세요.</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {cart.map(({ item, quantity }) => (
                            <li key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group">
                                <div className="min-w-0 flex-1 mr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                                        <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">{item.specification}</span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        @{item.price.toLocaleString()}원
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                     <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm">
                                        <button type="button" onClick={() => handleQuantityChange(item.id, quantity - 1)} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors">
                                            <MinusIcon />
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => handleQuantityChange(item.id, e.target.value ? parseInt(e.target.value, 10) : 1)}
                                            min="1"
                                            className="w-10 text-center border-none p-0 text-sm font-semibold text-slate-700 focus:ring-0"
                                        />
                                        <button type="button" onClick={() => handleQuantityChange(item.id, quantity + 1)} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors">
                                            <PlusIcon />
                                        </button>
                                    </div>

                                    <div className="text-right w-24">
                                        <p className="font-bold text-slate-800">{(item.price * quantity).toLocaleString()}원</p>
                                    </div>
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveItem(item.id)} 
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>

        {cart.length > 0 && (
            <div className="flex justify-between items-center bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                <span className="text-slate-600 font-medium">총 합계</span>
                <span className="text-2xl font-bold text-blue-600 tracking-tight">{totalCost.toLocaleString()}원</span>
            </div>
        )}
        
        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 transform active:scale-[0.99]"
        >
          {line ? `${line}으로 요청 제출` : '요청 제출하기'}
        </button>
      </form>
    </div>
  );
};

export default RequestForm;