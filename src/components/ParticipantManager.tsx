import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { TIER_INFO } from '../constants';
import { Plus, Trash2, RotateCcw, Save, ShieldAlert, Users, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ParticipantManagerProps {
  players: {
    tier1: string[];
    tier2: string[];
    tier3: string[];
  };
  onSave: (updatedPlayers: { tier1: string[]; tier2: string[]; tier3: string[] }) => void;
  onReset: () => void;
  user: User | null;
  isSaving: boolean;
}

export default function ParticipantManager({
  players,
  onSave,
  onReset,
  user,
  isSaving
}: ParticipantManagerProps) {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [tempPlayers, setTempPlayers] = useState(players);

  // Sync state if players change from parent (e.g. reset)
  React.useEffect(() => {
    setTempPlayers(players);
  }, [players]);

  const currentTierPlayers = tempPlayers[`tier${activeTab}`];
  const tierStyle = TIER_INFO[activeTab];

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPlayerName.trim();
    if (!name) return;
    if (currentTierPlayers.includes(name)) {
      alert('이미 존재하는 참가자 이름입니다.');
      return;
    }
    if (currentTierPlayers.length >= 12) {
      alert('각 티어당 최대 12명까지만 등록할 수 있습니다.');
      return;
    }

    const updated = {
      ...tempPlayers,
      [`tier${activeTab}`]: [...currentTierPlayers, name]
    };
    setTempPlayers(updated);
    setNewPlayerName('');
  };

  const handleDeletePlayer = (nameToDelete: string) => {
    const updated = {
      ...tempPlayers,
      [`tier${activeTab}`]: currentTierPlayers.filter(name => name !== nameToDelete)
    };
    setTempPlayers(updated);
  };

  const handleApplyChanges = () => {
    // Validate that each tier has at least 6 players for a 6-team CK
    if (tempPlayers.tier1.length < 6 || tempPlayers.tier2.length < 6 || tempPlayers.tier3.length < 6) {
      alert('팀 편성을 하려면 각 티어당 최소 6명의 참가자가 필요합니다.');
      return;
    }
    onSave(tempPlayers);
  };

  return (
    <div id="participant-manager-section" className="bg-[#18181F] border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#4F46E5]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-[#FFD700]">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              참가자 명단 관리
              <span className="text-xs bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/50">참가자 수정</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">각 티어별 6인 이상의 멤버를 구성해 커스텀 매치를 생성할 수 있습니다.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onReset}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition rounded-lg"
          >
            <RotateCcw size={14} />
            스맵 로스터 초기화
          </button>
          <button
            onClick={handleApplyChanges}
            disabled={isSaving}
            type="button"
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-black bg-[#FFD700] hover:bg-[#FFE240] disabled:opacity-50 transition rounded-lg shadow-md shadow-yellow-950/20"
          >
            <Save size={14} />
            {isSaving ? '저장 중...' : '명단 설정 적용'}
          </button>
        </div>
      </div>

      {/* Warning if not signed in */}
      {!user && (
        <div className="mb-4 p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/90 leading-relaxed">
            현재 <strong>비로그인 상태(게스트)</strong>입니다. 명단을 수정하면 브라우저에 임시로 저장되며, 로그인을 하시면 여러 기기에서 영구적으로 동기화할 수 있습니다.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([1, 2, 3] as const).map((tierNum) => {
          const isActive = activeTab === tierNum;
          const info = TIER_INFO[tierNum];
          const count = tempPlayers[`tier${tierNum}`].length;

          return (
            <button
              key={tierNum}
              onClick={() => setActiveTab(tierNum)}
              type="button"
              className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${
                isActive
                  ? 'bg-zinc-900 border-zinc-700 shadow-inner'
                  : 'bg-[#1C1C24] border-zinc-900 hover:bg-zinc-900/40 hover:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${info.textSolo}`}>{info.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-zinc-900 rounded font-mono text-zinc-400 border border-zinc-800">
                  {count}명
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 truncate mt-1">{info.subName}</p>
              {isActive && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${info.color}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-[#121216] border border-zinc-900 rounded-xl p-4">
        {/* Add Player Input Form */}
        <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder={`${activeTab}티어 새 참가자 이름 입력...`}
            maxLength={10}
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none text-sm text-white px-3.5 py-2 rounded-lg transition"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-indigo-950/30 shrink-0"
          >
            <Plus size={16} />
            추가
          </button>
        </form>

        {/* Players Pill Grid */}
        {currentTierPlayers.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            등록된 참가자가 없습니다. 새로운 참가자를 추가해 보세요.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {currentTierPlayers.map((name) => (
              <motion.div
                layout
                key={name}
                className="flex items-center justify-between pl-3 pr-1 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg group hover:border-zinc-700 transition"
              >
                <span className="text-sm text-zinc-100 font-medium truncate">{name}</span>
                <button
                  onClick={() => handleDeletePlayer(name)}
                  type="button"
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded transition"
                  title="삭제"
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-900 pt-3">
          <div className="flex items-center gap-1">
            <Sparkles size={11} className="text-[#FFD700]" />
            <span>최소 6명에서 최대 12명까지 티어별 명단을 매칭할 수 있습니다.</span>
          </div>
          <span>총 {tempPlayers.tier1.length + tempPlayers.tier2.length + tempPlayers.tier3.length}명 등록됨</span>
        </div>
      </div>
    </div>
  );
}
