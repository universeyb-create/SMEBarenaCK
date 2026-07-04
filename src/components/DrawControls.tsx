import React from 'react';
import { Play, RotateCcw, Copy, Image, Layers, Sparkles } from 'lucide-react';
import { TIER_INFO } from '../constants';

interface DrawControlsProps {
  onAutoDraw: () => void;
  onStepDraw: (tier: 1 | 2 | 3) => void;
  onReset: () => void;
  onCopyText: () => void;
  onDownloadImage: () => void;
  isDrawing: boolean;
  isCopied: boolean;
  currentDrawnTiers: { 1: boolean; 2: boolean; 3: boolean };
}

export default function DrawControls({
  onAutoDraw,
  onStepDraw,
  onReset,
  onCopyText,
  onDownloadImage,
  isDrawing,
  isCopied,
  currentDrawnTiers
}: DrawControlsProps) {
  const isAnyTierDrawn = currentDrawnTiers[1] || currentDrawnTiers[2] || currentDrawnTiers[3];
  const areAllTiersDrawn = currentDrawnTiers[1] && currentDrawnTiers[2] && currentDrawnTiers[3];

  return (
    <div className="bg-[#18181F] border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden mb-8">
      {/* Dynamic background element */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-indigo-600 to-emerald-500" />

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        
        {/* Left column: Quick Actions (Auto Draw, Reset) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onAutoDraw}
            disabled={isDrawing}
            type="button"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-indigo-950/40 disabled:opacity-50"
          >
            <Play size={18} fill="currentColor" />
            전체 자동 뽑기
          </button>

          <button
            onClick={onReset}
            disabled={isDrawing || !isAnyTierDrawn}
            type="button"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 font-bold text-sm rounded-xl transition disabled:opacity-40"
          >
            <RotateCcw size={16} />
            다시 뽑기
          </button>
        </div>

        {/* Middle: Step-by-step draws (추첨 제어) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
            <Layers size={14} className="text-zinc-500" />
            <span>티어별 팀 배정</span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:w-[480px]">
            {([1, 2, 3] as const).map((tierNum) => {
              const info = TIER_INFO[tierNum];
              const isDrawn = currentDrawnTiers[tierNum];
              const label = `T${tierNum} 뽑기`;

              return (
                <button
                  key={tierNum}
                  onClick={() => onStepDraw(tierNum)}
                  disabled={isDrawing || isDrawn}
                  type="button"
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition flex flex-col items-center justify-center gap-1 relative overflow-hidden ${
                    isDrawn
                      ? 'bg-zinc-950/80 border-zinc-900 text-zinc-600 cursor-not-allowed'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-white'
                  }`}
                >
                  <span className={`${isDrawn ? 'text-zinc-600' : info.textSolo}`}>{label}</span>
                  <span className="text-[9px] text-zinc-500 font-semibold truncate leading-none">
                    {isDrawn ? '뽑기 완료' : '뽑기 대기'}
                  </span>
                  {isDrawn && (
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5 border-t lg:border-t-0 border-zinc-800 pt-4 lg:pt-0">
          <button
            onClick={onCopyText}
            disabled={!isAnyTierDrawn}
            type="button"
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold transition ${
              isCopied
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-40'
            }`}
          >
            <Copy size={15} />
            {isCopied ? '결과 복사 완료!' : '결과 텍스트 복사'}
          </button>

          <button
            onClick={onDownloadImage}
            disabled={!areAllTiersDrawn}
            type="button"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFD700] hover:bg-[#FFE240] text-black font-extrabold text-xs rounded-xl transition shadow-md shadow-yellow-950/20 disabled:opacity-40"
          >
            <Image size={15} />
            결과 이미지 저장 (PNG)
          </button>
        </div>

      </div>
    </div>
  );
}
