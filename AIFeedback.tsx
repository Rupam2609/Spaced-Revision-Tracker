import { useState, useMemo, useEffect, useCallback } from 'react';
import { Topic, UserProfile, ExamRecord, FilterMode, SortMode, ViewMode, TabMode } from './types';
import {
  getNextReviewDate,
  getReviewStatus,
  getDaysUntilReview,
  postponeToNextDay,
  getTodayISO,
  cancelEarlyRevision,
  editRevisionDate,
} from './utils/spacedRepetition';
import {
  getUsers,
  setUsers,
  getActiveUserId,
  setActiveUserId,
  getUserData,
  setUserData,
} from './utils/storage';
import { getSession, signOut, AuthUser } from './utils/auth';
import StatsBar from './components/StatsBar';
import TopicForm from './components/TopicForm';
import TopicRow from './components/TopicRow';
import CalendarView from './components/CalendarView';
import ConfirmModal from './components/ConfirmModal';
import EmptyState from './components/EmptyState';
import UserSelector from './components/UserSelector';
import RevisionModal from './components/RevisionModal';
import ExamForm from './components/ExamForm';
import ExamRow from './components/ExamRow';
import ExamCalendar from './components/ExamCalendar';
import AuthPage from './components/AuthPage';
import ProfileSettings from './components/ProfileSettings';
import {
  Plus,
  Search,
  Filter,
  SortAsc,
  Brain,
  Sparkles,
  Download,
  Upload,
  CalendarDays,
  List,
  BookOpen,
  FileText,
  HelpCircle,
  X,
  ExternalLink,
  Settings,
} from 'lucide-react';

const DEFAULT_CATEGORIES = ['GS', 'Optional', 'Prelims', 'Mains', 'Essay'];
const DEFAULT_SUBJECTS: string[] = [];

