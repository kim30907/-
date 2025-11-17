import React, { useState } from 'react';
import type { ConsumableItem } from '../types';
import { PlusCircleIcon } from './Icons';

interface AddItemFormProps {
  onAddItem: (item: ConsumableItem) => string | null;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onAddItem }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [specification, setSpecification] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !sku || !price || !supplier || !specification || !unit) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      setError('유효한 단가를 입력해주세요.');
      return;
    }

    const newItem: ConsumableItem = {
      id: sku,
      name,
      supplier,
      specification,
      unit,
      price: priceNumber,
    };

    const errorMsg = onAddItem(newItem);
    if (errorMsg) {
      setError(errorMsg);
    } else {
      // Reset form on success
      setName('');
      setSku('');
      setPrice('');
      setSupplier('');
      setSpecification('');
      setUnit('');
    }
  };

  const isFormValid = name && sku && price && supplier && specification && unit;

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <PlusCircleIcon />
        <h2 className="text-xl font-bold text-slate-700">신규 품목 추가</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="itemName" className="block text-sm font-medium text-slate-600 mb-1">품명</label>
            <input
              type="text"
              id="itemName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 메쉬벨트"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-slate-600 mb-1">품번 (SKU)</label>
            <input
              type="text"
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="예: Z0102-00035"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
            <label htmlFor="supplier" className="block text-sm font-medium text-slate-600 mb-1">업체명</label>
            <input
              type="text"
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="예: (주)동아철망"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="specification" className="block text-sm font-medium text-slate-600 mb-1">규격</label>
            <input
              type="text"
              id="specification"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="예: 폭800"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-slate-600 mb-1">단위</label>
            <input
              type="text"
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="예: M"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-600 mb-1">단가 (원)</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              placeholder="예: 520000"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-95 mt-2"
        >
          품목 추가하기
        </button>
      </form>
    </div>
  );
};

export default AddItemForm;
