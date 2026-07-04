import React from 'react';
import { Team } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface TeamsDisplayProps {
  teams: Team[];
  revealedStatus: {
    [teamId: number]: {
      1: boolean;
      2: boolean;
      3: boolean;
    };
  };
}

export default function TeamsDisplay({ teams, revealedStatus }: TeamsDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team, idx) => {
        const teamId = team.id;
        const isTeamFullyRevealed = 
          revealedStatus[teamId]?.[1] && 
          revealedStatus[teamId]?.[2] && 
          revealedStatus[teamId]?.[3];

        return (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className={`bg-[#1E1E1E] border border-white/5 rounded-lg overflow-hidden transition-all shadow-xl relative flex flex-col justify-between p-5 min-h-[220px] ${
              isTeamFullyRevealed 
                ? 'border-t-4 border-t-[#FFD700] hover:shadow-yellow-950/5' 
                : 'border-t-4 border-t-[#FFD700]/40'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <span className={`text-sm font-black tracking-wide flex items-center gap-1.5 ${
                  isTeamFullyRevealed ? 'text-[#FFD700]' : 'text-[#FFD700]/70'
                }`}>
                  🏆 {team.name}
                </span>
                <span className="text-[10px] text-white/40 font-mono font-bold">
                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1} / {teams.length < 10 ? `0${teams.length}` : teams.length}
                </span>
              </div>

              {/* Tiers with left border accent */}
              <div className="space-y-4">
                {/* Tier 1 */}
                <div className={`border-l-2 pl-3 transition-colors ${
                  revealedStatus[teamId]?.[1] ? 'border-[#FFD700]' : 'border-[#FFD700]/20'
                }`}>
                  <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Tier 1</div>
                  <AnimatePresence mode="wait">
                    {revealedStatus[teamId]?.[1] && team.players[1] ? (
                      <motion.div
                        key={team.players[1]}
                        initial={{ filter: 'blur(4px)', opacity: 0, x: -5 }}
                        animate={{ filter: 'blur(0px)', opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-lg font-black text-white tracking-wide"
                      >
                        {team.players[1]}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="waiting-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-lg font-bold text-white/10 italic select-none"
                      >
                        WAITING...
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tier 2 */}
                <div className={`border-l-2 pl-3 transition-colors ${
                  revealedStatus[teamId]?.[2] ? 'border-cyan-400' : 'border-cyan-400/20'
                }`}>
                  <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Tier 2</div>
                  <AnimatePresence mode="wait">
                    {revealedStatus[teamId]?.[2] && team.players[2] ? (
                      <motion.div
                        key={team.players[2]}
                        initial={{ filter: 'blur(4px)', opacity: 0, x: -5 }}
                        animate={{ filter: 'blur(0px)', opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-lg font-black text-white tracking-wide"
                      >
                        {team.players[2]}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="waiting-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-lg font-bold text-white/10 italic select-none"
                      >
                        WAITING...
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tier 3 */}
                <div className={`border-l-2 pl-3 transition-colors ${
                  revealedStatus[teamId]?.[3] ? 'border-emerald-400' : 'border-emerald-400/20'
                }`}>
                  <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Tier 3</div>
                  <AnimatePresence mode="wait">
                    {revealedStatus[teamId]?.[3] && team.players[3] ? (
                      <motion.div
                        key={team.players[3]}
                        initial={{ filter: 'blur(4px)', opacity: 0, x: -5 }}
                        animate={{ filter: 'blur(0px)', opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-lg font-black text-white tracking-wide"
                      >
                        {team.players[3]}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="waiting-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-lg font-bold text-white/10 italic select-none"
                      >
                        WAITING...
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {isTeamFullyRevealed && (
              <div className="mt-4 flex justify-end">
                <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded font-bold flex items-center gap-1 tracking-tight">
                  <Sparkles size={8} className="animate-spin" />
                  REVEALED
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
