import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ExamRecord, TopicLink } from '../types';
import { getTodayISO, calculateGrade } from '../utils/spacedRepetition';
import { Plus, X, Link as LinkIcon, Save, FileText, Tag, Calendar, Award } from 'lucide-react';

interface ExamFormProps {
  onSave: (exam: ExamRecord) => void;
  onCancel: () => void;
  editExam?: ExamRecord | null;
  categories: string[];
  onAddCategory: (cat: string) => void;
  subjects: string[];
  onAddSubject: (sub: string) => void;
}

export default function ExamForm({
  onSave,
  onCancel,
  editExam,
  categories,
  onAddCategory,
  subjects,
  onAddSubject,
}: ExamFormProps) {
  const [examName, setExamName] = useState(editExam?.examName || '');
  const [subject, setSubject] = useState(editExam?.subject || '');
  const [category, setCategory] = useState(editExam?.category || '');
  const [date, setDate] = useState(editExam?.date || getTodayISO());
  const [description, setDescription] = useState(editExam?.description || '');
  const [links, setLinks] = useState<TopicLink[]>(
    editExam?.links.length ? editExam.links : [{ id: uuidv4(), label: '', url: '' }]
  );
  const [maxMarks, setMaxMarks] = useState(editExam?.maxMarks?.toString() || '');
  const [obtainedMarks, setObtainedMarks] = useState(editExam?.obtainedMarks?.toString() || '');
  const [answerSheetText, setAnswerSheetText] = useState(editExam?.answerSheetText || '');

  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const addLink = () => setLinks([...links, { id: uuidv4(), label: '', url: '' }]);
  const removeLink = (id: string) => {
    if (links.length > 1) setLinks(links.filter(l => l.id !== id));
  };
  const updateLink = (id: string, field: 'label' | 'url', value: string) => {
    setLinks(links.map(l => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const handleAddNewSubject = () => {
    if (!newSubject.trim()) return;
    onAddSubject(newSubject.trim());
    setSubject(newSubject.trim());
    setNewSubject('');
    setShowNewSubject(false);
  };

  const handleAddNewCategory = () => {
    if (!newCategory.trim()) return;
    onAddCategory(newCategory.trim());
    setCategory(newCategory.trim());
    setNewCategory('');
    setShowNewCategory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) return;

    const filteredLinks = links.filter(l => l.url.trim() !== '');
    const max = parseFloat(maxMarks) || 100;
    const obtained = parseFloat(obtainedMarks) || 0;
    const percentage = max > 0 ? Math.round((obtained / max) * 100) : 0;

    const exam: ExamRecord = {
      id: editExam?.id || uuidv4(),
      examName: examName.trim(),
      subject: subject.trim(),
      category: category.trim(),
      date,
      description: description.trim(),
      links: filteredLinks,
      maxMarks: max,
      obtainedMarks: obtained,
      percentage,
      grade: calculateGrade(percentage),
      answerSheetText: answerSheetText.trim(),
      attachments: editExam?.attachments || [],
      aiFeedback: editExam?.aiFeedback || '',
      aiLoading: false,
      createdAt: editExam?.createdAt || new Date().toISOString(),
    };

    onSave(exam);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 p-2.5 rounded-xl">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editExam ? 'Edit Exam' : 'Add Exam Record'}
              </h2>
              <p className="text-sm text-gray-500">
                Track your test scores and get AI feedback
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Exam Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Exam Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g., UPSC Prelims Mock Test 2024"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Subject & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                {!showNewSubject ? (
                  <div className="flex gap-2">
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 bg-white"
                    >
                      <option value="">Select subject...</option>
                      {subjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewSubject(true)}
                      className="px-4 py-3 rounded-xl border border-dashed border-amber-300 text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="New subject..."
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddNewSubject(); }
                        if (e.key === 'Escape') setShowNewSubject(false);
                      }}
                    />
                    <button type="button" onClick={handleAddNewSubject} className="px-4 py-3 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">Add</button>
                    <button type="button" onClick={() => setShowNewSubject(false)} className="p-3 rounded-xl text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <Tag className="w-3.5 h-3.5 inline mr-1" /> Category
                </label>
                {!showNewCategory ? (
                  <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(category === c ? '' : c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          category === c
                            ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-amber-300 text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="New category..."
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddNewCategory(); }
                        if (e.key === 'Escape') setShowNewCategory(false);
                      }}
                    />
                    <button type="button" onClick={handleAddNewCategory} className="px-4 py-3 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">Add</button>
                    <button type="button" onClick={() => setShowNewCategory(false)} className="p-3 rounded-xl text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" /> Exam Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900"
              />
            </div>

            {/* Marks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <Award className="w-3.5 h-3.5 inline mr-1" /> Max Marks
                </label>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  placeholder="100"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <Award className="w-3.5 h-3.5 inline mr-1" /> Obtained Marks
                </label>
                <input
                  type="number"
                  value={obtainedMarks}
                  onChange={(e) => setObtainedMarks(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Exam Details / Notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Topics covered, difficulty level, time taken..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Links */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Resource Links</label>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={link.id} className="flex items-start gap-2">
                    <div className="bg-gray-50 p-2.5 rounded-xl mt-0.5">
                      <LinkIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                        placeholder={`Label ${index + 1}`}
                        className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                        placeholder="https://..."
                        className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLink(link.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addLink}
                className="mt-2 flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another link
              </button>
            </div>

            {/* Answer Sheet / AI Feedback Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Answer Sheet / AI Analysis
              </label>
              <textarea
                value={answerSheetText}
                onChange={(e) => setAnswerSheetText(e.target.value)}
                placeholder="Paste your answer text here for AI analysis, or describe your answers for feedback..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                💡 Paste your answer sheet content here. After saving, you can use AI to analyze and get improvement suggestions.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editExam ? 'Update Exam' : 'Save Exam'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
