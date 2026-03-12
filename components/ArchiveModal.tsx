import React, { useState, useMemo } from 'react';
import { MissionLogEntry, CharacterId } from '../types';
import { CHARACTERS } from '../constants';
import { Archive, X, Filter, Download, Calendar, Trash2, Trophy, Play, Search } from 'lucide-react';
import { filterMissions, exportMissionAsMarkdown, groupByDate, deleteMission, exportAllMissionsAsMarkdown } from '../services/archiveService';

interface ArchiveModalProps {
  logs: MissionLogEntry[];
  onDelete: (id: string) => void;
  onReplay?: (missionId: string) => void;
  onClose: () => void;
}

type FilterState = {
  characterId: CharacterId | 'all';
  type: 'all' | 'special' | 'seasonal' | 'daily';
  search: string;
};

const ArchiveModal: React.FC<ArchiveModalProps> = ({ logs, onDelete, onReplay, onClose }) => {
  const [filter, setFilter] = useState<FilterState>({
    characterId: 'all',
    type: 'all',
    search: '',
  });
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const filteredLogs = useMemo(() => {
    let result = logs;

    // キャラクターフィルター
    if (filter.characterId !== 'all') {
      result = result.filter(l => l.characterId === filter.characterId);
    }

    // タイプフィルター
    if (filter.type === 'special') {
      result = result.filter(l => l.isSpecial);
    } else if (filter.type === 'seasonal') {
      result = result.filter(l => l.isSeasonal);
    } else if (filter.type === 'daily') {
      result = result.filter(l => !l.isSpecial && !l.isSeasonal);
    }

    // 検索フィルター
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(searchLower) ||
        (l.description && l.description.toLowerCase().includes(searchLower))
      );
    }

    return result.sort((a, b) => b.completedAt - a.completedAt);
  }, [logs, filter]);

  const groupedLogs = useMemo(() => groupByDate(filteredLogs), [filteredLogs]);

  const handleExportSingle = (log: MissionLogEntry) => {
    const markdown = exportMissionAsMarkdown(log);
    downloadMarkdown(markdown, `mission_${log.day}_${log.characterId}.md`);
  };

  const handleExportAll = () => {
    const markdown = exportAllMissionsAsMarkdown(filteredLogs);
    downloadMarkdown(markdown, `clover_archive_${new Date().toISOString().split('T')[0]}.md`);
  };

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-cyan-300 shrink-0">
          <div className="flex items-center gap-3">
            <Archive className="w-6 h-6" />
            <h2 className="font-display text-2xl">MISSION LOGS</h2>
            <span className="bg-black text-white text-xs font-black px-2 py-1">
              {filteredLogs.length} 件
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`neo-btn p-2 ${showFilter ? 'bg-black text-white' : 'bg-white hover:bg-cyan-200'}`}
              title="フィルター"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={handleExportAll}
              className="neo-btn bg-white p-2 hover:bg-green-200"
              title="エクスポート"
            >
              <Download className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="neo-btn bg-white p-2 hover:bg-red-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="p-4 border-b-2 border-black bg-slate-100 shrink-0">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ミッションを検索..."
                  value={filter.search}
                  onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border-2 border-black rounded-lg bg-white text-sm font-bold"
                />
              </div>

              {/* Character Filter */}
              <select
                value={filter.characterId}
                onChange={(e) => setFilter(f => ({ ...f, characterId: e.target.value as CharacterId | 'all' }))}
                className="px-4 py-2 border-2 border-black rounded-lg bg-white text-sm font-bold"
              >
                <option value="all">すべてのキャラクター</option>
                {Object.values(CharacterId).map(id => (
                  <option key={id} value={id}>{CHARACTERS[id]?.name || id}</option>
                ))}
              </select>

              {/* Type Filter */}
              <div className="flex gap-2">
                {(['all', 'daily', 'special', 'seasonal'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilter(f => ({ ...f, type }))}
                    className={`px-3 py-1.5 border-2 border-black text-xs font-black capitalize
                      ${filter.type === type ? 'bg-black text-white' : 'bg-white hover:bg-slate-200'}
                    `}
                  >
                    {type === 'daily' ? 'デイリー' : type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 mx-auto border-4 border-black rounded-full bg-slate-100 flex items-center justify-center">
                <Archive className="w-10 h-10 text-slate-400" />
              </div>
              <p className="font-mono font-bold text-slate-400 text-lg">
                NO DATA FOUND
              </p>
              {logs.length > 0 && (
                <p className="text-sm text-slate-500">フィルター条件を変更してください</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedLogs)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, dateLogs]) => (
                  <div key={date} className="space-y-4">
                    {/* Date Header */}
                    <div className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-sm border-y-2 border-black px-4 py-2 -mx-6">
                      <span className="text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {date}
                      </span>
                    </div>

                    {/* Mission Cards */}
                    <div className="space-y-3">
                      {dateLogs.map((log) => {
                        const char = CHARACTERS[log.characterId];
                        const isDeleting = confirmingDeleteId === log.id;

                        return (
                          <div key={log.id} className={`
                            neo-box p-4 flex items-center gap-4 bg-white transition-all
                            ${log.isSpecial ? 'border-yellow-400' : log.isSeasonal ? 'border-emerald-400' : ''}
                          `}>
                            {/* Character Image */}
                            <div className="w-16 h-16 border-2 border-black overflow-hidden bg-slate-200 shrink-0">
                              <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover grayscale" />
                            </div>

                            {/* Mission Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex gap-2 mb-1 flex-wrap">
                                <span className="bg-black text-white text-[10px] font-black px-1.5 py-0.5">
                                  DAY {log.day}
                                </span>
                                <span className="bg-slate-200 text-black text-[10px] font-bold px-1.5 py-0.5">
                                  {new Date(log.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {log.isSpecial && (
                                  <span className="bg-yellow-300 text-black text-[10px] font-black px-1.5 py-0.5">
                                    <Trophy className="w-3 h-3 inline" /> SPECIAL
                                  </span>
                                )}
                                {log.isSeasonal && (
                                  <span className="bg-emerald-300 text-black text-[10px] font-black px-1.5 py-0.5">
                                    SEASONAL
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-base truncate">{log.title}</h3>
                              {log.description && (
                                <p className="text-xs font-bold text-slate-500 truncate">{log.description}</p>
                              )}
                              <p className="text-[10px] font-mono text-slate-400">HANDLER: {char.name}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              {isDeleting ? (
                                <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                                  <button
                                    onClick={() => onDelete(log.id)}
                                    className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 border-2 border-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                  >
                                    消去
                                  </button>
                                  <button
                                    onClick={() => setConfirmingDeleteId(null)}
                                    className="bg-slate-200 text-black text-[10px] font-black px-2 py-1 border-2 border-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {onReplay && (
                                    <button
                                      onClick={() => onReplay(log.id)}
                                      className="p-1.5 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                                      title="リプレイ"
                                    >
                                      <Play className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleExportSingle(log)}
                                    className="p-1.5 hover:bg-green-100 text-slate-400 hover:text-green-600 rounded-md transition-colors"
                                    title="エクスポート"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmingDeleteId(log.id)}
                                    className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                                    title="削除"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveModal;
