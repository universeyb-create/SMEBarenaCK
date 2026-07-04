import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  loginAnonymously, 
  logout, 
  saveDrawHistory, 
  getDrawHistory, 
  listDrawHistories, 
  saveCustomParticipants, 
  getCustomParticipants,
  submitAccessRequest,
  getAccessRequest,
  listAllAccessRequests,
  updateAccessRequestStatus,
  AccessRequestData
} from './firebase';
import { Team, DrawHistory } from './types';
import { DEFAULT_PLAYERS, TIER_INFO } from './constants';
import { audioSynth } from './components/AudioSynth';
import { downloadTeamsAsImage } from './components/CanvasExport';
import Header from './components/Header';
import DrawControls from './components/DrawControls';
import TeamsDisplay from './components/TeamsDisplay';
import ParticipantManager from './components/ParticipantManager';
import DrawHistoryList from './components/DrawHistoryList';
import ParticipantPoolsSidebar from './components/ParticipantPoolsSidebar';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Tv, 
  HelpCircle, 
  X, 
  ChevronRight, 
  ArrowRight, 
  Users, 
  ExternalLink, 
  Sparkles, 
  Info,
  Clock,
  VolumeX,
  Volume2,
  Lock,
  ShieldAlert,
  Check,
  Hourglass,
  Ban,
  UserCheck,
  ShieldCheck,
  LogIn
} from 'lucide-react';

// Initialize empty teams with dynamic count
const createEmptyTeams = (count: number = 6): Team[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `TEAM ${i + 1}`,
    players: {
      1: '',
      2: '',
      3: ''
    }
  }));
};

const createEmptyRevealedStatus = (count: number = 6) => {
  const status: { [key: number]: { 1: boolean; 2: boolean; 3: boolean } } = {};
  for (let i = 1; i <= count; i++) {
    status[i] = { 1: false, 2: false, 3: false };
  }
  return status;
};

// Shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  // Authentication & Users
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<{ code: string; message: string } | null>(null);

  // Access Permission States
  const [accessRequest, setAccessRequest] = useState<AccessRequestData | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessStatus, setAccessStatus] = useState<'approved' | 'pending' | 'rejected' | 'none' | 'checking'>('checking');
  const [requestNote, setRequestNote] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [allRequests, setAllRequests] = useState<AccessRequestData[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Roster / Players List
  const [players, setPlayers] = useState<{ tier1: string[]; tier2: string[]; tier3: string[] }>(DEFAULT_PLAYERS);
  const [isRosterSaving, setIsRosterSaving] = useState(false);

  const defaultCount = Math.max(DEFAULT_PLAYERS.tier1.length, DEFAULT_PLAYERS.tier2.length, DEFAULT_PLAYERS.tier3.length);

  // Main drawing state
  const [teams, setTeams] = useState<Team[]>(createEmptyTeams(defaultCount));
  const [revealedStatus, setRevealedStatus] = useState(createEmptyRevealedStatus(defaultCount));
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMethod, setDrawMethod] = useState<'auto' | 'step'>('auto');
  const [currentDrawnTiers, setCurrentDrawnTiers] = useState({ 1: false, 2: false, 3: false });

  // OBS overlays and views
  const [isObsMode, setIsObsMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // History & Sharing
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [sharedDrawLoaded, setSharedDrawLoaded] = useState(false);
  const [sharedDrawTitle, setSharedDrawTitle] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoadingShared, setIsLoadingShared] = useState(false);

  // Real-time Clock overlay
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load all access requests for admin
  const loadAllRequests = async () => {
    try {
      const data = await listAllAccessRequests();
      setAllRequests(data);
    } catch (err: any) {
      if (err?.message?.includes('offline') || err?.code === 'unavailable') {
        console.warn('Firebase is offline. Skipping admin access requests fetch.');
      } else {
        console.warn('Failed to load all access requests', err);
      }
    }
  };

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setIsCheckingAccess(true);
        if (currentUser.email === 'universeyb@gmail.com') {
          setAccessStatus('approved');
          setIsCheckingAccess(false);
          loadAllRequests();
        } else {
          try {
            const req = await getAccessRequest(currentUser.uid);
            if (req) {
              setAccessRequest(req);
              setAccessStatus(req.status);
            } else {
              setAccessRequest(null);
              setAccessStatus('none');
            }
          } catch (err: any) {
            if (err?.message?.includes('offline') || err?.code === 'unavailable') {
              console.warn('Firebase is offline. Could not fetch access request status.');
            } else {
              console.warn('Failed to load access request status', err);
            }
            setAccessStatus('none');
          } finally {
            setIsCheckingAccess(false);
          }
        }

        // Load custom roster from Firestore
        try {
          const custom = await getCustomParticipants(currentUser.uid);
          if (custom) {
            const customRoster = {
              tier1: custom.tier1 || DEFAULT_PLAYERS.tier1,
              tier2: custom.tier2 || DEFAULT_PLAYERS.tier2,
              tier3: custom.tier3 || DEFAULT_PLAYERS.tier3
            };
            setPlayers(customRoster);
            const count = Math.max(customRoster.tier1.length, customRoster.tier2.length, customRoster.tier3.length);
            setTeams(createEmptyTeams(count));
            setRevealedStatus(createEmptyRevealedStatus(count));
          }
        } catch (err: any) {
          if (err?.message?.includes('offline') || err?.code === 'unavailable') {
            console.warn('Firebase is offline. Using default players list.');
          } else {
            console.warn('Failed to load custom participants roster', err);
          }
        }
      } else {
        setAccessRequest(null);
        setAccessStatus('none');
        setIsCheckingAccess(false);
      }
      setAuthLoading(false);
    });

    // Check for shared draw link in URL params
    const params = new URLSearchParams(window.location.search);
    const drawId = params.get('drawId');
    if (drawId) {
      loadSharedDrawing(drawId);
    }

    // Refresh history feed
    loadHistoryList();

    // Setup digital clock
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(clockInterval);
    };
  }, []);

  // Fetch histories
  const loadHistoryList = async () => {
    try {
      const data = await listDrawHistories();
      setHistoryList(data);
    } catch (err: any) {
      if (err?.message?.includes('offline') || err?.code === 'unavailable') {
        console.warn('Firebase is offline. Skipping history feed load.');
      } else {
        console.warn('Error fetching drawing history list', err);
      }
    }
  };

  // Shared Draw Loader
  const loadSharedDrawing = async (id: string) => {
    setIsLoadingShared(true);
    try {
      const draw = await getDrawHistory(id);
      if (draw) {
        const formattedTeams: Team[] = draw.teams.map((t: any) => ({
          id: t.id,
          name: t.name,
          players: {
            1: t.tier1,
            2: t.tier2,
            3: t.tier3
          }
        }));
        setTeams(formattedTeams);
        
        // Mark all players as revealed
        const status = createEmptyRevealedStatus(formattedTeams.length);
        for (let i = 1; i <= formattedTeams.length; i++) {
          status[i] = { 1: true, 2: true, 3: true };
        }
        setRevealedStatus(status);
        setCurrentDrawnTiers({ 1: true, 2: true, 3: true });
        setSharedDrawLoaded(true);
        setSharedDrawTitle(draw.title || '공유받은 팀 추첨 결과');
        audioSynth.playTada();
      } else {
        alert('존재하지 않거나 삭제된 공유 추첨 결과입니다.');
      }
    } catch (err: any) {
      if (err?.message?.includes('offline') || err?.code === 'unavailable') {
        console.warn('Firebase is offline. Skipping shared draw loading.');
      } else {
        console.warn('Error loading shared draw', err);
      }
    } finally {
      setIsLoadingShared(false);
    }
  };

  // Auth logins
  const handleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
      loadHistoryList();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        console.warn('Google Auth popup closed by user.');
      } else {
        console.warn('Google Auth login failed', err);
      }
      setAuthError({
        code: err?.code || 'unknown',
        message: err?.message || String(err)
      });
    }
  };

  const handleLoginAnonymously = async () => {
    setAuthError(null);
    try {
      await loginAnonymously();
      loadHistoryList();
    } catch (err: any) {
      console.warn('Guest login failed', err);
      alert('게스트 로그인에 실패했습니다: ' + (err?.message || err));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setPlayers(DEFAULT_PLAYERS);
      const defaultCount = Math.max(DEFAULT_PLAYERS.tier1.length, DEFAULT_PLAYERS.tier2.length, DEFAULT_PLAYERS.tier3.length);
      setTeams(createEmptyTeams(defaultCount));
      setRevealedStatus(createEmptyRevealedStatus(defaultCount));
      setCurrentDrawnTiers({ 1: false, 2: false, 3: false });
    } catch (err) {
      console.warn('Logout failed', err);
    }
  };

  // Access requests action handlers
  const handleRequestAccess = async () => {
    if (!user) return;
    setIsSubmittingRequest(true);
    try {
      const req = await submitAccessRequest(
        user.uid,
        user.email || '',
        user.displayName || '사용자',
        requestNote
      );
      setAccessRequest(req);
      setAccessStatus('pending');
    } catch (err) {
      console.error('Failed to submit access request', err);
      alert('접속 승인 신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleRefreshAccessStatus = async () => {
    if (!user) return;
    setIsCheckingAccess(true);
    try {
      if (user.email === 'universeyb@gmail.com') {
        setAccessStatus('approved');
        await loadAllRequests();
      } else {
        const req = await getAccessRequest(user.uid);
        if (req) {
          setAccessRequest(req);
          setAccessStatus(req.status);
        } else {
          setAccessRequest(null);
          setAccessStatus('none');
        }
      }
    } catch (err) {
      console.error('Failed to refresh access status', err);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const handleApproveRequest = async (targetUserId: string) => {
    try {
      await updateAccessRequestStatus(targetUserId, 'approved');
      await loadAllRequests();
    } catch (err) {
      alert('승인 처리에 실패했습니다: ' + err);
    }
  };

  const handleRejectRequest = async (targetUserId: string) => {
    try {
      await updateAccessRequestStatus(targetUserId, 'rejected');
      await loadAllRequests();
    } catch (err) {
      alert('거절 처리에 실패했습니다: ' + err);
    }
  };

  // Roster saves
  const handleSaveRoster = async (updated: { tier1: string[]; tier2: string[]; tier3: string[] }) => {
    setPlayers(updated);
    const count = Math.max(updated.tier1.length, updated.tier2.length, updated.tier3.length);
    setTeams(createEmptyTeams(count));
    setRevealedStatus(createEmptyRevealedStatus(count));
    setCurrentDrawnTiers({ 1: false, 2: false, 3: false });

    if (user) {
      setIsRosterSaving(true);
      try {
        await saveCustomParticipants(user.uid, updated.tier1, updated.tier2, updated.tier3);
      } catch (err) {
        console.error('Failed to save custom roster persistently', err);
      } finally {
        setIsRosterSaving(false);
      }
    }
  };

  const handleResetRoster = () => {
    if (window.confirm('참가자 명단을 Smeb 공식 아레나 로스터로 초기화하시겠습니까?')) {
      handleSaveRoster(DEFAULT_PLAYERS);
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioSynth.setMute(nextMute);
  };

  // 1. Entire Auto Draw
  const handleAutoDraw = async () => {
    if (isDrawing) return;

    // Shuffle arrays
    const s1 = shuffleArray<string>(players.tier1);
    const s2 = shuffleArray<string>(players.tier2);
    const s3 = shuffleArray<string>(players.tier3);

    // Prepare fresh drawing state
    const teamCount = Math.max(players.tier1.length, players.tier2.length, players.tier3.length);
    const newTeams = createEmptyTeams(teamCount);
    for (let i = 0; i < teamCount; i++) {
      newTeams[i].players[1] = s1[i] || '';
      newTeams[i].players[2] = s2[i] || '';
      newTeams[i].players[3] = s3[i] || '';
    }

    setTeams(newTeams);
    setRevealedStatus(createEmptyRevealedStatus(teamCount));
    setIsDrawing(true);
    setDrawMethod('auto');
    setCurrentDrawnTiers({ 1: true, 2: true, 3: true });
    setSharedDrawLoaded(false);

    // Run beautiful sequential stagger reveal animations
    // T1 teams 1~N, then T2 teams 1~N, then T3 teams 1~N
    let stepCount = 0;
    const totalSteps = teamCount * 3;

    const interval = setInterval(() => {
      const tierIndex = Math.floor(stepCount / teamCount) + 1; // 1, 2, or 3
      const teamIndex = (stepCount % teamCount) + 1; // 1 to teamCount

      setRevealedStatus(prev => ({
        ...prev,
        [teamIndex]: {
          ...prev[teamIndex],
          [tierIndex as 1|2|3]: true
        }
      }));

      audioSynth.playTick();
      stepCount++;

      if (stepCount >= totalSteps) {
        clearInterval(interval);
        setIsDrawing(false);
        audioSynth.playTada();
        
        // Save to cloud Firestore persistently
        saveCompletedDraw(newTeams, 'auto');
      }
    }, 280);
  };

  // 2. Step-by-step Draws
  const handleStepDraw = async (tierNum: 1 | 2 | 3) => {
    if (isDrawing || currentDrawnTiers[tierNum]) return;

    const currentTierPlayers = players[`tier${tierNum}`];
    const shuffled = shuffleArray<string>(currentTierPlayers);

    // Deep copy teams to avoid direct state mutation
    const updatedTeams = teams.map(team => ({
      ...team,
      players: {
        ...team.players
      }
    }));

    const teamCount = teams.length;

    for (let i = 0; i < teamCount; i++) {
      updatedTeams[i].players[tierNum] = shuffled[i] || '';
    }

    setTeams(updatedTeams);
    setIsDrawing(true);
    setDrawMethod('step');
    setSharedDrawLoaded(false);

    // Sequence reveal
    let teamIdx = 1;
    const interval = setInterval(() => {
      const currentTeamIdx = teamIdx;
      setRevealedStatus(prev => ({
        ...prev,
        [currentTeamIdx]: {
          ...prev[currentTeamIdx],
          [tierNum]: true
        }
      }));

      audioSynth.playTick();
      teamIdx++;

      if (teamIdx > teamCount) {
        clearInterval(interval);
        setIsDrawing(false);
        
        const nextDrawn = { ...currentDrawnTiers, [tierNum]: true };
        setCurrentDrawnTiers(nextDrawn);

        const allDone = nextDrawn[1] && nextDrawn[2] && nextDrawn[3];
        if (allDone) {
          audioSynth.playTada();
          saveCompletedDraw(updatedTeams, 'step');
        } else {
          audioSynth.playReveal();
        }
      }
    }, 350);
  };

  // Helper to save draw history
  const saveCompletedDraw = async (completedTeams: Team[], method: 'auto' | 'step') => {
    const creatorId = user ? user.uid : 'guest';
    const drawId = `draw_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const formattedTeams = completedTeams.map(t => ({
      id: t.id,
      name: t.name,
      tier1: t.players[1],
      tier2: t.players[2],
      tier3: t.players[3]
    }));

    try {
      await saveDrawHistory(drawId, creatorId, method, formattedTeams);
      loadHistoryList();
    } catch (err) {
      console.error('Failed to persist drawing to Firestore', err);
    }
  };

  // 3. Reset Board
  const handleResetBoard = () => {
    if (isDrawing) return;
    audioSynth.playReset();
    const teamCount = Math.max(players.tier1.length, players.tier2.length, players.tier3.length);
    setTeams(createEmptyTeams(teamCount));
    setRevealedStatus(createEmptyRevealedStatus(teamCount));
    setCurrentDrawnTiers({ 1: false, 2: false, 3: false });
    setSharedDrawLoaded(false);
  };

  // 4. Copy to Clipboard
  const handleCopyText = () => {
    let resultText = `🏆 스맵의 아레나 CK 팀 뽑기 결과 🏆\n`;
    resultText += `────────────────────────────\n`;
    
    teams.forEach(t => {
      const p1 = revealedStatus[t.id]?.[1] ? t.players[1] : '-';
      const p2 = revealedStatus[t.id]?.[2] ? t.players[2] : '-';
      const p3 = revealedStatus[t.id]?.[3] ? t.players[3] : '-';

      resultText += `🏆 ${t.name}\n`;
      resultText += `Tier 1 : ${p1}\n`;
      resultText += `Tier 2 : ${p2}\n`;
      resultText += `Tier 3 : ${p3}\n`;
      resultText += `────────────────────────────\n`;
    });

    resultText += `공식 뽑기: Smeb Arena Generator`;

    navigator.clipboard.writeText(resultText)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy', err));
  };

  // 5. Save PNG
  const handleDownloadImage = () => {
    const title = sharedDrawLoaded ? sharedDrawTitle : "스맵의 아레나 CK 팀 뽑기 결과";
    downloadTeamsAsImage(teams, title);
  };

  // Load from history
  const handleLoadFromHistory = (draw: any) => {
    const formatted: Team[] = draw.teams.map((t: any) => ({
      id: t.id,
      name: t.name,
      players: {
        1: t.tier1,
        2: t.tier2,
        3: t.tier3
      }
    }));
    setTeams(formatted);

    const teamCount = formatted.length;
    const status = createEmptyRevealedStatus(teamCount);
    for (let i = 1; i <= teamCount; i++) {
      status[i] = { 1: true, 2: true, 3: true };
    }
    setRevealedStatus(status);
    setCurrentDrawnTiers({ 1: true, 2: true, 3: true });
    setSharedDrawLoaded(true);
    setSharedDrawTitle(draw.title || '불러온 팀 뽑기 결과');
    setShowHistory(false);
    audioSynth.playReveal();
  };

  // Share specific draw link
  const handleShareLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?drawId=${id}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('뽑기 결과의 고유 공유 링크가 클립보드에 복사되었습니다!\n다른 사람에게 전달하여 이 결과를 공유해보세요.');
      })
      .catch(err => console.error('Share link copy failed', err));
  };

  // Check if roster has any custom settings vs defaults
  const hasCustomRoster = 
    JSON.stringify(players.tier1) !== JSON.stringify(DEFAULT_PLAYERS.tier1) ||
    JSON.stringify(players.tier2) !== JSON.stringify(DEFAULT_PLAYERS.tier2) ||
    JSON.stringify(players.tier3) !== JSON.stringify(DEFAULT_PLAYERS.tier3);

  const isApproved = user && (user.email === 'universeyb@gmail.com' || accessStatus === 'approved');
  const showLoader = authLoading || isCheckingAccess;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col font-sans relative selection:bg-indigo-600 selection:text-white">
      
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-[#4F46E5]/10 via-[#4F46E5]/2 to-transparent rounded-b-[100px] blur-3xl pointer-events-none" />

      {/* Header */}
      <Header
        user={user}
        onLogin={handleLogin}
        onLoginAnonymously={handleLoginAnonymously}
        onLogout={handleLogout}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isObsMode={isObsMode}
        onToggleObsMode={() => setIsObsMode(true)}
        onToggleHistory={() => setShowHistory(true)}
        hasCustomRoster={hasCustomRoster}
        isAdmin={user?.email === 'universeyb@gmail.com'}
        onOpenAdminPanel={() => {
          loadAllRequests();
          setShowAdminPanel(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Loader Overlay for Shared Drawing Fetch */}
        {isLoadingShared && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-zinc-300 font-bold text-sm">공유받은 CK 뽑기 결과를 불러오는 중...</p>
          </div>
        )}

        {showLoader ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-2 border-zinc-850 rounded-full" />
              <div className="absolute inset-0 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-zinc-400 font-medium text-xs">사용자 권한 상태를 확인하고 있습니다...</p>
          </div>
        ) : !isApproved ? (
          /* GATEKEEPER INTERFACE */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto my-12"
          >
            <div className="bg-[#12121A] border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              {/* Card top decorative gradient */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-indigo-500 via-[#FFD700] to-pink-500" />
              
              <div className="flex flex-col items-center text-center">
                {/* Lock icon with pulsing ring */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl animate-pulse" />
                  <div className="w-16 h-16 bg-[#181824] border border-zinc-800 rounded-2xl flex items-center justify-center text-amber-400">
                    <Lock size={28} />
                  </div>
                </div>

                <h2 className="text-xl font-black text-white tracking-tight">홈페이지 이용 허가 제한 안내</h2>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  스맵의 아레나 CK 팀 뽑기 프로그램은 관리자의 사전 허가를 받은 사용자만 이용하실 수 있습니다.
                </p>

                {/* Conditional sub-states */}
                {!user ? (
                  // State 1: Not logged in
                  <div className="w-full mt-8 space-y-4">
                    <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-[11px] text-zinc-400 text-left leading-relaxed">
                      📌 이용을 원하시면 아래 <span className="text-[#FFD700] font-bold">구글 계정으로 로그인</span>을 진행하신 뒤, 본인의 방송국 및 신청 정보를 입력하여 <span className="text-white font-bold">접속 승인</span>을 신청해주시기 바랍니다.
                    </div>
                    {authError && (
                      <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-xs text-left leading-relaxed font-medium">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-red-300">
                          <Ban size={14} />
                          로그인 오류 발생 ({authError.code || 'unknown'})
                        </div>
                        <p className="text-[11px] mb-2">{authError.message}</p>
                        <div className="mt-2 text-[10.5px] text-zinc-400 bg-black/40 p-2.5 rounded-lg leading-relaxed">
                          💡 <span className="text-zinc-200 font-bold">원인 및 해결 방법:</span><br />
                          1. 브라우저의 <strong className="text-amber-400 font-semibold">팝업 차단 기능</strong>이 켜져 있는지 확인하고 허용해 주세요.<br />
                          2. 새 도메인으로 배포된 경우 Firebase 콘솔에 도메인을 추가해야 합니다. <strong className="text-indigo-400 font-semibold">Firebase 콘솔 &gt; Authentication &gt; Settings(설정) &gt; Authorized domains(승인된 도메인)</strong> 목록에 아래 도메인을 등록해 주세요:<br />
                          <code className="block mt-1 p-1 bg-zinc-900 text-[9.5px] text-zinc-300 rounded font-mono break-all select-all select-text border border-zinc-800">
                            {window.location.hostname}
                          </code>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleLogin}
                      type="button"
                      className="w-full py-3.5 bg-[#FFD700] hover:bg-[#FFE240] text-black font-extrabold text-xs rounded-xl transition shadow-lg shadow-yellow-950/20 flex items-center justify-center gap-2"
                    >
                      <LogIn size={16} />
                      구글 계정으로 로그인하고 권한 신청하기
                    </button>
                  </div>
                ) : accessStatus === 'none' ? (
                  // State 2: Logged in but has no request submitted
                  <div className="w-full mt-8 space-y-4 text-left">
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4">
                      <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">현재 로그인 계정</div>
                      <div className="flex items-center gap-3 mt-2">
                        {user.photoURL && (
                          <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-full border border-zinc-700" referrerPolicy="no-referrer" />
                        )}
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-zinc-200 truncate">{user.displayName || '사용자'}</div>
                          <div className="text-[10px] text-zinc-500 font-mono truncate">{user.email}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                        <span>📝 접속 승인 신청 사유 / BJ 본인 인증</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={requestNote}
                        onChange={(e) => setRequestNote(e.target.value)}
                        placeholder="예) 아프리카TV BJ 아레나CK 진행용 / 디스코드 ID 및 방송국 주소 등"
                        className="w-full bg-[#181824] border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FFD700] min-h-[90px] transition"
                        maxLength={200}
                      />
                      <p className="text-[10px] text-zinc-600">최대 200자 내로 간략하게 입력해 주세요.</p>
                    </div>

                    <button
                      onClick={handleRequestAccess}
                      disabled={isSubmittingRequest || !requestNote.trim()}
                      type="button"
                      className="w-full py-3.5 bg-[#FFD700] hover:bg-[#FFE240] disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-black font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingRequest ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>신청서를 제출하는 중...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>이용 승인 신청서 제출하기</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleLogout}
                      type="button"
                      className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition rounded-xl text-center text-xs font-bold"
                    >
                      다른 구글 계정으로 로그인
                    </button>
                  </div>
                ) : accessStatus === 'pending' ? (
                  // State 3: Request is pending approval
                  <div className="w-full mt-8 space-y-4">
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col items-center text-center gap-3">
                      <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl animate-pulse">
                        <Hourglass size={24} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-400">가입 승인 대기 중</div>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                          관리자가 귀하의 승인 신청서를 검토하는 중입니다. 승인이 처리될 때까지 잠시만 기다려 주시기 바랍니다.
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-3 text-left space-y-1.5">
                      <div className="text-[10px] text-zinc-500 font-bold">제출된 신청 내역:</div>
                      <div className="text-xs text-zinc-300 font-semibold">{user.displayName || '사용자'} ({user.email})</div>
                      <div className="text-xs text-zinc-400 italic font-medium">"{accessRequest?.note || '신청 사유 입력됨'}"</div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleRefreshAccessStatus}
                        type="button"
                        className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={13} className="text-amber-400 animate-spin" />
                        새로고침
                      </button>
                      <button
                        onClick={handleLogout}
                        type="button"
                        className="flex-1 py-3 bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-zinc-400 text-xs font-bold rounded-xl transition"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                ) : (
                  // State 4: Request was rejected
                  <div className="w-full mt-8 space-y-4">
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col items-center text-center gap-3">
                      <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
                        <Ban size={24} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-400">승인 요청 거절됨</div>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                          죄송합니다. 접속 허가 신청이 거절되었습니다. 비정상적인 권한 요청이거나 본인 인증이 완료되지 않았을 수 있습니다.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAccessStatus('none');
                        setRequestNote(accessRequest?.note || '');
                      }}
                      type="button"
                      className="w-full py-3.5 bg-[#FFD700] hover:bg-[#FFE240] text-black font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      승인 요청 다시 작성하기
                    </button>

                    <button
                      onClick={handleLogout}
                      type="button"
                      className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition rounded-xl text-center text-xs font-bold"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ACTUAL APPLICATION CONTENT */
          <>
            {/* Shared Draw Indicator Banner */}
            {sharedDrawLoaded && !isObsMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-yellow-950/20 border border-yellow-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-xl">
                    <Sparkles size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-yellow-300">{sharedDrawTitle}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">외부 공유 링크를 통해 로드된 공식 보관 결과입니다.</p>
                  </div>
                </div>
                <button
                  onClick={handleResetBoard}
                  type="button"
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-xl transition"
                >
                  새로운 뽑기 시작하기
                </button>
              </motion.div>
            )}

            {/* OBS Exit Mode Bar */}
            {isObsMode && (
              <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#18181F]/90 border border-zinc-800 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl">
                <Clock size={14} className="text-zinc-500 font-mono" />
                <span className="text-xs font-mono font-bold text-zinc-400">
                  {currentTime.toLocaleTimeString('ko-KR', { hour12: false })}
                </span>
                <span className="w-px h-3 bg-zinc-800" />
                
                <button
                  onClick={handleToggleMute}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
                  title={isMuted ? "소리 켜기" : "소리 끄기"}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                <button
                  onClick={() => setIsObsMode(false)}
                  className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 px-2 py-1 rounded-lg transition"
                >
                  <X size={14} />
                  송출 모드 종료
                </button>
              </div>
            )}

            {/* Layout Grid: Left column (lotteries), Right column (rosters) */}
            <div className="space-y-8">
              
              {/* Section: Draws & Controllers (Always visible so controls are accessible in OBS mode as requested) */}
              <DrawControls
                onAutoDraw={handleAutoDraw}
                onStepDraw={handleStepDraw}
                onReset={handleResetBoard}
                onCopyText={handleCopyText}
                onDownloadImage={handleDownloadImage}
                isDrawing={isDrawing}
                isCopied={isCopied}
                currentDrawnTiers={currentDrawnTiers}
              />

              {/* Bento Grid layout */}
              <div className="grid grid-cols-12 gap-6 items-start">
                
                {/* Left Sidebar: Participant Pool (3 columns on large screens) */}
                <div className="col-span-12 lg:col-span-3">
                  <ParticipantPoolsSidebar
                    players={players}
                    teams={teams}
                    revealedStatus={revealedStatus}
                  />
                </div>

                {/* Right Side: Teams Stage (9 columns on large screens) */}
                <div className="col-span-12 lg:col-span-9 space-y-6">
                  <div className="space-y-4">
                    {isObsMode && (
                      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-6">
                        <div className="flex items-center gap-2">
                          <Trophy size={18} className="text-[#FFD700]" />
                          <h2 className="text-md font-black text-white tracking-wider">스맵의 아레나 CK 팀 매칭 결과</h2>
                        </div>
                        <div className="text-xs text-zinc-500 font-bold flex items-center gap-1">
                          <span>LIVE ON</span>
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        </div>
                      </div>
                    )}
                    <TeamsDisplay teams={teams} revealedStatus={revealedStatus} />
                  </div>
                </div>

              </div>

              {/* Section: Custom Participant Lists (Hidden in OBS mode) */}
              {!isObsMode && (
                <ParticipantManager
                  players={players}
                  onSave={handleSaveRoster}
                  onReset={handleResetRoster}
                  user={user}
                  isSaving={isRosterSaving}
                />
              )}

            </div>
          </>
        )}
      </main>

      {/* Shared/History Popup Drawer */}
      {showHistory && (
        <DrawHistoryList
          history={historyList}
          onLoadDraw={handleLoadFromHistory}
          onClose={() => setShowHistory(false)}
          onShareLink={handleShareLink}
          currentUserId={user ? user.uid : 'guest'}
        />
      )}

      {/* Google Auth Fail & Fallback Modal */}
      {authError && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#12121A] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setAuthError(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition"
              title="닫기"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl shrink-0">
                <Info size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">로그인 안내 및 오류 해결</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  구글 로그인 창이 닫혔거나 브라우저에서 팝업이 차단되었습니다. 현재 미리보기(iframe) 환경에서 실행 중이므로 브라우저 보안 정책에 의해 팝업 로그인이 원활하지 않을 수 있습니다.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 mb-6 space-y-3">
              <div className="text-xs font-semibold text-zinc-300">💡 아래 해결 방법을 시도해 보세요:</div>
              
              <div className="space-y-2.5">
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-[#FFD700] mt-0.5 shrink-0">1.</span>
                  <div>
                    <span className="font-bold text-zinc-200">새 탭에서 열어 실행하기 (추천):</span>
                    <p className="text-zinc-400 mt-0.5 leading-relaxed">
                      우측 상단 툴바의 <span className="text-[#FFD700] font-semibold">"새 탭에서 보기"</span> 아이콘을 누르거나 아래 버튼을 클릭해 정식 주소로 접속하면 구글 로그인이 완벽히 작동합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs">
                  <span className="text-[#FFD700] mt-0.5 shrink-0">2.</span>
                  <div>
                    <span className="font-bold text-zinc-200">게스트로 사용하기 (즉시 가능):</span>
                    <p className="text-zinc-400 mt-0.5 leading-relaxed">
                      구글 계정 없이 <span className="text-indigo-400 font-semibold">"게스트 로그인"</span>을 하시면, 뽑기 기록 보관 및 커스텀 참가자 명단 저장 기능을 즉시 제한 없이 이용하실 수 있습니다!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  window.open(window.location.origin, '_blank');
                  setAuthError(null);
                }}
                type="button"
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition"
              >
                <ExternalLink size={14} />
                새 탭에서 서비스 열기
              </button>
              
              <button
                onClick={() => {
                  setAuthError(null);
                  handleLoginAnonymously();
                }}
                type="button"
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-950/50"
              >
                <Sparkles size={14} />
                게스트 로그인으로 시작
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setAuthError(null)}
                className="text-[11px] text-zinc-600 hover:text-zinc-400 transition font-medium"
              >
                나중에 하기 (닫기)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Admin Approval Management Panel (Super Admin Only) */}
      {showAdminPanel && user?.email === 'universeyb@gmail.com' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl bg-[#12121A] border border-zinc-800 rounded-2xl shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FFD700]/10 text-[#FFD700] rounded-xl border border-[#FFD700]/20">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-md font-black text-white">가입 및 접속 승인 관리자 패널</h3>
                  <p className="text-[11px] text-zinc-500 font-semibold uppercase mt-0.5 font-mono">SUPER ADMIN ACCESS ONLY</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="p-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
                title="닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl">
                <div className="text-xs text-zinc-400 font-medium">
                  총 신청 수: <span className="text-white font-bold">{allRequests.length}</span>명
                </div>
                <button
                  onClick={loadAllRequests}
                  type="button"
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-bold rounded-lg transition"
                >
                  새로고침
                </button>
              </div>

              {allRequests.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 text-xs">
                  현재 등록된 접속 승인 신청 내역이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {allRequests.map((req) => (
                    <div 
                      key={req.userId}
                      className="p-4 bg-zinc-900/30 border border-zinc-800/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition"
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{req.displayName}</span>
                          <span className="text-[10px] font-mono text-zinc-500">({req.email})</span>
                          
                          {/* Badge */}
                          {req.status === 'approved' && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold">승인됨</span>
                          )}
                          {req.status === 'pending' && (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-bold animate-pulse">대기 중</span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[9px] font-bold">거절됨</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-300 font-medium bg-[#161620] border border-zinc-800/60 p-2.5 rounded-lg leading-relaxed italic">
                          "{req.note || '사유 없음'}"
                        </div>
                        <div className="text-[9px] text-zinc-500 font-mono">
                          신청 시간: {new Date(req.requestedAt).toLocaleString('ko-KR')}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleApproveRequest(req.userId)}
                          disabled={req.status === 'approved'}
                          type="button"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-transparent text-white font-bold text-xs rounded-lg transition"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.userId)}
                          disabled={req.status === 'rejected'}
                          type="button"
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-transparent text-white font-bold text-xs rounded-lg transition"
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-900/30 border-t border-zinc-800/80 text-center text-[10px] text-zinc-500 font-medium">
              승인 처리된 사용자는 즉시 본 프로그램을 정상적으로 제한 없이 이용할 수 있습니다.
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className={`border-t border-zinc-900 bg-[#0A0A0E] py-8 mt-12 text-center text-xs text-zinc-600 transition-all ${isObsMode ? 'hidden' : ''}`}>
        <p className="font-semibold text-zinc-500">🏆 스맵의 아레나 CK 팀 뽑기 프로그램 🏆</p>
        <p className="mt-4 text-[10px] text-zinc-700">Copyright © 편집노예복덕. All Rights Reserved.</p>
      </footer>

    </div>
  );
}
