import { Topic } from '../types';
import {
  getReviewStatus,
  getDaysUntilReview,
  getIntervalLabel,
  getProgressPercentage,
  formatDate,
  INTERVALS,
} from '../utils/spacedRepetition';
import {
  CheckCircle2,
  Edit3,
  Trash2,
  ExternalLink,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  XCircle,
  Calendar,
  Clock,
  Tag,
} from 'lucide-react';
import { useState } from 'react';

interface TopicRowProps {
  topic: Topic;
  onMarkRevised: (id: string) => void;
  onMarkStudied: (id: string, studied: boolean) => void;
  onEdit: (topic: Topic) => void;
  onDelete: (id: string) => void;
}

export default function TopicRow({ topic, onMarkRevised, onMarkStudied, onEdit, onDelete }: TopicRowProps) {
  const [expanded, setExpanded] = useState(false);
  const status = getReviewStatus(topic.nextReviewDate, topic.studied, topic.isScheduled);
  const daysUntil = getDaysUntilReview(topic.nextReviewDate);
  const progress = getProgressPercentage(topic.currentInterval);

  const statusConfig: Record<string, { badge: string; label: string; dot: string; row: string }> = {
    scheduled: {
      badge: 'bg-violet-100 text-violet-700 border-violet-200',
      label: 'Scheduled',
      dot: 'bg-violet-500',
      row: 'border-l-violet-400',
    },
    'not-studied': {
      badge: 'bg-orange-100 text-orange-700 border-orange-200',
      label: 'Not studied — moved to tomorrow',
      dot: 'bg-orange-500',
      row: 'border-l-orange-400',
    },
    overdue: {
      badge: 'bg-red-100 text-red-700 border-red-200',
      label: `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`,
      dot: 'bg-red-500',
      row: 'border-l-red-400',
    },
    'due-today': {
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      label: 'Due today',
      dot: 'bg-amber-500',
      row: 'border-l-amber-400',
    },
    upcoming: {
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      label: `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
      dot: 'bg-emerald-500',
      row: 'border-l-emerald-400',
    },
    mastered: {
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
      label: 'Mastered',
      dot: 'bg-purple-500',
      row: 'border-l-purple-400',
    },
  };

  const config = statusConfig[status] || statusConfig['upcoming'];

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-4 ${config.row}`}>
      {/* Main Row */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {topic.title}
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
                {config.label}
              </span>
            </div>

            {/* Subject + Category badges */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {topic.subject && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium">
                  {topic.subject}
                </span>
              )}
              {topic.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                  <Tag className="w-3 h-3" />
                  {topic.category}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-3 sm:gap-4 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Studied: {formatDate(topic.dateStudied)}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Next: {formatDate(topic.nextReviewDate)}
              </span>
              <span className="hidden sm:inline">•</span>
              <span>Level: {getIntervalLabel(topic.currentInterval)}</span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500 w-12 text-right">
                {topic.currentInterval}/{INTERVALS.length}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Study YES/NO buttons for scheduled & not-studied topics */}
            {status === 'scheduled' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onMarkStudied(topic.id, true)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-semibold transition-colors flex items-center gap-1"
                  title="Mark as studied"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yes</span>
                </button>
                <button
                  onClick={() => onMarkStudied(topic.id, false)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors flex items-center gap-1"
                  title="Not studied — postpone"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">No</span>
                </button>
              </div>
            )}

            {/* Overdue / Due Today — Mark revised */}
            {(status === 'overdue' || status === 'due-today') && (
              <button
                onClick={() => onMarkRevised(topic.id)}
                className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                title="Mark as revised"
              >
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Upcoming — Revise early */}
            {status === 'upcoming' && (
              <button
                onClick={() => onMarkRevised(topic.id)}
                className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                title="Revise early"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            <button
              onClick={() => onEdit(topic)}
              className="p-2 sm:p-2.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Edit"
            >
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => onDelete(topic.id)}
              className="p-2 sm:p-2.5 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 sm:p-2.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-gray-50">
          <div className="pt-4 space-y-4">
            {topic.description && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{topic.description}</p>
              </div>
            )}

            {topic.links.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resources</h4>
                <div className="flex flex-wrap gap-2">
                  {topic.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {link.label || link.url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {topic.revisions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Revision History</h4>
                <div className="flex flex-wrap gap-2">
                  {topic.revisions.map((rev, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        rev.studied
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      #{i + 1} — {formatDate(rev.date)} {rev.studied ? '✓' : '✗'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
