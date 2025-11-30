
import React, { useState, useMemo } from 'react';
import type { ConsumableItem } from '../types';
import { SearchIcon, ChevronDownIcon, PlusIcon, MinusIcon, TrashIcon } from './Icons';

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
  const [equipmentCode, setEquipmentCode] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredItems = useMemo(() => {
    const trimmedSearchQuery = searchQuery.trim();

    if (!line || !trimmedSearchQuery) {
      return [];
    }
    
    // Normalize the search term to prevent issues with different Unicode representations of Korean characters.
    const normalizedTerm = trimmedSearchQuery.toLowerCase().normalize('NFC');

    return items.filter(item => {
      // Exclude items that are already in the cart
      const isItemInCart = cart.some(cartItem => cartItem.item.id === item.id);
      if (isItemInCart) {
        return false;
      }

      // Normalize item data before comparison for accuracy.
      const normalizedItemName = item.name.toLowerCase().normalize('NFC');
      const normalizedSpec = item.specification.toLowerCase().normalize('NFC');
      
      const hasNameMatch = normalizedItemName.includes(normalizedTerm);
      const hasSpecMatch = normalizedSpec.includes(normalizedTerm);
      
      return hasNameMatch || hasSpecMatch;
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
      setLine(''); // Reset line after submission
      setEquipmentCode(''); // Reset equipment code
      setDesiredDate(''); // Reset date after submission
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Prevent triggering search while composing with an IME
      if (e.nativeEvent.isComposing) {
        return;
      }
      setSearchQuery(searchTerm);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Clear previous search results when user starts typing a new query
    if (searchQuery) {
        setSearchQuery('');
    }
  };

  const isFormValid = cart.length > 0 && line;

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-slate-700">새 요청 작성</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="line" className="block text-sm font-medium text-slate-600 mb-2">1. 요청 라인 선택 (필수)</label>
                <div className="relative">
                <select
                    id="line"
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                    className="w-full appearance-none p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-8"
                >
                    <option value="">-- 라인을 선택해주세요 --</option>
                    {lines.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon />
                </div>
                </div>
            </div>
            
            <div>
                <label htmlFor="equipmentCode" className="block text-sm font-medium text-slate-600 mb-2">2. 설비코드 선택 (선택)</label>
                <div className="relative">
                <select
                    id="equipmentCode"
                    value={equipmentCode}
                    onChange={(e) => setEquipmentCode(e.target.value)}
                    className="w-full appearance-none p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-8"
                >
                    <option value="">-- 설비코드 선택 (선택사항) --</option>
                    {equipmentCodes.map(code => <option key={code} value={code}>{code}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon />
                </div>
                </div>
            </div>

            <div className="md:col-span-2">
                <label htmlFor="desired-date" className="block text-sm font-medium text-slate-600 mb-2">3. 희망 납기일 (선택)</label>
                <input
                    type="date"
                    id="desired-date"
                    value={desiredDate}
                    onChange={(e) => setDesiredDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
            </div>
        </div>
        
        <div className={`transition-opacity ${!line ? 'opacity-50' : 'opacity-100'}`}>
          <div className="relative">
            <label htmlFor="item-search" className="block text-sm font-medium text-slate-600 mb-2">4. 품목 검색</label>
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
                placeholder={line ? '추가할 품명 또는 규격 검색 후 Enter' : '라인을 먼저 선택하세요'}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-slate-100"
                autoComplete="off"
                disabled={!line}
              />
            </div>
            {isFocused && searchQuery.trim() && line && (
              <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <li
                      key={item.id}
                      onMouseDown={() => handleItemSelect(item)}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.id} &middot; {item.specification} &middot; {item.price.toLocaleString()}원</p>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-slate-500">검색 결과가 없거나 이미 추가된 품목입니다.</li>
                )}
              </ul>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-700 pt-2">요청 목록</h3>
            <div className="max-h-[300px] overflow-y-auto pr-2 -mr-2 border-t border-b border-slate-200">
                {cart.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-slate-500 bg-slate-50 rounded-lg my-4">
                        <p>라인 선택 후 품목을 검색하여 추가해주세요.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {cart.map(({ item, quantity }) => (
                            <li key={item.id} className="py-4 grid grid-cols-3 gap-4 items-center">
                                <div className="col-span-2 sm:col-span-1">
                                    <p className="font-semibold text-slate-800 truncate" title={`${item.name} (${item.specification})`}>{item.name}</p>
                                    <p className="text-sm text-slate-500">
                                        {item.specification} &middot; {item.price.toLocaleString()}원
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                    <button type="button" onClick={() => handleQuantityChange(item.id, quantity - 1)} className="p-1 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
                                        <MinusIcon />
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => handleQuantityChange(item.id, e.target.value ? parseInt(e.target.value, 10) : 1)}
                                        min="1"
                                        className="w-12 text-center border-none bg-slate-100 rounded-md p-1 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button type="button" onClick={() => handleQuantityChange(item.id, quantity + 1)} className="p-1 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
                                        <PlusIcon />
                                    </button>
                                </div>
                                <div className="flex items-center justify-end gap-2 sm:gap-4">
                                    <p className="font-semibold w-20 text-right">{(item.price * quantity).toLocaleString()}원</p>

                                    <button type="button" onClick={() => handleRemoveItem(item.id)} title={`${item.name} 삭제`}>
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
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                 <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-slate-800">총 합계</span>
                    <span className="text-blue-600">{totalCost.toLocaleString()}원</span>
                </div>
            </div>
          </div>
        )}
        
        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-95"
        >
          {line ? `${line}으로 요청 제출하기` : '요청 제출하기'}
        </button>
      </form>
    </div>
  );
};

export default RequestForm;
