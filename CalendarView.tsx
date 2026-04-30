import { useState, useRef } from 'react';
import { FileAttachment } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Eye,
  Paperclip,
} from 'lucide-react';

interface AIFeedbackProps {
  examName: string;
  subject: string;
  answerText: string;
  attachments: FileAttachment[];
  existingFeedback: string;
  onFeedbackUpdate: (feedback: string) => void;
  onAttachmentsUpdate: (attachments: FileAttachment[]) => void;
}

declare global {
  interface Window {
    puter: {
      ai: {
        chat: (
          prompt: string,
          fileUrlOrOptions?: any,
          options?: { model?: string; stream?: boolean }
        ) => Promise<any>;
      };
    };
  }
}

export default function AIFeedback({
  examName,
  subject,
  answerText,
  attachments,
  existingFeedback,
  onFeedbackUpdate,
  onAttachmentsUpdate,
}: AIFeedbackProps) {
  const [feedback, setFeedback] = useState(existingFeedback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const newAttachments: FileAttachment[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" is too large (max 10MB)`);
        continue;
      }

      const dataUrl = await readFileAsDataUrl(file);
      let textContent: string | undefined;

      // Read text content for text-based files
      if (file.type.startsWith('text/') || file.type === 'text/csv') {
        textContent = await readFileAsText(file);
      }

      newAttachments.push({
        id: uuidv4(),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        textContent,
      });
    }

    onAttachmentsUpdate([...attachments, ...newAttachments]);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await handleFiles(files);
    }
  };

  const removeAttachment = (id: string) => {
    onAttachmentsUpdate(attachments.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type: string) => type.startsWith('image/');

  const buildAnalysisPrompt = (customQ?: string) => {
    const base = customQ || `You are an expert exam evaluator for Indian competitive exams (UPSC, State PSC, etc). Analyze the following answer for an exam titled "${examName}" (Subject: ${subject}).

Provide detailed feedback in this format:
1. **Overall Assessment**: Rate the answer quality (1-10)
2. **Strengths**: What the answer does well
3. **Weaknesses**: Areas that need improvement
4. **Missing Points**: Key points that should have been included
5. **Structure & Presentation**: How to better organize the answer
6. **Factual Accuracy**: Any factual errors
7. **Improvement Tips**: Specific actionable advice
8. **Suggested References**: Topics/books to study for improvement

Be constructive, specific, and actionable in your feedback.`;

    let fullPrompt = base;

    if (answerText.trim()) {
      fullPrompt += `\n\n---\n\nAnswer to evaluate:\n\n${answerText}`;
    }

    // Include text content from attachments
    const textAttachments = attachments.filter((a) => a.textContent);
    if (textAttachments.length > 0) {
      fullPrompt += `\n\n---\n\nAttached file contents:\n`;
      textAttachments.forEach((a) => {
        fullPrompt += `\n[File: ${a.name}]\n${a.textContent}\n`;
      });
    }

    return fullPrompt;
  };

  const analyzeAnswer = async (customQ?: string) => {
    const hasContent = answerText.trim() || attachments.length > 0;
    if (!hasContent) {
      setError('Please add answer text or attach files/images first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const prompt = buildAnalysisPrompt(customQ);
      const imageAttachments = attachments.filter((a) => isImage(a.type));

      let response;

      if (imageAttachments.length > 0) {
        // Use the first image for vision analysis
        // Puter.js supports image URL analysis
        response = await window.puter.ai.chat(
          prompt + '\n\nPlease also analyze any attached images for content, handwriting quality, diagrams, and provide feedback on visual presentation.',
          imageAttachments[0].dataUrl,
          { model: 'perplexity/sonar' }
        );
      } else {
        response = await window.puter.ai.chat(prompt, {
          model: 'perplexity/sonar',
        });
      }

      const result =
        typeof response === 'string'
          ? response
          : response?.message?.content || response?.toString() || '';
      setFeedback(result);
      onFeedbackUpdate(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to get AI feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomAnalyze = () => {
    if (!customPrompt.trim()) return;
    analyzeAnswer(customPrompt);
    setCustomPrompt('');
  };

  const hasContent = answerText.trim() || attachments.length > 0;

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all ${
          dragOver
            ? 'border-purple-400 bg-purple-50'
            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.csv,.doc,.docx"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="text-center">
          <div className="flex justify-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.setAttribute('accept', 'image/*');
                fileInputRef.current?.click();
                // Reset accept after
                setTimeout(() => {
                  fileInputRef.current?.setAttribute('accept', 'image/*,.pdf,.txt,.csv,.doc,.docx');
                }, 100);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              Upload Image
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Drag & drop files, paste images (Ctrl+V), or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Supports: Images (JPG, PNG, GIF, WebP), PDF, Text, Word docs — Max 10MB each
          </p>
        </div>
      </div>

      {/* Attached Files Preview */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5" />
            Attachments ({attachments.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="relative group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all"
              >
                {isImage(file.type) ? (
                  <div
                    className="aspect-video bg-gray-50 cursor-pointer relative overflow-hidden"
                    onClick={() => setPreviewFile(file)}
                  >
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                  </div>
                ) : (
                  <div
                    className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center cursor-pointer"
                    onClick={() => setPreviewFile(file)}
                  >
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-[10px] text-gray-400">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => removeAttachment(file.id)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-white/90 text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => analyzeAnswer()}
          disabled={loading || !hasContent}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? 'Analyzing...' : 'AI Analyze'}
        </button>
      </div>

      {/* Custom prompt */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Ask AI a specific question about your answer or attached files..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCustomAnalyze();
          }}
        />
        <button
          onClick={handleCustomAnalyze}
          disabled={loading || !customPrompt.trim()}
          className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
          <X className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Feedback Display */}
      {feedback && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h4 className="font-bold text-purple-800">AI Feedback</h4>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 hover:bg-purple-100 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
            {feedback}
          </div>
        </div>
      )}

      {!feedback && !loading && (
        <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {hasContent
              ? 'Click "AI Analyze" to get feedback on your answer and attachments'
              : 'Add answer text or upload files/images to enable AI analysis'}
          </p>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {isImage(previewFile.type) ? (
                  <ImageIcon className="w-5 h-5 text-purple-500" />
                ) : (
                  <FileText className="w-5 h-5 text-purple-500" />
                )}
                <span className="font-semibold text-gray-900 text-sm">{previewFile.name}</span>
                <span className="text-xs text-gray-400">{formatFileSize(previewFile.size)}</span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[75vh]">
              {isImage(previewFile.type) ? (
                <img
                  src={previewFile.dataUrl}
                  alt={previewFile.name}
                  className="max-w-full h-auto rounded-xl mx-auto"
                />
              ) : previewFile.textContent ? (
                <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl font-mono">
                  {previewFile.textContent}
                </pre>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Preview not available for this file type</p>
                  <p className="text-xs text-gray-400 mt-1">
                    The file content will still be included in AI analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
