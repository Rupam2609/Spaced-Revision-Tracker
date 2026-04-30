import { useState, useMemo } from 'react';
import { ExamRecord } from '../types';
import { ChevronLeft, ChevronRight, Award } from 'lucide-react';

interface ExamCalendarProps {
  exams: ExamRecord[];
  onExamClick: (exam: ExamRecord) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ExamCalendar({ exams, onExamClick }: ExamCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const dateMap = useMemo(() => {
    const map: Record<string, ExamRecord[]> = {};
    exams.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [exams]);

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const formatDay = (day: number): string => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (day: number) => {
    return day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-gray-900">
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-2 sm:p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[70px] sm:min-h-[100px] p-1 rounded-xl bg-gray-50/50" />;
            }

            const dayKey = formatDay(day);
            const dayExams = dateMap[dayKey] || [];
            const todayCell = isToday(day);
            const hasActivity = dayExams.length > 0;

            return (
              <div
                key={day}
                className={`min-h-[70px] sm:min-h-[100px] p-1 sm:p-2 rounded-xl border transition-all ${
                  todayCell
                    ? 'border-amber-400 bg-amber-50 shadow-sm'
                    : hasActivity
                    ? 'border-gray-200 bg-white hover:bg-gray-50'
                    : 'border-gray-100 bg-gray-50/50'
                }`}
              >
                <div className={`text-xs sm:text-sm font-semibold mb-1 ${
                  todayCell ? 'text-amber-600' : hasActivity ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {day}
                </div>

                <div className="space-y-0.5">
                  {dayExams.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      onClick={() => onExamClick(e)}
                      className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate cursor-pointer ${
                        e.percentage >= 70
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : e.percentage >= 50
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      title={`${e.examName}: ${e.percentage}%`}
                    >
                      <Award className="w-2.5 h-2.5 inline mr-0.5" />
                      {e.examName}
                    </div>
                  ))}
                  {dayExams.length > 2 && (
                    <div className="text-[9px] text-gray-500 font-medium px-1">
                      +{dayExams.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-100 flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-200" />
          <span className="text-xs text-gray-500">≥70% Score</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-200" />
          <span className="text-xs text-gray-500">50-69% Score</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-200" />
          <span className="text-xs text-gray-500">&lt;50% Score</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-amber-400 bg-amber-50" />
          <span className="text-xs text-gray-500">Today</span>
        </div>
      </div>
    </div>
  );
}
