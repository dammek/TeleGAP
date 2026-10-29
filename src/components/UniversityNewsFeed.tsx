import React, { useState, useEffect } from 'react';
import { Institution, UniversityNewsItem, UniversityNewsCategory } from '../types';
import {
  Newspaper,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  BookOpen,
  Building,
  GraduationCap,
  Share2,
  X,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson } from '../lib/apiClient';
import { INITIAL_UNIVERSITY_NEWS } from '../server/mockData';

interface UniversityNewsFeedProps {
  institution?: Institution | null;
}

const CATEGORY_COLORS: Record<UniversityNewsCategory, { bg: string; text: string; border: string; label: string }> = {
  RESEARCH: { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30', label: 'Research & Labs' },
  CAMPUS: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', label: 'Campus Update' },
  ALUMNI_GRANT: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', label: 'Alumni Grant' },
  REUNION: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30', label: 'Homecoming' },
  ACADEMIC: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', label: 'Academic Affairs' },
  PARTNERSHIP: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30', label: 'Global Partnership' }
};

export const UniversityNewsFeed: React.FC<UniversityNewsFeedProps> = ({ institution }) => {
  const [news, setNews] = useState<UniversityNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeArticle, setActiveArticle] = useState<UniversityNewsItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!institution?.id) {
      setNews(INITIAL_UNIVERSITY_NEWS);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchNews = async () => {
      try {
        const json = await safeFetchJson<UniversityNewsItem[]>(`/api/institutions/${institution.id}/news`);
        if (json.success && json.data && isMounted) {
          setNews(json.data.length > 0 ? json.data : INITIAL_UNIVERSITY_NEWS);
        } else if (isMounted) {
          setNews(INITIAL_UNIVERSITY_NEWS);
        }
      } catch (err) {
        if (isMounted) setNews(INITIAL_UNIVERSITY_NEWS);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchNews();
    return () => {
      isMounted = false;
    };
  }, [institution?.id]);

  const filteredNews = selectedCategory === 'ALL'
    ? news
    : news.filter(item => item.category === selectedCategory);

  const handleShareArticle = (item: UniversityNewsItem) => {
    TelegramSdkWrapper.haptic('success');
    const shareUrl = `${window.location.origin}?news=${item.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${item.title} - ${shareUrl}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="space-y-3">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Newspaper className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100">
              {institution?.shortName || 'University'} Official News & Press Releases
            </h2>
            <span className="text-[10px] text-slate-400">
              Verified campus developments, endowments & executive circulars
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
          {filteredNews.length} articles
        </span>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
        <button
          onClick={() => {
            TelegramSdkWrapper.haptic('selection');
            setSelectedCategory('ALL');
          }}
          className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
          }`}
        >
          All Updates
        </button>
        {(['RESEARCH', 'ALUMNI_GRANT', 'REUNION', 'CAMPUS', 'ACADEMIC'] as UniversityNewsCategory[]).map(cat => {
          const config = CATEGORY_COLORS[cat];
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* News Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredNews.map(item => {
          const catConfig = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.CAMPUS;
          const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <div
              key={item.id}
              onClick={() => {
                TelegramSdkWrapper.haptic('light');
                setActiveArticle(item);
              }}
              className="overflow-hidden bg-slate-800/60 hover:bg-slate-800/90 rounded-2xl border border-slate-700/60 hover:border-blue-500/40 shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              {item.imageUrl && (
                <div className="relative w-full h-32 overflow-hidden bg-slate-900">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.featured && (
                    <span className="absolute top-2.5 right-2.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 fill-slate-950" /> Featured
                    </span>
                  )}
                </div>
              )}

              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catConfig.bg} ${catConfig.text} ${catConfig.border}`}>
                      {catConfig.label}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formattedDate}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm leading-snug group-hover:text-blue-300 transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[170px] text-[11px]">
                    {item.author}
                  </span>
                  <div className="flex items-center gap-1 text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform text-xs shrink-0">
                    <span>Read More</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3.5 animate-in fade-in">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[activeArticle.category].bg} ${CATEGORY_COLORS[activeArticle.category].text} ${CATEGORY_COLORS[activeArticle.category].border}`}>
                  {CATEGORY_COLORS[activeArticle.category].label}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {activeArticle.readTime}
                </span>
              </div>
              <button
                onClick={() => setActiveArticle(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Metadata */}
            <div>
              <h2 className="text-base font-extrabold text-white leading-snug">
                {activeArticle.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5 pb-3 border-b border-slate-800">
                <span>{activeArticle.author}</span>
                <span>•</span>
                <span>{activeArticle.date}</span>
              </div>
            </div>

            {/* Image if available */}
            {activeArticle.imageUrl && (
              <img
                src={activeArticle.imageUrl}
                alt={activeArticle.title}
                referrerPolicy="no-referrer"
                className="w-full h-44 rounded-xl object-cover border border-slate-800 shadow"
              />
            )}

            {/* Article Content */}
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line space-y-3 bg-slate-850 p-3.5 rounded-xl border border-slate-800/80">
              {activeArticle.content}
            </div>

            {/* Official Stamp Footer */}
            <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs text-blue-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-[11px]">Official Verified Release from {institution?.name || 'Institution'}</span>
              </div>
              <button
                onClick={() => handleShareArticle(activeArticle)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Share2 className="w-3 h-3" />
                <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
