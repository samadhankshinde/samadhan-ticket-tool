
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

interface CalendarPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  disabled?: boolean;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelect = (day: number) => {
    const selectedDate = new Date(year, month, day);
    // Format to YYYY-MM-DD local time
    const formatted = selectedDate.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
    onChange(formatted);
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const d = new Date(value);
    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-800 outline-none text-left flex items-center justify-between transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.99]'
        }`}
      >
        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <span>{value || "Select assessment date"}</span>
        {value && !disabled && (
          <X 
            className="w-4 h-4 text-gray-400 hover:text-gray-600" 
            onClick={(e) => { e.stopPropagation(); onChange(''); }} 
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white">
            <button type="button" onClick={prevMonth} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
            <span className="text-sm font-black uppercase tracking-widest">{monthNames[month]} {year}</span>
            <button type="button" onClick={nextMonth} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><ChevronRight size={18} /></button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] font-black text-gray-400 text-center uppercase">{d.charAt(0)}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9" />
              ))}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const active = isSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelect(day)}
                    className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      active 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                    } ${today && !active ? 'ring-2 ring-indigo-200 text-indigo-700' : ''}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-1"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
