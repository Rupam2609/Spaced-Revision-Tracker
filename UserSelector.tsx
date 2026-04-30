import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Topic, TopicLink } from '../types';
import { getNextReviewDate, getTodayISO, isFutureDate } from '../utils/spacedRepetition';
import { Plus, X, Link as LinkIcon, Save, BookPlus, Tag, Calendar } from 'lucide-react';

interface TopicFormProps {
  onSave: (topic: Topic) => void;
  onCancel: () => void;
  editTopic?: Topic | null;
  categories: string[];
  onAddCategory: (cat: string) => void;
  subjects: string[];
  onAddSubject: (sub: string) => void;
}

export default function TopicForm({
  onSave,
  onCancel,
  editTopic,
  categories,
  onAddCategory,
  subjects,
  onAddSubject,
}: TopicFormProps) {
  const [title, setTitle] = useState(editTopic?.title || '');
  const [subject, setSubject] = useState(editTopic?.subject || '');
  const [category, setCategory] = useState(editTopic?.category || '');
  const [description, setDescription] = useState(editTopic?.description || '');
  const [dateStudied, setDateStudied] = useState(editTopic?.dateStudied || getTodayISO());
  const [links, setLinks] = useState<TopicLink[]>(
    editTopic?.links.length ? editTopic.links : [{ id: uuidv4(), label: '', url: '' }]
  );

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
    if (!title.trim()) return;

    const filteredLinks = links.filter(l => l.url.trim() !== '');
    const futureDate = isFutureDate(dateStudied);
    const currentInterval = editTopic?.currentInterval || 0;

    const topic: Topic = {
      id: editTopic?.id || uuidv4(),
      title: title.trim(),
      subject: subject.trim(),
      category: category.trim(),
      description: description.trim(),
      dateStudied,
      isFutureDate: futureDate,
      studied: editTopic?.studied ?? (futureDate ? null : true),
      links: filteredLinks,
      revisions: editTopic?.revisions || [],
      nextReviewDate: futureDate ? dateStudied : getNextReviewDate(dateStudied, currentInterval),
      currentInterval,
      isScheduled: futureDate,
      createdAt: editTopic?.createdAt || new Date().toISOString(),
    };

    onSave(topic);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <BookPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editTopic ? 'Edit Topic' : 'Add New Topic'}
              </h2>
              <p className="text-sm text-gray-500">
                {editTopic ? 'Update your study topic' : 'Track a new study topic for spaced revision'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Topic Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Binary Search Trees"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Subject
              </label>
              {!showNewSubject ? (
                <div className="flex gap-2">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900 bg-white"
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewSubject(true)}
                    className="px-4 py-3 rounded-xl border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors text-sm font-medium"
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
                    placeholder="New subject name..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddNewSubject(); }
                      if (e.key === 'Escape') setShowNewSubject(false);
                    }}
                  />
                  <button type="button" onClick={handleAddNewSubject} className="px-4 py-3 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600">Add</button>
                  <button type="button" onClick={() => setShowNewSubject(false)} className="p-3 rounded-xl text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                Category
              </label>
              {!showNewCategory ? (
                <div className="flex gap-2 flex-wrap">
                  {categories.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(category === c ? '' : c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        category === c
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    + Add Category
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g., Prelims, Mains, GS, Optional..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddNewCategory(); }
                      if (e.key === 'Escape') setShowNewCategory(false);
                    }}
                  />
                  <button type="button" onClick={handleAddNewCategory} className="px-4 py-3 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600">Add</button>
                  <button type="button" onClick={() => setShowNewCategory(false)} className="p-3 rounded-xl text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>

            {/* Date Studied / Scheduled Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Study Date
              </label>
              <input
                type="date"
                value={dateStudied}
                onChange={(e) => setDateStudied(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
              />
              {isFutureDate(dateStudied) && (
                <p className="mt-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                  📅 This will be scheduled for a future date — you'll mark it as studied when the day comes.
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key concepts, formulas, or notes about this topic..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Links */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Resource Links</label>
              <div className="space-y-3">
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
                        placeholder={`Label ${index + 1} (optional)`}
                        className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                        placeholder="https://..."
                        className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
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
                className="mt-3 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another link
              </button>
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
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editTopic ? 'Update Topic' : 'Save Topic'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
