import { Topic } from '../types';
import { getReviewStatus } from '../utils/spacedRepetition';
import { BookOpen, AlertTriangle, Clock, Trophy, CalendarCheck, XCircle } from 'lucide-react';

interface StatsBarProps {
  topics: Topic[];
}

export default function StatsBar({ topics }: StatsBarProps) {
  const scheduled = topics.filter(t => getReviewStatus(t.nextReviewDate, t.studied, t.isScheduled) === 'scheduled').length;
  const notStudied = topics.filter(t => getReviewStatus(t.nextReviewDate, t.studied, t.isScheduled) === 'not-studied').length;
  const overdue = topics.filter(t => getReviewStatus(t.nextReviewDate, t.studied, t.isScheduled) === 'overdue').length;
  const dueToday = topics.filter(t => getReviewStatus(t.nextReviewDate, t.studied, t.isScheduled) === 'due-today').length;
  const upcoming = topics.filter(t => getReviewStatus(t.nextReviewDate, t.studied, t.isScheduled) === 'upcoming').length;
  const mastered = topics.filter(t => t.currentInterval >= 7).length;

  const stats = [
    { label: 'Total Topics', value: topics.length, icon: BookOpen, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: 'Scheduled', value: scheduled, icon: CalendarCheck, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-700' },
    { label: 'Not Studied', value: notStudied, icon: XCircle, gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50', text: 'text-orange-700' },
    { label: 'Overdue', value: overdue, icon: AlertTriangle, gradient: 'from-red-500 to-red-600', bg: 'bg-red-50', text: 'text-red-700' },
    { label: 'Due Today', value: dueToday, icon: Clock, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    { label: 'Upcoming', value: upcoming, icon: Clock, gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Mastered', value: mastered, icon: Trophy, gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', text: 'text-purple-700' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className={`${stat.bg} p-2 rounded-xl`}>
              <stat.icon className={`w-4 h-4 ${stat.text}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-[10px] font-medium text-gray-500">{stat.label}</p>
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
        </div>
      ))}
    </div>
  );
}
