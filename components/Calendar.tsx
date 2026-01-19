
import React, { useMemo } from 'react';
import { VideoProject, CalendarDay } from '../types';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  parseISO,
  isSameDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, FileVideo, Clock } from 'lucide-react';

interface CalendarProps {
  projects: VideoProject[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  onSelectDay: (date: Date) => void;
  onEditProject: (project: VideoProject) => void;
}

const Calendar: React.FC<CalendarProps> = ({ 
  projects, 
  currentMonth, 
  setCurrentMonth, 
  onSelectDay, 
  onEditProject 
}) => {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    return calendarDays.map((date): CalendarDay => ({
      date,
      isCurrentMonth: isSameMonth(date, monthStart),
      isToday: isToday(date),
      projects: projects.filter(p => isSameDay(parseISO(p.dueDate), date))
    }));
  }, [currentMonth, projects]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const platformColors: Record<string, { bg: string, text: string, border: string }> = {
    YouTube: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    TikTok: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    Instagram: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
    LinkedIn: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    Custom: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
  };

  const platformIcons: Record<string, string> = {
    YouTube: '📺',
    TikTok: '🎵',
    Instagram: '📸',
    LinkedIn: '💼',
    Custom: '📎'
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
          <p className="text-slate-400 text-sm">Visual production timeline</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-800 rounded-xl p-1">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-1 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              Today
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => onSelectDay(new Date())}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>New Video</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-7 border-b border-slate-800">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
        
        <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-fr">
          {days.map((day, idx) => (
            <div 
              key={idx} 
              className={`min-h-[120px] p-2 border-b border-r border-slate-800 transition-colors cursor-pointer group flex flex-col ${
                !day.isCurrentMonth ? 'bg-slate-950/20' : 'hover:bg-slate-800/30'
              } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
              onClick={() => onSelectDay(day.date)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                  day.isToday 
                    ? 'bg-indigo-600 text-white' 
                    : day.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {format(day.date, 'd')}
                </span>
                {day.projects.length > 0 && (
                   <div className="flex gap-0.5">
                      {Array.from(new Set(day.projects.map(p => p.platform))).map((plat) => (
                        <div key={plat as string} className={`w-1 h-1 rounded-full ${platformColors[plat as string].bg.replace('/20', '')}`}></div>
                      ))}
                   </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                {day.projects.map(project => {
                  const colors = platformColors[project.platform] || platformColors.Custom;
                  const isPosted = project.status === 'Posted';
                  return (
                    <div 
                      key={project.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProject(project);
                      }}
                      className={`relative px-2 py-1 rounded-md border text-[10px] font-bold transition-all hover:brightness-125 flex flex-col gap-0.5 ${colors.bg} ${colors.text} ${colors.border} ${isPosted ? 'opacity-40 grayscale-[0.5]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 truncate">
                          <span>{platformIcons[project.platform]}</span>
                          <span className={`truncate ${isPosted ? 'line-through' : ''}`}>{project.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-0.5 opacity-80">
                         <div className="flex items-center gap-0.5">
                           <Clock className="w-2.5 h-2.5" />
                           <span>{project.postTime || '12:00'}</span>
                         </div>
                         {project.fileName && <FileVideo className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
