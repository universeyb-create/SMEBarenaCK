import React from 'react';
import { User } from 'firebase/auth';
import { LogIn, LogOut, Tv, Volume2, VolumeX, History, Sparkles, Trophy, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLoginAnonymously?: () => void;
  onLogout: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isObsMode: boolean;
  onToggleObsMode: () => void;
  onToggleHistory: () => void;
  hasCustomRoster: boolean;
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
}

export default function Header({
  user,
  onLogin,
  onLoginAnonymously,
  onLogout,
  isMuted,
  onToggleMute,
  isObsMode,
  onToggleObsMode,
  onToggleHistory,
  hasCustomRoster,
  isAdmin,
  onOpenAdminPanel
}: HeaderProps) {
  return (
    <header className={`border-b transition-all ${isObsMode ? 'hidden' : 'bg-[#0A0A0A] border-[#FFD700]/30'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        
        {/* Logo / Branding */}
        <div className="flex flex-col gap-1.5">
          <img 
            src="https://postfiles.pstatic.net/MjAyNjA3MDVfNDcg/MDAxNzgzMjAwMzc0MzA3.PMwmzMtH5eO1-JmLg8e2KM9c7KMrR92OpBJB8MJGmugg.8yqg7amoW2n3EMpnd_XwdOD6TIkNacLMvz-BeedAPRwg.PNG/%EB%82%99%ED%95%98.png?type=w966" 
            alt="아레나 CK 로고" 
            className="h-14 sm:h-16 w-auto object-contain self-start"
            referrerPolicy="no-referrer"
          />
          {hasCustomRoster && (
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
              <span className="text-indigo-400 font-bold">커스텀 로스터 활성화됨</span>
            </p>
          )}
        </div>

        {/* Toolbar & Controls */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            type="button"
            className={`p-2 rounded-xl border transition flex items-center justify-center gap-1 text-xs font-semibold ${
              isMuted
                ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400 hover:border-zinc-700'
                : 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400 hover:bg-indigo-950/40'
            }`}
            title={isMuted ? "소리 켜기" : "소리 끄기"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="hidden md:inline">{isMuted ? "음소거" : "소리 활성"}</span>
          </button>

          {/* OBS Mode Button */}
          <button
            onClick={onToggleObsMode}
            type="button"
            className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-semibold"
            title="방송용 깔끔한 UI(OBS)로 전환합니다."
          >
            <Tv size={16} className="text-emerald-400" />
            <span className="hidden md:inline">방송 송출 모드</span>
          </button>

          {/* History Button */}
          <button
            onClick={onToggleHistory}
            type="button"
            className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-semibold"
            title="최근 뽑기 이력을 봅니다."
          >
            <History size={16} className="text-amber-400" />
            <span className="hidden md:inline">뽑기 이력</span>
          </button>

          {/* Admin Panel Button */}
          {isAdmin && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              type="button"
              className="p-2 bg-zinc-900 border border-[#FFD700]/30 hover:bg-[#FFD700]/10 hover:border-[#FFD700] text-[#FFD700] rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-md shadow-[#FFD700]/5"
              title="가입 및 접속 승인 요청 관리"
            >
              <ShieldCheck size={16} className="text-[#FFD700]" />
              <span className="hidden md:inline">승인 관리</span>
            </button>
          )}

          <span className="h-5 w-px bg-zinc-800 mx-1 hidden sm:block" />

          {/* User Auth Info */}
          {user ? (
            <div className="flex items-center gap-2 bg-[#1C1C24] border border-zinc-800 rounded-xl pl-3 pr-2 py-1">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-zinc-200 truncate max-w-[90px] sm:max-w-[120px]">
                  {user.isAnonymous ? '게스트' : (user.displayName || user.email || '참가자')}
                </span>
                <span className="text-[9px] text-zinc-500 font-medium font-mono leading-none flex items-center gap-0.5 justify-end">
                  <ShieldCheck size={9} className="text-[#FFD700]" />
                  SYNC ON
                </span>
              </div>
              
              <button
                onClick={onLogout}
                type="button"
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition"
                title="로그아웃"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onLogin}
                type="button"
                className="px-3.5 py-2 bg-[#FFD700] hover:bg-[#FFE240] text-black text-xs font-bold rounded-xl transition shadow-md shadow-yellow-950/20 flex items-center gap-1.5"
                title="구글 계정으로 로그인하여 드래프트 내역과 명단을 클라우드에 동기화합니다."
              >
                <LogIn size={14} />
                구글 로그인
              </button>
              {onLoginAnonymously && (
                <button
                  onClick={onLoginAnonymously}
                  type="button"
                  className="px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition"
                  title="로그인 없이 게스트 계정으로 명단 편집 및 드래프트 저장 기능을 즉시 사용합니다."
                >
                  게스트 시작
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
