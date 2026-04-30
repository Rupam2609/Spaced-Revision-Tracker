import { useState, useMemo } from 'react';
import { Topic } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  topics: Topic[];
  onTopicClick: (topic: Topic) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarView({ topics, onTopicClick }: CalendarViewProps) {
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

  // Build date-to-topics mapping
  const dateMap = useMemo(() => {
    const map: Record<string, { studied: Topic[]; scheduled: Topic[]; revision: Topic[] }> = {};
    const add = (date: string, type: 'studied' | 'scheduled' | 'revision', topic: Topic) => {
      if (!map[date]) map[date] = { studied: [], scheduled: [], revision: [] };
      map[date][type].push(topic);
    };

    topics.forEach((t) => {
      // Study date
      add(t.dateStudied, t.isScheduled ? 'scheduled' : 'studied', t);

      // Next review date
      if (!t.isScheduled) {
        add(t.nextReviewDate, 'revision', t);
      }

      // Revision history
      t.revisions.forEach((r) => {
        add(r.date, 'revision', t);
      });
    });

    return map;
  }, [topics]);

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

  const getDayData = (day: number) => {
    return dateMap[formatDay(day)] || { studied: [], scheduled: [], revision: [] };
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
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[70px] sm:min-h-[100px] p-1 rounded-xl bg-gray-50/50" />;
            }

            const data = getDayData(day);
            const todayCell = isToday(day);
            const hasActivity = data.studied.length + data.scheduled.length + data.revision.length > 0;

            return (
              <div
                key={day}
                className={`min-h-[70px] sm:min-h-[100px] p-1 sm:p-2 rounded-xl border transition-all ${
                  todayCell
                    ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                    : hasActivity
                    ? 'border-gray-200 bg-white hover:bg-gray-50'
                    : 'border-gray-100 bg-gray-50/50'
                }`}
              >
                <div className={`text-xs sm:text-sm font-semibold mb-1 ${
                  todayCell ? 'text-indigo-600' : hasActivity ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {day}
                </div>

                {/* Indicators */}
                <div className="space-y-0.5">
                  {data.studied.slice(0, 2).map((t) => (
                    <div
                      key={`s-${t.id}`}
                      onClick={() => onTopicClick(t)}
                      className="text-[9px] sm:text-[10px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 truncate cursor-pointer hover:bg-blue-200"
                      title={`Studied: ${t.title}`}
                    >
                      📖 {t.title}
                    </div>
                  ))}
                  {data.scheduled.slice(0, 2).map((t) => (
                    <div
                      key={`sc-${t.id}`}
                      onClick={() => onTopicClick(t)}
                      className="text-[9px] sm:text-[10px] px-1 py-0.5 rounded bg-violet-100 text-violet-700 truncate cursor-pointer hover:bg-violet-200"
                      title={`Scheduled: ${t.title}`}
                    >
                      📅 {t.title}
                    </div>
                  ))}
                  {data.revision.slice(0, 2).map((t) => (
                    <div
                      key={`r-${t.id}`}
                      onClick={() => onTopicClick(t)}
                      className="text-[9px] sm:text-[10px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 truncate cursor-pointer hover:bg-emerald-200"
                      title={`Revision: ${t.title}`}
                    >
                      🔄 {t.title}
                    </div>
                  ))}
                  {(() => {
                    const total = data.studied.length + data.scheduled.length + data.revision.length;
                    if (total > 2) {
                      return (
                        <div className="text-[9px] text-gray-500 font-medium px-1">
                          +{total - 2} more
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-100 flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-200" />
          <span className="text-xs text-gray-500">Studied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-violet-200" />
          <span className="text-xs text-gray-500">Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-200" />
          <span className="text-xs text-gray-500">Revision</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-indigo-400 bg-indigo-50" />
          <span className="text-xs text-gray-500">Today</span>
        </div>
      </div>
    </div>
  );
}
