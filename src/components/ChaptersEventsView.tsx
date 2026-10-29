import React, { useState, useEffect } from 'react';
import { Institution, ChapterGroup, AlumniEvent, TelegramUser } from '../types';
import {
  Compass,
  Calendar,
  Users,
  Send,
  MapPin,
  ExternalLink,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson } from '../lib/apiClient';
import { INITIAL_CHAPTERS, INITIAL_EVENTS } from '../server/mockData';

interface ChaptersEventsViewProps {
  institution?: Institution | null;
  currentUser: TelegramUser;
}

export const ChaptersEventsView: React.FC<ChaptersEventsViewProps> = ({
  institution,
  currentUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chapters' | 'events'>('chapters');
  const [chapters, setChapters] = useState<ChapterGroup[]>([]);
  const [events, setEvents] = useState<AlumniEvent[]>([]);
  const [rsvpdEvents, setRsvpdEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!institution?.id) return;

    // Fetch chapters & events for current institution
    const loadData = async () => {
      try {
        const [chapData, evtData] = await Promise.all([
          safeFetchJson<ChapterGroup[]>(`/api/chapters?institutionId=${institution.id}`),
          safeFetchJson<AlumniEvent[]>(`/api/events?institutionId=${institution.id}`)
        ]);

        if (chapData.success && chapData.data) {
          setChapters(chapData.data);
        } else {
          setChapters(INITIAL_CHAPTERS.filter(c => c.institutionId === institution.id));
        }

        if (evtData.success && evtData.data) {
          setEvents(evtData.data);
        } else {
          setEvents(INITIAL_EVENTS.filter(e => e.institutionId === institution.id));
        }
      } catch (err) {
        console.error('Error loading chapters/events:', err);
        setChapters(INITIAL_CHAPTERS.filter(c => c.institutionId === institution.id));
        setEvents(INITIAL_EVENTS.filter(e => e.institutionId === institution.id));
      }
    };

    loadData();
  }, [institution?.id]);

  const handleRsvp = (eventId: string) => {
    TelegramSdkWrapper.haptic('success');
    setRsvpdEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Subtab Pill Selector */}
      <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
        <button
          onClick={() => {
            TelegramSdkWrapper.haptic('selection');
            setActiveSubTab('chapters');
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'chapters'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Regional Chapters ({chapters.length})
        </button>
        <button
          onClick={() => {
            TelegramSdkWrapper.haptic('selection');
            setActiveSubTab('events');
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'events'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Upcoming Events ({events.length})
        </button>
      </div>

      {/* VIEW: CHAPTERS */}
      {activeSubTab === 'chapters' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400 px-1">
            Connect with verified alumni living and working in your metropolitan area or diaspora community:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {chapters.map(chapter => (
              <div
                key={chapter.id}
                className="overflow-hidden bg-slate-800/60 hover:bg-slate-800/90 rounded-2xl border border-slate-700/60 hover:border-cyan-500/40 shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Accent Top Strip Header */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-950/60 via-slate-850 to-slate-900 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                      <Compass className="w-2.5 h-2.5" /> Regional Chapter
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      {chapter.region}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-semibold bg-slate-900/80 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                    {chapter.memberCount.toLocaleString()} alumni
                  </span>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-100 text-sm leading-snug group-hover:text-cyan-300 transition-colors">
                      {chapter.name}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Official regional network connecting alumni across {chapter.region} for local professional mixers, career mentorship, and diaspora initiatives.
                    </p>

                    {/* Structured Info Box */}
                    <div className="space-y-1.5 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800 text-xs">
                      {chapter.leadName && (
                        <div className="text-slate-300 flex items-center justify-between">
                          <span className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500 shrink-0" /> Chapter Lead:
                          </span>
                          <span className="font-medium text-white flex items-center gap-1">
                            {chapter.leadName}
                            {chapter.leadTgUsername && (
                              <span className="text-[10px] text-blue-400 font-mono">(@{chapter.leadTgUsername})</span>
                            )}
                          </span>
                        </div>
                      )}

                      {chapter.meetingSchedule && (
                        <div className="text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-800/80 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{chapter.meetingSchedule}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Bar Footer */}
                  <div className="pt-3 border-t border-slate-700/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active Hub
                      </span>
                    </div>

                    {chapter.chatUrl ? (
                      <button
                        onClick={() => {
                          TelegramSdkWrapper.haptic('medium');
                          TelegramSdkWrapper.openLink(chapter.chatUrl!);
                        }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Join Sub-Group</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </button>
                    ) : (
                      <div className="w-full py-2 text-center text-xs text-slate-500 font-mono bg-slate-900/50 rounded-xl border border-slate-800">
                        Chat opening soon
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: EVENTS */}
      {activeSubTab === 'events' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400 px-1">
            Official reunions, executive panel sessions, webinars, and homecoming gatherings:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {events.map(event => {
              const isRsvpd = rsvpdEvents.has(event.id);
              const eventDate = new Date(event.date);

              return (
                <div
                  key={event.id}
                  className="overflow-hidden bg-slate-800/60 rounded-2xl border border-slate-700/60 shadow-md space-y-3"
                >
                  {event.bannerUrl && (
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-32 object-cover"
                    />
                  )}

                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                          {event.locationType}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {eventDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-100 text-sm leading-snug">
                        {event.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-400">
                        {event.rsvpCount + (isRsvpd ? 1 : 0)} attending
                      </span>

                      <button
                        onClick={() => handleRsvp(event.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                          isRsvpd
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30'
                        }`}
                      >
                        {isRsvpd ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            RSVP Confirmed
                          </>
                        ) : (
                          'RSVP Attendance'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
