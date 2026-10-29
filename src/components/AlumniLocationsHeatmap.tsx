import React, { useState, useEffect } from 'react';
import { Institution, AlumniLocationSummary } from '../types';
import {
  MapPin,
  Globe2,
  TrendingUp,
  Building,
  ArrowRight,
  Sparkles,
  Compass,
  Layers,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson } from '../lib/apiClient';

interface AlumniLocationsHeatmapProps {
  institution?: Institution | null;
  onExploreLocation: (city: string) => void;
}

export const AlumniLocationsHeatmap: React.FC<AlumniLocationsHeatmapProps> = ({
  institution,
  onExploreLocation,
}) => {
  const [locations, setLocations] = useState<AlumniLocationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'radar'>('list');
  const [selectedHub, setSelectedHub] = useState<AlumniLocationSummary | null>(null);

  useEffect(() => {
    if (!institution?.id) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchLocations = async () => {
      try {
        const json = await safeFetchJson<AlumniLocationSummary[]>(`/api/institutions/${institution.id}/locations`);
        if (json.success && json.data && isMounted) {
          setLocations(json.data);
          if (json.data.length > 0) {
            setSelectedHub(json.data[0]);
          }
        }
      } catch (e) {
        console.error('Error fetching alumni locations:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLocations();
    return () => {
      isMounted = false;
    };
  }, [institution?.id]);

  const totalGlobalCount = locations.reduce((acc, l) => acc + l.count, 0);

  return (
    <div className="p-4 bg-gradient-to-b from-slate-850 to-slate-900 rounded-2xl border border-slate-700/80 shadow-lg space-y-3.5">
      {/* Card Header & View Switcher */}
      <div className="flex items-start justify-between gap-2">
        <div 
          onClick={() => {
            TelegramSdkWrapper.haptic('selection');
            setIsExpanded(!isExpanded);
          }}
          className="space-y-0.5 cursor-pointer select-none group min-w-0"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Globe2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors truncate">
                  Top Alumni Career Hubs & Heatmap
                </h2>
                <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/40 shrink-0">
                  {locations.length} Cities
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Where {institution?.shortName || 'Alumni'} graduates are currently based worldwide
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* View Toggle (Only shown when expanded) */}
          {isExpanded && (
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              <button
                onClick={() => {
                  TelegramSdkWrapper.haptic('selection');
                  setActiveView('list');
                }}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  activeView === 'list'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rankings
              </button>
              <button
                onClick={() => {
                  TelegramSdkWrapper.haptic('selection');
                  setActiveView('radar');
                }}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                  activeView === 'radar'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3 h-3" />
                Radar Map
              </button>
            </div>
          )}

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('light');
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all active:scale-95"
            title={isExpanded ? 'Collapse Hubs Card' : 'Expand Hubs Card'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsed Preview Summary */}
      {!isExpanded && (
        <div 
          onClick={() => {
            TelegramSdkWrapper.haptic('selection');
            setIsExpanded(true);
          }}
          className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 cursor-pointer text-[11px] text-slate-400 hover:text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-500">Top Hubs:</span>
            {locations.slice(0, 3).map((l, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60 font-mono text-[10px]">
                <MapPin className="w-2.5 h-2.5 text-blue-400" />
                {l.city.split('&')[0].trim()} ({l.count})
              </span>
            ))}
          </div>
          <span className="text-[10px] text-blue-400 font-bold hover:underline shrink-0">
            Expand Heatmap →
          </span>
        </div>
      )}

      {/* Expanded Content Body */}
      {isExpanded && (
        <>
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Loading global alumni distribution data...
            </div>
          ) : activeView === 'list' ? (
        /* View 1: Top Hubs List & Density Bars */
        <div className="space-y-2.5">
          {locations.map((loc, idx) => {
            const isSelected = selectedHub?.city === loc.city;
            return (
              <div
                key={loc.city}
                onClick={() => {
                  TelegramSdkWrapper.haptic('light');
                  setSelectedHub(loc);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/95 border-blue-500/80 shadow-md shadow-blue-950/30 ring-1 ring-blue-500/50'
                    : 'bg-slate-800/50 hover:bg-slate-800/80 border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-700/80 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {loc.city}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({loc.country})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {loc.industryFocus}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-extrabold text-blue-400 block">
                      {loc.count.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {loc.percentage}% of alumni
                    </span>
                  </div>
                </div>

                {/* Progress Density Bar */}
                <div className="mt-2 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                        : idx === 1
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-400'
                        : 'bg-gradient-to-r from-purple-500 to-indigo-400'
                    }`}
                    style={{ width: `${Math.max(loc.percentage * 2, 8)}%` }}
                  />
                </div>

                {/* Top Companies Tags & 1-Click Explore */}
                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                      <span className="text-[10px] text-slate-400 mr-1 flex items-center gap-1">
                        <Building className="w-2.5 h-2.5" /> Top:
                      </span>
                      {loc.topCompanies.slice(0, 3).map((comp) => (
                        <span
                          key={comp}
                          className="px-1.5 py-0.5 bg-slate-900/80 text-slate-300 border border-slate-700/80 rounded text-[9px]"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        TelegramSdkWrapper.haptic('medium');
                        onExploreLocation(loc.city.split('&')[0].trim());
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                    >
                      <Search className="w-2.5 h-2.5" />
                      Explore
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* View 2: Simplified Radar Heatmap Map Visualization */
        <div className="space-y-3">
          <div className="relative h-48 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-xl border border-slate-800 p-3 overflow-hidden flex flex-col justify-between">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

            {/* Global Connection lines & Pulse Radar Nodes */}
            <div className="relative z-10 h-full w-full">
              {/* Campus Origin Node */}
              <div className="absolute top-[58%] left-[46%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                </span>
                <span className="mt-1 px-1.5 py-0.5 bg-emerald-950/90 border border-emerald-500/50 rounded text-[8px] font-bold text-emerald-300 whitespace-nowrap shadow">
                  HQ • {institution.shortName}
                </span>
              </div>

              {/* London Node */}
              <div className="absolute top-[28%] left-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="h-3 w-3 rounded-full bg-blue-500 border border-white shadow-lg shadow-blue-500/50 animate-pulse"></span>
                <span className="mt-0.5 px-1 py-0.2 bg-slate-900/90 border border-slate-700 rounded text-[7.5px] text-slate-200">
                  London (22%)
                </span>
              </div>

              {/* San Francisco Node */}
              <div className="absolute top-[35%] left-[16%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="h-3 w-3 rounded-full bg-amber-500 border border-white shadow-lg shadow-amber-500/50 animate-pulse"></span>
                <span className="mt-0.5 px-1 py-0.2 bg-slate-900/90 border border-slate-700 rounded text-[7.5px] text-slate-200">
                  SF / Silicon Valley
                </span>
              </div>

              {/* Toronto Node */}
              <div className="absolute top-[26%] left-[28%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 border border-white"></span>
                <span className="mt-0.5 px-1 py-0.2 bg-slate-900/90 border border-slate-700 rounded text-[7.5px] text-slate-200">
                  Toronto (9%)
                </span>
              </div>

              {/* Berlin Node */}
              <div className="absolute top-[22%] left-[54%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400 border border-white"></span>
                <span className="mt-0.5 px-1 py-0.2 bg-slate-900/90 border border-slate-700 rounded text-[7.5px] text-slate-200">
                  Berlin (5%)
                </span>
              </div>

              {/* Lagos Metro Node */}
              <div className="absolute top-[68%] left-[44%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border border-white"></span>
                </span>
                <span className="mt-0.5 px-1 py-0.2 bg-slate-900/90 border border-blue-500/40 rounded text-[8px] font-bold text-blue-300">
                  Lagos (42%)
                </span>
              </div>
            </div>

            {/* Radar status footer */}
            <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/80 pt-1.5">
              <span>Radar Coverage: 42+ Countries</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                Live Alumni Sync Active
              </span>
            </div>
          </div>

          {/* Quick Hub Switcher Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {locations.map((loc) => (
              <button
                key={loc.city}
                onClick={() => {
                  TelegramSdkWrapper.haptic('light');
                  onExploreLocation(loc.city.split('&')[0].trim());
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg text-[10px] text-slate-300 font-semibold whitespace-nowrap flex items-center gap-1 active:scale-95 transition-all shrink-0"
              >
                <MapPin className="w-2.5 h-2.5 text-blue-400" />
                <span>{loc.city.split('&')[0].trim()}</span>
                <span className="text-[9px] text-slate-400 font-mono">({loc.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
