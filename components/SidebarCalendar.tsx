
import React, { useState } from 'react';
import { Ticket } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';

interface SidebarCalendarProps {
  tickets: Ticket[];
  onViewDetail: (ticket: Ticket) => void;
}

export const SidebarCalendar: React.FC<SidebarCalendarProps> = ({ tickets, onViewDetail }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Find tickets for the current month/year
  const getTicketsForDate = (day: number) => {
    return tickets.filter(t => {
      if (!t.readyDate) return false;
      const tDate = new Date(t.readyDate);
      return tDate.getDate() === day && 
             tDate.getMonth() === month && 
             tDate.getFullYear() === year;
    });
  };

  const selectedDateTickets = getTicketsForDate(selectedDay);

  return (
    <div className="mt-4 px-3 select-none">
      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Calendar Header */}
        <div className="bg-indigo-600 px-3 py-2 flex items-center justify-between text-white">
          <button onClick={prevMonth} className="hover:bg-white/20 p-1 rounded transition-colors"><ChevronLeft size={14} /></button>
          <span className="text-[10px] font-black uppercase tracking-widest">{monthNames[month]} {year}</span>
          <button onClick={nextMonth} className="hover:bg-white/20 p-1 rounded transition-colors"><ChevronRight size={14} /></button>
        </div>

        {/* Calendar Grid */}
        <div className="p-2">
          <div className="grid grid-cols-7 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-[8px] font-black text-slate-400 text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded overflow-hidden">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white h-6" />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const hasTickets = getTicketsForDate(day).length > 0;
              const isSelected = selectedDay === day;
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              return (
                <div 
                  key={day} 
                  onClick={() => setSelectedDay(day)}
                  className={`h-7 flex items-center justify-center text-[10px] font-bold cursor-pointer relative transition-all ${
                    isSelected ? 'bg-indigo-600 text-white z-10' : 'bg-white text-slate-600 hover:bg-indigo-50'
                  } ${isToday && !isSelected ? 'text-indigo-600 ring-1 ring-inset ring-indigo-200' : ''}`}
                >
                  {day}
                  {hasTickets && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Request List for Selected Day */}
        <div className="border-t border-slate-200 max-h-32 overflow-y-auto bg-white">
          {selectedDateTickets.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {selectedDateTickets.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => onViewDetail(t)}
                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold text-slate-800 truncate group-hover:text-indigo-600">{t.appName}</p>
                    <ExternalLink size={10} className="text-slate-300 group-hover:text-indigo-400 flex-shrink-0" />
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 group-hover:text-slate-500">{t.id}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-center">
              <p className="text-[9px] font-medium text-slate-400 italic">No new requests for this day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
