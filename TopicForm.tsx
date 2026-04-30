import { useState } from 'react';
import { Topic } from '../types';
import { INTERVALS, getIntervalLabel } from '../utils/spacedRepetition';
import { X, Edit3, RotateCcw, Check, Clock, Calendar } from 'lucide-react';

interface RevisionModalProps {
  topic: Topic;
  onEdit: (topicId: string, newDate: string) => void;
  onCancelRevision: (topicId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function RevisionModal({
  topic,
  onEdit,
  onCancelRevision,
  onConfirm,
  onClose,
}: RevisionModalProps) {
  const [mode, setMode] = useState<'confirm' | 'edit' | 'cancel'>('confirm');
  const [editDate, setEditDate] = useState(
    topic.revisions.length > 0
      ? topic.revisions[topic.revisions.length - 1].date
      : new Date().toISOString().split('T')[0]
  );

  const currentLevel = topic.currentInterval + 1;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleEdit = () => {
    onEdit(topic.id, editDate);
    onClose();
  };

  const handleCancelRevision = () => {
    onCancelRevision(topic.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2.5 rounded-xl">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Revision Complete</h2>
                <p className="text-sm text-gray-500">What would you like to do?</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Topic info */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 mb-5">
            <h3 className="font-semibold text-gray-900">{topic.title}</h3>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Level {currentLevel}/{INTERVALS.length}
              </span>
              <span>•</span>
              <span>Next: {getIntervalLabel(topic.currentInterval)} later</span>
            </div>
          </div>

          {mode === 'confirm' && (
            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <Check className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Confirm Revision</div>
                  <div className="text-xs text-emerald-600">Accept and move to next level</div>
                </div>
              </button>

              <button
                onClick={() => setMode('edit')}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Edit3 className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Edit Revision Date</div>
                  <div className="text-xs text-blue-600">Change when this revision was done</div>
                </div>
              </button>

              {topic.revisions.length > 0 && (
                <button
                  onClick={() => setMode('cancel')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 hover:bg-red-100 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Cancel This Revision</div>
                    <div className="text-xs text-red-600">Undo and go back to previous level</div>
                  </div>
                </button>
              )}
            </div>
          )}

          {mode === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Revision Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('confirm')}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleEdit}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {mode === 'cancel' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ Cancel Revision?</h4>
                <p className="text-sm text-red-700">
                  This will undo the revision and go back to the previous level. 
                  The revision history will be updated.
                </p>
                {topic.revisions.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    Current: Level {topic.currentInterval + 1} → Will return to: Level {topic.currentInterval}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('confirm')}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Keep Revision
                </button>
                <button
                  onClick={handleCancelRevision}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Cancel Revision
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
