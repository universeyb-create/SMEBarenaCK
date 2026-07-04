import React from 'react';
import { History, X, Calendar, Share2, Clipboard, Trash2, ArrowUpRight } from 'lucide-react';

interface DrawHistoryListProps {
  history: any[];
  onLoadDraw: (draw: any) => void;
  onClose: () => void;
  onShareLink: (id: string) => void;
  onDeleteDraw?: (id: string) => void;
  currentUserId: string;
}

export default function DrawHistoryList({
  history,
  onLoadDraw,
  onClose,
  onShareLink,
  onDeleteDraw,
  currentUserId
}: DrawHistoryListProps) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181F] border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">최근 뽑기 이력</h3>
              <p className="text-xs text-zinc-400 mt-0.5">최근 진행된 CK 팀 매칭 결과를 불러오거나 공유할 수 있습니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm">
              <History size={40} className="mx-auto mb-3 text-zinc-700 stroke-[1.5]" />
              <p>아직 진행된 뽑기 이력이 없습니다.</p>
              <p className="text-xs text-zinc-600 mt-1">자동 뽑기를 완료하면 이력에 기록됩니다.</p>
            </div>
          ) : (
            history.map((item) => {
              const date = new Date(item.createdAt).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const isOwner = item.userId === currentUserId || (item.userId === 'guest' && currentUserId === 'guest');

              return (
                <div
                  key={item.id}
                  className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-zinc-100">{item.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700/60 rounded font-bold font-mono">
                        {item.method === 'auto' ? '전체자동' : '단계별'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                      <Calendar size={12} />
                      <span>{date}</span>
                      <span>•</span>
                      <span className="text-zinc-400">
                        {item.teams.map((t: any) => t.name).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onShareLink(item.id)}
                      type="button"
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition flex items-center gap-1 text-xs font-bold border border-zinc-700/50"
                      title="공유 링크 복사"
                    >
                      <Share2 size={13} />
                      공유
                    </button>

                    <button
                      onClick={() => onLoadDraw(item)}
                      type="button"
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center gap-1 text-xs font-bold shadow-lg shadow-indigo-950/20"
                    >
                      불러오기
                      <ArrowUpRight size={13} />
                    </button>

                    {onDeleteDraw && isOwner && (
                      <button
                        onClick={() => onDeleteDraw(item.id)}
                        type="button"
                        className="p-2 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-xl transition border border-red-950"
                        title="기록 삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-900/30 text-center text-[11px] text-zinc-500 font-medium">
          공유 링크를 사용하면 다른 사람들에게도 완벽하게 동일한 뽑기 결과를 즉시 보여줄 수 있습니다.
        </div>

      </div>
    </div>
  );
}
