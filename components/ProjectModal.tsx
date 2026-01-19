
import React, { useState, useEffect, useRef } from 'react';
import { VideoProject, ProjectStatus } from '../types';
import { brainstormVideoTitles } from '../services/geminiService';
import { saveVideoFile, getVideoFile, deleteVideoFile } from '../services/storageService';
import { X, Sparkles, Loader2, Save, Trash2, Upload, FileVideo, Download, CheckCircle, Clock, Bell } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: VideoProject) => void;
  onDelete?: (id: string) => void;
  initialData?: VideoProject | null;
  selectedDate?: string;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  selectedDate
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<VideoProject['platform']>('YouTube');
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [dueDate, setDueDate] = useState('');
  const [postTime, setPostTime] = useState('12:00');
  const [reminderMinutes, setReminderMinutes] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [hasStoredFile, setHasStoredFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setPlatform(initialData.platform);
      setStatus(initialData.status);
      setDueDate(initialData.dueDate);
      setPostTime(initialData.postTime || '12:00');
      setReminderMinutes(initialData.reminderMinutes || 0);
      setHasStoredFile(!!initialData.fileName);
    } else {
      setTitle('');
      setDescription('');
      setPlatform('YouTube');
      setStatus('Planning');
      setDueDate(selectedDate || new Date().toISOString().split('T')[0]);
      setPostTime('12:00');
      setReminderMinutes(0);
      setHasStoredFile(false);
    }
    setAttachedFile(null);
    setAiSuggestions([]);
  }, [initialData, selectedDate, isOpen]);

  const handleBrainstorm = async () => {
    if (!title && !description) return;
    setIsGenerating(true);
    const suggestions = await brainstormVideoTitles(title || description, platform);
    setAiSuggestions(suggestions);
    setIsGenerating(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      setHasStoredFile(false);
      if (status === 'Planning' || status === 'Editing') {
        setStatus('Ready');
      }
    }
  };

  const handleDownload = async () => {
    if (!initialData) return;
    const file = await getVideoFile(initialData.id);
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = initialData?.id || crypto.randomUUID();
    
    if (attachedFile) {
      await saveVideoFile(id, attachedFile);
    }

    onSave({
      id,
      title,
      description,
      platform,
      status,
      dueDate,
      postTime,
      reminderMinutes,
      createdAt: initialData?.createdAt || Date.now(),
      fileName: attachedFile?.name || initialData?.fileName,
      fileSize: attachedFile?.size || initialData?.fileSize,
      fileType: attachedFile?.type || initialData?.fileType,
      lastNotifiedAt: initialData?.lastNotifiedAt
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {initialData ? 'Edit Video Project' : 'Plan New Video'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Video Title</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Awesome Travel Vlog"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleBrainstorm}
                  disabled={isGenerating || (!title && !description)}
                  className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg transition-colors group"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
               <Clock className="w-3 h-3" /> Veröffentlichung & Erinnerung
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Online-Zeit (Uhrzeit)</label>
                <input
                  type="time"
                  value={postTime}
                  onChange={(e) => setPostTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Erinnerung vorab</label>
                <div className="relative">
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value={0}>Keine Erinnerung</option>
                    <option value={15}>15 Minuten vorher</option>
                    <option value={30}>30 Minuten vorher</option>
                    <option value={60}>1 Stunde vorher</option>
                    <option value={120}>2 Stunden vorher</option>
                  </select>
                  <Bell className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {aiSuggestions.length > 0 && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">AI Title Suggestions</p>
              <div className="grid grid-cols-1 gap-2">
                {aiSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTitle(s)}
                    className="text-left text-sm text-slate-300 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-colors border border-transparent hover:border-indigo-500/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Description / Key Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this video about?"
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Current Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Planning">Planning</option>
                <option value="Editing">Editing</option>
                <option value="Ready">Ready</option>
                <option value="Posted">Posted ✅</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Video Content</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                attachedFile || hasStoredFile 
                  ? 'border-emerald-500/50 bg-emerald-500/5' 
                  : 'border-slate-700 hover:border-indigo-500 bg-slate-800/50 hover:bg-slate-800'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="video/*" 
              />
              {attachedFile || hasStoredFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="text-white w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white truncate max-w-[200px]">
                      {attachedFile?.name || initialData?.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400">Video file attached</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {hasStoredFile && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3 h-3" /> Download
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setAttachedFile(null); 
                        setHasStoredFile(false); 
                        if (initialData) initialData.fileName = undefined; 
                      }}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-500" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Click or drag video to upload</p>
                    <p className="text-xs text-slate-500">MP4, MOV, or WEBM (Auto-stored locally)</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between gap-3 sticky bottom-0">
          {initialData && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(initialData.id)}
              className="px-6 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <div className="flex-1"></div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {initialData ? 'Update' : 'Save Video'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