export default function App() {
  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(getSession);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // User management
  const [users, setUsersState] = useState<UserProfile[]>(getUsers);
  const [activeUserId, setActiveUserIdState] = useState<string | null>(getActiveUserId);
  const [showUserSelector, setShowUserSelector] = useState(false);

  // Per-user data
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);

  // UI state
  const [activeTab, setActiveTab] = useState<TabMode>('topics');
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);
  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [editExam, setEditExam] = useState<ExamRecord | null>(null);
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null);
  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('nextReview');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [examViewMode, setExamViewMode] = useState<ViewMode>('list');
  const [showRevisionModal, setShowRevisionModal] = useState<Topic | null>(null);
  const [showPublishGuide, setShowPublishGuide] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Load user data
  useEffect(() => {
    if (activeUserId) {
      setTopics(getUserData<Topic[]>(activeUserId, 'topics', []));
      setExams(getUserData<ExamRecord[]>(activeUserId, 'exams', []));
      setCategories(getUserData<string[]>(activeUserId, 'categories', DEFAULT_CATEGORIES));
      setSubjects(getUserData<string[]>(activeUserId, 'subjects', DEFAULT_SUBJECTS));
    }
  }, [activeUserId]);

  // Auto-postpone
  useEffect(() => {
    if (!activeUserId || topics.length === 0) return;
    const today = getTodayISO();
    const updated = topics.map((t) => {
      if (t.isScheduled && t.studied === null && t.nextReviewDate < today) {
        return { ...t, nextReviewDate: postponeToNextDay(today) };
      }
      return t;
    });
    if (JSON.stringify(updated) !== JSON.stringify(topics)) {
      setTopics(updated);
    }
  }, [activeUserId]);

  // Persist helpers
  const persistTopics = useCallback((newTopics: Topic[]) => {
    setTopics(newTopics);
    if (activeUserId) setUserData(activeUserId, 'topics', newTopics);
  }, [activeUserId]);

  const persistExams = useCallback((newExams: ExamRecord[]) => {
    setExams(newExams);
    if (activeUserId) setUserData(activeUserId, 'exams', newExams);
  }, [activeUserId]);

  const persistCategories = useCallback((newCats: string[]) => {
    setCategories(newCats);
    if (activeUserId) setUserData(activeUserId, 'categories', newCats);
  }, [activeUserId]);

  const persistSubjects = useCallback((newSubs: string[]) => {
    setSubjects(newSubs);
    if (activeUserId) setUserData(activeUserId, 'subjects', newSubs);
  }, [activeUserId]);

  // User management
  const handleAddUser = (user: UserProfile) => {
    const newUsers = [...users, user];
    setUsersState(newUsers);
    setUsers(newUsers);
    setActiveUserIdState(user.id);
    setActiveUserId(user.id);
  };

  const handleDeleteUser = (userId: string) => {
    if (users.length <= 1) return;
    const newUsers = users.filter((u) => u.id !== userId);
    setUsersState(newUsers);
    setUsers(newUsers);
    if (activeUserId === userId) {
      setActiveUserIdState(newUsers[0].id);
      setActiveUserId(newUsers[0].id);
    }
  };

  const handleRenameUser = (userId: string, name: string) => {
    const newUsers = users.map((u) => u.id === userId ? { ...u, name } : u);
    setUsersState(newUsers);
    setUsers(newUsers);
  };

  const handleSelectUser = (userId: string) => {
    setActiveUserIdState(userId);
    setActiveUserId(userId);
    setShowUserSelector(false);
  };

  // Topic handlers
  const handleSaveTopic = (topic: Topic) => {
    const exists = topics.find((t) => t.id === topic.id);
    persistTopics(exists ? topics.map((t) => (t.id === topic.id ? topic : t)) : [topic, ...topics]);
    setShowTopicForm(false);
    setEditTopic(null);
  };

  const handleMarkStudied = (id: string, studied: boolean) => {
    persistTopics(topics.map((t) => {
      if (t.id !== id) return t;
      if (studied) {
        return {
          ...t, studied: true, isScheduled: false, currentInterval: 0,
          nextReviewDate: getNextReviewDate(getTodayISO(), 0),
          revisions: [...t.revisions, { date: getTodayISO(), studied: true, interval: 0 }],
        };
      } else {
        return {
          ...t, studied: false,
          nextReviewDate: postponeToNextDay(t.nextReviewDate),
          revisions: [...t.revisions, { date: getTodayISO(), studied: false, interval: t.currentInterval }],
        };
      }
    }));
  };

  const handleMarkRevised = (id: string) => {
    const topic = topics.find((t) => t.id === id);
    if (topic) {
      setShowRevisionModal(topic);
    }
  };

  const handleConfirmRevision = () => {
    if (!showRevisionModal) return;
    persistTopics(topics.map((t) => {
      if (t.id !== showRevisionModal.id) return t;
      const newInterval = t.currentInterval + 1;
      return {
        ...t, currentInterval: newInterval, studied: true, isScheduled: false,
        nextReviewDate: getNextReviewDate(getTodayISO(), newInterval),
        revisions: [...t.revisions, { date: getTodayISO(), studied: true, interval: newInterval }],
      };
    }));
    setShowRevisionModal(null);
  };

  const handleEditRevisionDate = (topicId: string, newDate: string) => {
    persistTopics(topics.map((t) => {
      if (t.id !== topicId) return t;
      return editRevisionDate(t, newDate);
    }));
    setShowRevisionModal(null);
  };

  const handleCancelRevision = (topicId: string) => {
    persistTopics(topics.map((t) => {
      if (t.id !== topicId) return t;
      return cancelEarlyRevision(t);
    }));
    setShowRevisionModal(null);
  };

  const handleDeleteTopic = () => {
    if (deleteTopicId) {
      persistTopics(topics.filter((t) => t.id !== deleteTopicId));
      setDeleteTopicId(null);
    }
  };

  const handleEditTopic = (topic: Topic) => {
    setEditTopic(topic);
    setShowTopicForm(true);
  };

  // Exam handlers
  const handleSaveExam = (exam: ExamRecord) => {
    const exists = exams.find((e) => e.id === exam.id);
    persistExams(exists ? exams.map((e) => (e.id === exam.id ? exam : e)) : [exam, ...exams]);
    setShowExamForm(false);
    setEditExam(null);
  };

  const handleDeleteExam = () => {
    if (deleteExamId) {
      persistExams(exams.filter((e) => e.id !== deleteExamId));
      setDeleteExamId(null);
    }
  };

  const handleEditExam = (exam: ExamRecord) => {
    setEditExam(exam);
    setShowExamForm(true);
  };

  const handleUpdateExamFeedback = (id: string, feedback: string) => {
    persistExams(exams.map((e) => (e.id === id ? { ...e, aiFeedback: feedback } : e)));
  };

  const handleUpdateExamAttachments = (id: string, attachments: any[]) => {
    persistExams(exams.map((e) => (e.id === id ? { ...e, attachments } : e)));
  };

  // Category / Subject handlers
  const handleAddCategory = (cat: string) => {
    if (!categories.includes(cat)) persistCategories([...categories, cat]);
  };

  const handleAddSubject = (sub: string) => {
    if (!subjects.includes(sub)) persistSubjects([...subjects, sub]);
  };

  // Export / Import
  const handleExport = () => {
    const data = {
      user: users.find((u) => u.id === activeUserId),
      topics, exams, categories, subjects,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spacerev-${users.find(u => u.id === activeUserId)?.name || 'export'}-${getTodayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.topics) persistTopics(data.topics);
          if (data.exams) persistExams(data.exams);
          if (data.categories) persistCategories(data.categories);
          if (data.subjects) persistSubjects(data.subjects);
        } catch { alert('Invalid file format'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Filtered topics
  const filteredTopics = useMemo(() => {
    let result = [...topics];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }
    if (filterMode === 'due') {
      result = result.filter(t => {
        const s = getReviewStatus(t.nextReviewDate, t.studied, t.isScheduled);
        return s === 'overdue' || s === 'due-today';
      });
    } else if (filterMode === 'upcoming') {
      result = result.filter(t => getReviewStatus(t.nextReviewDate, t.studied, t.isScheduled) === 'upcoming');
    } else if (filterMode === 'scheduled') {
      result = result.filter(t => t.isScheduled);
    } else if (filterMode === 'mastered') {
      result = result.filter(t => t.currentInterval >= 7);
    }
    if (sortMode === 'nextReview') {
      result.sort((a, b) => getDaysUntilReview(a.nextReviewDate) - getDaysUntilReview(b.nextReviewDate));
    } else if (sortMode === 'dateStudied') {
      result.sort((a, b) => new Date(b.dateStudied).getTime() - new Date(a.dateStudied).getTime());
    } else if (sortMode === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [topics, searchQuery, filterMode, sortMode, categoryFilter]);

  // Filtered exams
  const filteredExams = useMemo(() => {
    let result = [...exams];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.examName.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter);
    }
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }, [exams, searchQuery, categoryFilter]);

  const filters: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'due', label: 'Due / Overdue' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'mastered', label: 'Mastered' },
  ];

  const activeUser = users.find((u) => u.id === activeUserId);

  // Auth gate - show login page if not authenticated
  if (!authUser) {
    return <AuthPage onAuth={(user) => {
      setAuthUser(user);
      // Auto-create user profile if needed
      const existingUsers = getUsers();
      if (!existingUsers.find(u => u.id === user.id)) {
        const newUser: UserProfile = {
          id: user.id,
          name: user.displayName,
          avatar: user.avatar,
          createdAt: user.createdAt,
        };
        const updatedUsers = [...existingUsers, newUser];
        setUsersState(updatedUsers);
        setUsers(updatedUsers);
        setActiveUserIdState(user.id);
        setActiveUserId(user.id);
      } else {
        setActiveUserIdState(user.id);
        setActiveUserId(user.id);
      }
    }} />;
  }

  if (!activeUserId || !activeUser) {
    return (
      <UserSelector
        users={users}
        activeUserId={activeUserId}
        onSelect={handleSelectUser}
        onAdd={handleAddUser}
        onDelete={handleDeleteUser}
        onRename={handleRenameUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  Space<span className="text-indigo-600">Rev</span>
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Revision & Exam Tracker</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProfileSettings(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                <span className="text-lg">{authUser.avatar}</span>
                <span className="text-sm font-semibold text-gray-700 hidden sm:inline">{authUser.displayName}</span>
                <Settings className="w-4 h-4 text-gray-400 sm:hidden" />
              </button>

              <div className="h-6 w-px bg-gray-200 hidden sm:block" />

              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => activeTab === 'topics' ? setViewMode('list') : setExamViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    (activeTab === 'topics' ? viewMode : examViewMode) === 'list'
                      ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => activeTab === 'topics' ? setViewMode('calendar') : setExamViewMode('calendar')}
                  className={`p-2 rounded-lg transition-colors ${
                    (activeTab === 'topics' ? viewMode : examViewMode) === 'calendar'
                      ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
              </div>

              <button onClick={handleImport} className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Import">
                <Upload className="w-5 h-5" />
              </button>
              <button onClick={handleExport} className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Export">
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowPublishGuide(true)}
                className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="How to publish"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'topics') { setEditTopic(null); setShowTopicForm(true); }
                  else { setEditExam(null); setShowExamForm(true); }
                }}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add {activeTab === 'topics' ? 'Topic' : 'Exam'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('topics')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'topics'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Topics ({topics.length})
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'exams'
                ? 'bg-amber-100 text-amber-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Exams ({exams.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        {activeTab === 'topics' && topics.length > 0 && <StatsBar topics={topics} />}

        {/* Search */}
        {((activeTab === 'topics' && topics.length > 0) || (activeTab === 'exams' && exams.length > 0)) && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 shadow-sm"
            />
          </div>
        )}

        {/* Category Filter Chips */}
        {((activeTab === 'topics' && topics.length > 0) || (activeTab === 'exams' && exams.length > 0)) && categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                categoryFilter === 'all'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => {
              const topicCount = topics.filter((t) => t.category === cat).length;
              const examCount = exams.filter((e) => e.category === cat).length;
              const count = activeTab === 'topics' ? topicCount : examCount;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                    categoryFilter === cat
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                  {count > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      categoryFilter === cat ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Topics Tab Filters */}
        {activeTab === 'topics' && topics.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterMode(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filterMode === f.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border-0 outline-none cursor-pointer"
              >
                <option value="nextReview">Next Review</option>
                <option value="dateStudied">Date Studied</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        )}

        {/* TOPICS TAB */}
        {activeTab === 'topics' && (
          <>
            {viewMode === 'calendar' && (
              <CalendarView topics={topics} onTopicClick={() => setViewMode('list')} />
            )}
            {viewMode === 'list' && (
              <>
                {topics.length === 0 ? (
                  <EmptyState onAdd={() => { setEditTopic(null); setShowTopicForm(true); }} />
                ) : filteredTopics.length === 0 ? (
                  <div className="text-center py-12"><p className="text-gray-500">No topics match your filters.</p></div>
                ) : (
                  <div className="space-y-3">
                    {filteredTopics.map((topic) => (
                      <TopicRow
                        key={topic.id}
                        topic={topic}
                        onMarkRevised={handleMarkRevised}
                        onMarkStudied={handleMarkStudied}
                        onEdit={handleEditTopic}
                        onDelete={(id) => setDeleteTopicId(id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* EXAMS TAB */}
        {activeTab === 'exams' && (
          <>
            {examViewMode === 'calendar' && (
              <ExamCalendar exams={exams} onExamClick={() => setExamViewMode('list')} />
            )}
            {examViewMode === 'list' && (
              <>
                {exams.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-50 rounded-3xl mb-6">
                      <FileText className="w-10 h-10 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No exams yet</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                      Start tracking your test scores and get AI-powered feedback on your answers.
                    </p>
                    <button
                      onClick={() => { setEditExam(null); setShowExamForm(true); }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Add Your First Exam
                    </button>
                  </div>
                ) : filteredExams.length === 0 ? (
                  <div className="text-center py-12"><p className="text-gray-500">No exams match your search.</p></div>
                ) : (
                  <div className="space-y-3">
                    {filteredExams.map((exam) => (
                      <ExamRow
                        key={exam.id}
                        exam={exam}
                        onEdit={handleEditExam}
                        onDelete={(id) => setDeleteExamId(id)}
                        onUpdateFeedback={handleUpdateExamFeedback}
                        onUpdateAttachments={handleUpdateExamAttachments}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Info panel */}
        {activeTab === 'topics' && topics.length > 0 && (
          <div className="bg-white/80 rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              How Spaced Repetition Works
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {[1, 3, 7, 14, 30, 60, 120].map((days, i) => (
                <div key={days} className="text-center p-2 rounded-xl bg-gradient-to-b from-indigo-50 to-purple-50">
                  <div className="text-xs font-bold text-indigo-600">L{i + 1}</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">
                    {days < 30 ? `${days}d` : `${Math.round(days / 30)}mo`}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Mark <strong>Yes</strong> to enter revision cycle. Mark <strong>No</strong> to postpone.
              Click the ✓ button to confirm each revision level, or edit/cancel it.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-xs text-gray-400">
          SpaceRev — Built with 💜 for {authUser.displayName}. Data stored locally in your browser.
        </p>
      </footer>

      {/* MODALS */}
      {showTopicForm && (
        <TopicForm
          onSave={handleSaveTopic}
          onCancel={() => { setShowTopicForm(false); setEditTopic(null); }}
          editTopic={editTopic}
          categories={categories}
          onAddCategory={handleAddCategory}
          subjects={subjects}
          onAddSubject={handleAddSubject}
        />
      )}

      {showExamForm && (
        <ExamForm
          onSave={handleSaveExam}
          onCancel={() => { setShowExamForm(false); setEditExam(null); }}
          editExam={editExam}
          categories={categories}
          onAddCategory={handleAddCategory}
          subjects={subjects}
          onAddSubject={handleAddSubject}
        />
      )}

      {deleteTopicId && (
        <ConfirmModal
          title="Delete Topic"
          message="Are you sure you want to delete this topic? This action cannot be undone."
          onConfirm={handleDeleteTopic}
          onCancel={() => setDeleteTopicId(null)}
        />
      )}

      {deleteExamId && (
        <ConfirmModal
          title="Delete Exam"
          message="Are you sure you want to delete this exam record? This action cannot be undone."
          onConfirm={handleDeleteExam}
          onCancel={() => setDeleteExamId(null)}
        />
      )}

      {showRevisionModal && (
        <RevisionModal
          topic={showRevisionModal}
          onEdit={handleEditRevisionDate}
          onCancelRevision={handleCancelRevision}
          onConfirm={handleConfirmRevision}
          onClose={() => setShowRevisionModal(null)}
        />
      )}

      {showUserSelector && (
        <UserSelector
          users={users}
          activeUserId={activeUserId}
          onSelect={handleSelectUser}
          onAdd={handleAddUser}
          onDelete={handleDeleteUser}
          onRename={handleRenameUser}
        />
      )}

      {/* Publish Guide Modal */}
      {showPublishGuide && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2.5 rounded-xl">
                    <ExternalLink className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Publish for Free</h2>
                    <p className="text-sm text-gray-500">How to deploy your app live</p>
                  </div>
                </div>
                <button onClick={() => setShowPublishGuide(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Netlify */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
                  <h3 className="font-bold text-emerald-800 text-lg mb-2">🟢 Option 1: Netlify (Recommended)</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Run <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">npm run build</code> in your project</li>
                    <li>Go to <a href="https://netlify.com" target="_blank" className="text-emerald-600 underline">netlify.com</a> and sign up free</li>
                    <li>Drag and drop the <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">dist</code> folder into Netlify</li>
                    <li>Your site is live! You get a free URL like <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">your-app.netlify.app</code></li>
                    <li>Optional: Add a custom domain for free</li>
                  </ol>
                </div>

                {/* Vercel */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-800 text-lg mb-2">▲ Option 2: Vercel</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Push your code to GitHub</li>
                    <li>Go to <a href="https://vercel.com" target="_blank" className="text-blue-600 underline">vercel.com</a> and sign up with GitHub</li>
                    <li>Click "New Project" → Import your repo</li>
                    <li>Vercel auto-detects Vite and deploys instantly</li>
                    <li>You get <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">your-app.vercel.app</code></li>
                  </ol>
                </div>

                {/* GitHub Pages */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-800 text-lg mb-2">🐙 Option 3: GitHub Pages</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Push code to GitHub</li>
                    <li>Go to repo Settings → Pages</li>
                    <li>Set source to "GitHub Actions"</li>
                    <li>Add a deploy workflow in <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">.github/workflows/deploy.yml</code></li>
                    <li>Site deploys at <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">username.github.io/repo-name</code></li>
                  </ol>
                </div>

                {/* Surge */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5">
                  <h3 className="font-bold text-indigo-800 text-lg mb-2">🚀 Option 4: Surge.sh (Quickest)</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Install: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">npm install -g surge</code></li>
                    <li>Build: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">npm run build</code></li>
                    <li>Deploy: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">surge dist</code></li>
                    <li>Follow the prompts — done in 30 seconds!</li>
                  </ol>
                </div>

                {/* Cloudflare Pages */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
                  <h3 className="font-bold text-orange-800 text-lg mb-2">☁️ Option 5: Cloudflare Pages</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Go to <a href="https://pages.cloudflare.com" target="_blank" className="text-orange-600 underline">pages.cloudflare.com</a></li>
                    <li>Connect your GitHub repo</li>
                    <li>Set build command: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">npm run build</code></li>
                    <li>Set output directory: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">dist</code></li>
                    <li>Deploy with global CDN — super fast!</li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Pro Tip:</strong> All these options are 100% free for personal projects.
                    Netlify and Vercel offer the best experience with automatic deploys on every git push.
                    For the Perplexity AI feature to work, the Puter.js script needs internet access (it loads from CDN).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettings
          user={authUser}
          onUpdate={(updated) => setAuthUser(updated)}
          onSignOut={() => {
            signOut();
            setAuthUser(null);
          }}
          onClose={() => setShowProfileSettings(false)}
        />
      )}
    </div>
  );
}
