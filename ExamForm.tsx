import { BookOpen, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="text-center py-16 sm:py-24">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-3xl mb-6">
        <BookOpen className="w-10 h-10 text-indigo-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No topics yet</h3>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
        Start tracking your study topics and let spaced repetition boost your memory retention.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
      >
        <Plus className="w-5 h-5" />
        Add Your First Topic
      </button>
    </div>
  );
}
