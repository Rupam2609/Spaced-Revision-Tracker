import { useState } from 'react';
import { ExamRecord, FileAttachment } from '../types';
import { formatDate, getGradeColor } from '../utils/spacedRepetition';
import {
  Edit3,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  Calendar,
  Tag,
  Sparkles,
} from 'lucide-react';
import AIFeedback from './AIFeedback';

interface ExamRowProps {
  exam: ExamRecord;
  onEdit: (exam: ExamRecord) => void;
  onDelete: (id: string) => void;
  onUpdateFeedback: (id: string, feedback: string) => void;
  onUpdateAttachments: (id: string, attachments: FileAttachment[]) => void;
}

export default function ExamRow({ exam, onEdit, onDelete, onUpdateFeedback, onUpdateAttachments }: ExamRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-4 ${
      exam.percentage >= 70 ? 'border-l-emerald-400' :
      exam.percentage >= 50 ? 'border-l-amber-400' : 'border-l-red-400'
    }`}>
      {/* Main Row */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {exam.examName}
              </h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${getGradeColor(exam.grade)}`}>
                {exam.grade}
              </span>
            </div>

            {/* Subject + Category badges */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {exam.subject && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium">
                  {exam.subject}
                </span>
              )}
              {exam.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                  <Tag className="w-3 h-3" />
                  {exam.category}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-3 sm:gap-4 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(exam.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                {exam.obtainedMarks}/{exam.maxMarks} marks
              </span>
              <span>•</span>
              <span className="font-semibold text-gray-700">{exam.percentage}%</span>
            </div>

            {/* Score bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    exam.percentage >= 70
                      ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                      : exam.percentage >= 50
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                      : 'bg-gradient-to-r from-red-400 to-red-500'
                  }`}
                  style={{ width: `${exam.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => onEdit(exam)}
              className="p-2 sm:p-2.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Edit"
            >
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => onDelete(exam.id)}
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
            {/* Description */}
            {exam.description && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Details</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{exam.description}</p>
              </div>
            )}

            {/* Links */}
            {exam.links.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resources</h4>
                <div className="flex flex-wrap gap-2">
                  {exam.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {link.label || link.url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* AI Feedback Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                AI Answer Analysis
              </h4>
              <AIFeedback
                examName={exam.examName}
                subject={exam.subject}
                answerText={exam.answerSheetText}
                attachments={exam.attachments || []}
                existingFeedback={exam.aiFeedback}
                onFeedbackUpdate={(fb) => onUpdateFeedback(exam.id, fb)}
                onAttachmentsUpdate={(att) => onUpdateAttachments(exam.id, att)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
