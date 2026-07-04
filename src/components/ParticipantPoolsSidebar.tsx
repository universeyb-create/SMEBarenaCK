import React from 'react';
import { Team } from '../types';

interface ParticipantPoolsSidebarProps {
  players: {
    tier1: string[];
    tier2: string[];
    tier3: string[];
  };
  teams: Team[];
  revealedStatus: {
    [teamId: number]: {
      1: boolean;
      2: boolean;
      3: boolean;
    };
  };
}

export default function ParticipantPoolsSidebar({
  players,
  teams,
  revealedStatus
}: ParticipantPoolsSidebarProps) {
  // Determine which players are currently picked and revealed
  const pickedPlayers = new Set<string>();
  teams.forEach(team => {
    ([1, 2, 3] as const).forEach(tierNum => {
      if (revealedStatus[team.id]?.[tierNum] && team.players[tierNum]) {
        pickedPlayers.add(team.players[tierNum]);
      }
    });
  });

  return (
    <aside className="flex flex-col gap-4">
      {/* Tier 1 Pool */}
      <div className="bg-[#1E1E1E] p-4 rounded-lg border border-white/5 flex-1 overflow-hidden flex flex-col">
        <h3 className="text-[#FFD700] text-xs font-black mb-3 flex items-center gap-2 uppercase tracking-wider">
          <span className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse"></span> Tier 1 Pool
        </h3>
        <ul className="space-y-2 text-sm flex-1 overflow-y-auto pr-1">
          {players.tier1.map((name) => {
            const isPicked = pickedPlayers.has(name);
            return (
              <li
                key={name}
                className={`flex justify-between py-1 border-b border-white/5 transition-all duration-300 ${
                  isPicked ? 'text-white/20 italic line-through' : 'text-zinc-100'
                }`}
              >
                <span>{name}</span>
                {isPicked ? (
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest scale-90">
                    PICKED
                  </span>
                ) : (
                  <span className="text-[10px] bg-zinc-800/60 text-zinc-400 border border-zinc-700/30 px-1.5 py-0.5 rounded font-medium">
                    대기중
                  </span>
                )}
              </li>
            );
          })}
          {players.tier1.length === 0 && (
            <li className="text-xs text-zinc-600 italic py-2">등록된 선수가 없습니다.</li>
          )}
        </ul>
      </div>

      {/* Tier 2 Pool */}
      <div className="bg-[#1E1E1E] p-4 rounded-lg border border-white/5 flex-1 overflow-hidden flex flex-col">
        <h3 className="text-cyan-400 text-xs font-black mb-3 flex items-center gap-2 uppercase tracking-wider">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span> Tier 2 Pool
        </h3>
        <ul className="space-y-2 text-sm flex-1 overflow-y-auto pr-1">
          {players.tier2.map((name) => {
            const isPicked = pickedPlayers.has(name);
            return (
              <li
                key={name}
                className={`flex justify-between py-1 border-b border-white/5 transition-all duration-300 ${
                  isPicked ? 'text-white/20 italic line-through' : 'text-zinc-100'
                }`}
              >
                <span>{name}</span>
                {isPicked ? (
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest scale-90">
                    PICKED
                  </span>
                ) : (
                  <span className="text-[10px] bg-zinc-800/60 text-zinc-400 border border-zinc-700/30 px-1.5 py-0.5 rounded font-medium">
                    대기중
                  </span>
                )}
              </li>
            );
          })}
          {players.tier2.length === 0 && (
            <li className="text-xs text-zinc-600 italic py-2">등록된 선수가 없습니다.</li>
          )}
        </ul>
      </div>

      {/* Tier 3 Pool */}
      <div className="bg-[#1E1E1E] p-4 rounded-lg border border-white/5 flex-1 overflow-hidden flex flex-col">
        <h3 className="text-emerald-400 text-xs font-black mb-3 flex items-center gap-2 uppercase tracking-wider">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> Tier 3 Pool
        </h3>
        <ul className="space-y-2 text-sm flex-1 overflow-y-auto pr-1">
          {players.tier3.map((name) => {
            const isPicked = pickedPlayers.has(name);
            return (
              <li
                key={name}
                className={`flex justify-between py-1 border-b border-white/5 transition-all duration-300 ${
                  isPicked ? 'text-white/20 italic line-through' : 'text-zinc-100'
                }`}
              >
                <span>{name}</span>
                {isPicked ? (
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest scale-90">
                    PICKED
                  </span>
                ) : (
                  <span className="text-[10px] bg-zinc-800/60 text-zinc-400 border border-zinc-700/30 px-1.5 py-0.5 rounded font-medium">
                    대기중
                  </span>
                )}
              </li>
            );
          })}
          {players.tier3.length === 0 && (
            <li className="text-xs text-zinc-600 italic py-2">등록된 선수가 없습니다.</li>
          )}
        </ul>
      </div>
    </aside>
  );
}
