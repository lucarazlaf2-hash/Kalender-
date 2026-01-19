
import React, { useState, useEffect, useMemo } from 'react';
import Calendar from './components/Calendar';
import ProjectModal from './components/ProjectModal';
import { VideoProject } from './types';
import { deleteVideoFile, getVideoFile } from './services/storageService';
import { format, isSameDay, parseISO, addMinutes, isBefore } from 'date-fns';
import { Video, Calendar as CalendarIcon, CheckCircle, Clock, LayoutDashboard, Settings, Download, FileVideo, Bell } from 'lucide-react';

const STORAGE_KEY = 'editflow_projects';

const App: React.FC = () => {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<VideoProject | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    }

    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  // Notification engine
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      let updated = false;
      const newProjects = projects.map(p => {
        if (p.status === 'Posted' || !p.postTime || !p.reminderMinutes) return p;

        // Construct Post DateTime
        const [hours, minutes] = p.postTime.split(':').map(Number);
        const postDate = parseISO(p.dueDate);
        postDate.setHours(hours, minutes, 0, 0);

        const reminderDate = addMinutes(postDate, -p.reminderMinutes);
        
        // Trigger if: 
        // 1. Time is after reminder window start
        // 2. Time is before actual post time
        // 3. Notified less than today (lastNotifiedAt)
        const canNotify = isBefore(reminderDate, now) && 
                          isBefore(now, postDate) && 
                          (!p.lastNotifiedAt || !isSameDay(new Date(p.lastNotifiedAt), now));

        if (canNotify) {
          if (Notification.permission === "granted") {
            new Notification(`🚀 Posting Reminder: ${p.title}`, {
              body: `Scheduled for ${p.postTime} on ${p.platform}. Open EditFlow to get your files!`,
              icon: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png"
            });
          }
          updated = true;
          return { ...p, lastNotifiedAt: Date.now() };
        }
        return p;
      });

      if (updated) {
        setProjects(newProjects);
      }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Initial check
    return () => clearInterval(interval);
  }, [projects]);

  const todayProjects = useMemo(() => {
    const today = new Date();
    return projects
      .filter(p => isSameDay(parseISO(p.dueDate), today) && p.status !== 'Posted')
      .sort((a, b) => (a.postTime || '00:00').localeCompare(b.postTime || '00:00'));
  }, [projects]);

  const upcomingProjects = useMemo(() => {
    const now = new Date();
    return projects
      .filter(p => parseISO(p.dueDate) >= now && p.status !== 'Posted')
      .sort((a, b) => {
        const dateCompare = a.dueDate.localeCompare(b.dueDate);
        if (dateCompare !== 0) return dateCompare;
        return (a.postTime || '00:00').localeCompare(b.postTime || '00:00');
      })
      .slice(0, 5);
  }, [projects]);

  const handleSaveProject = (project: VideoProject) => {
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === project.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = project;
        return updated;
      }
      return [...prev, project];
    });
    setIsModalOpen(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("Delete this plan and its video file?")) {
      await deleteVideoFile(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setIsModalOpen(false);
    }
  };

  const handleDownload = async (project: VideoProject) => {
    const file = await getVideoFile(project.id);
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const openNewProject = (date: Date) => {
    setEditingProject(null);
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setIsModalOpen(true);
  };

  const openEditProject = (project: VideoProject) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const markAsPosted = (id: string) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'Posted' as const } : p
    ));
  };

  const platformColors: Record<string, string> = {
    YouTube: 'border-red-500/50 bg-red-500/5 text-red-400',
    TikTok: 'border-cyan-500/50 bg-cyan-500/5 text-cyan-400',
    Instagram: 'border-pink-500/50 bg-pink-500/5 text-pink-400',
    LinkedIn: 'border-blue-500/50 bg-blue-500/5 text-blue-400',
    Custom: 'border-slate-500/50 bg-slate-500/5 text-slate-400',
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <aside className="w-80 border-r border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Video className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">EditFlow</h1>
        </div>

        <nav className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-semibold">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-xl transition-all font-medium">
            <CalendarIcon className="w-5 h-5" />
            Calendar
          </button>
        </nav>

        <div className="space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4">Ready to Post Today</h3>
            <div className="space-y-2">
              {todayProjects.length > 0 ? (
                todayProjects.map(p => (
                  <div 
                    key={p.id} 
                    className={`group relative border p-4 rounded-2xl transition-all hover:scale-[1.02] ${platformColors[p.platform] || platformColors.Custom}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-wider">{p.platform}</span>
                        <div className="flex items-center gap-1 text-white font-bold text-xs mt-0.5">
                           <Clock className="w-3 h-3 text-indigo-400" />
                           {p.postTime || '12:00'}
                        </div>
                      </div>
                      <div className="flex gap-1">
                         {p.reminderMinutes && p.reminderMinutes > 0 && (
                            <Bell className="w-3.5 h-3.5 text-indigo-400 mr-1 animate-pulse" />
                         )}
                         {p.fileName && (
                           <button 
                             onClick={() => handleDownload(p)}
                             className="p-1 hover:bg-white/10 rounded transition-all"
                             title="Download Video"
                           >
                             <Download className="w-3.5 h-3.5" />
                           </button>
                         )}
                         <button 
                          onClick={() => markAsPosted(p.id)}
                          className="p-1 hover:bg-white/10 rounded transition-all"
                          title="Mark as Posted"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1 leading-tight">{p.title}</h4>
                    {p.fileName && (
                      <div className="flex items-center gap-1.5 text-[10px] opacity-70 mt-2">
                        <FileVideo className="w-3 h-3" />
                        <span className="truncate">{p.fileName}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                  <CheckCircle className="w-8 h-8 text-slate-700" />
                  <p className="text-sm text-slate-600 font-medium">No posts for today.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4">Upcoming</h3>
            <div className="space-y-1">
              {upcomingProjects.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => openEditProject(p)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-800/40 rounded-xl transition-all group"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${platformColors[p.platform]?.split(' ')[2]?.replace('text', 'bg') || 'bg-slate-500'}`}></div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-semibold text-slate-300 truncate">{p.title}</p>
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] text-slate-500">{format(parseISO(p.dueDate), 'MMM d')}</p>
                       <p className="text-[10px] text-slate-500 font-medium">{p.postTime || '12:00'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-hidden flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Video Pipeline</h2>
            <p className="text-slate-400 mt-1">Directly manage your files and schedules in one place.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-900 border border-slate-800 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
               <Clock className="w-4 h-4 text-slate-500" />
               <span className="text-sm font-bold text-slate-300">Active Tasks: {projects.filter(p => p.status !== 'Posted').length}</span>
             </div>
          </div>
        </header>

        <div className="flex-1 min-h-0">
          <Calendar 
            projects={projects} 
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            onSelectDay={openNewProject}
            onEditProject={openEditProject}
          />
        </div>
      </main>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        initialData={editingProject}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default App;
