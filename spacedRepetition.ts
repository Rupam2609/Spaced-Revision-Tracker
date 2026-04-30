export interface TopicLink {
  id: string;
  label: string;
  url: string;
}

export interface RevisionRecord {
  date: string;
  studied: boolean;
  interval: number;
  editedAt?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  textContent?: string;
}

export interface Topic {
  id: string;
  title: string;
  subject: string;
  category: string;
  description: string;
  dateStudied: string;
  isFutureDate: boolean;
  studied: boolean | null;
  links: TopicLink[];
  revisions: RevisionRecord[];
  nextReviewDate: string;
  currentInterval: number;
  isScheduled: boolean;
  createdAt: string;
}

export interface ExamRecord {
  id: string;
  examName: string;
  subject: string;
  category: string;
  date: string;
  description: string;
  links: TopicLink[];
  maxMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  answerSheetText: string;
  attachments: FileAttachment[];
  aiFeedback: string;
  aiLoading: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  createdAt: string;
}

export type ViewMode = 'list' | 'calendar';
export type FilterMode = 'all' | 'due' | 'upcoming' | 'scheduled' | 'mastered';
export type SortMode = 'nextReview' | 'dateStudied' | 'title';
export type TabMode = 'topics' | 'exams';
