import React, { useState, useEffect, useRef } from 'react';
import { UserStats, Message, CharacterId, MissionLogEntry, RandomEvent, UserEvents, SpecialMission, UserProgress, StoryBranch, WeekEndChoice, SideMission, SeasonalEvent } from './types';
import { CHARACTERS } from './constants';
import { getRandomEvent } from './randomEvents';
import { getUnlockableSpecialMissions, SPECIAL_MISSIONS } from './specialMissions';
import { generateSideMission } from './services/sideMissionService';
import { getActiveSeasonalEvent } from './seasonalEvents';
import StatsRadar from './components/StatsRadar';
import CharacterSelector from './components/CharacterSelector';
import LevelUpModal from './components/LevelUpModal';
import EventModal from './components/EventModal';
import SpecialMissionModal from './components/SpecialMissionModal';
import WeekendModal from './components/WeekendModal';
import SideMissionBanner from './components/SideMissionBanner';
import SeasonalBanner from './components/SeasonalBanner';
import TypewriterText from './components/TypewriterText';
import { generateResponse } from './services/geminiService';
import { saveContent } from './services/driveLogger';
import { Send, Zap, Loader2, AlertTriangle, Trash2, Trophy, Archive, X, Menu, Calendar, Book, Sparkles } from 'lucide-react';

// Updated storage key for V2 data structure
const STORAGE_KEY = 'CLOVER_PROTOCOL_STATE_V2';
const REMINDER_STORAGE_KEY = 'CLOVER_LAST_REMINDED_DATE';

type Histories = Record<CharacterId, Message[]>;

const App: React.FC = () => {
    // --- State Management ---
    const loadState = <T,>(key: string, fallback: T): T => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const val = parsed[key];
                if (val !== undefined && val !== null) {
                    // Safety check: Ensure loaded state matches current structure
                    if (typeof fallback === 'object' && !Array.isArray(fallback) && fallback !== null) {
                        return { ...fallback, ...val };
                    }
                    return val;
                }
            }
        } catch (e) {
            console.error("Failed to load state", e);
        }
        return fallback;
    };

    const [day, setDay] = useState<number>(() => loadState('day', 1));
    const [stats, setStats] = useState<UserStats>(() => loadState('stats', {
        kindness: 20,
        fun: 20,
        memory: 20,
        articulation: 20,
        efficiency: 20,
        streak: 0,
        lastLoginDate: '',
    }));

    const initialDailyProgress: Record<CharacterId, boolean> = {
        [CharacterId.JACK]: false,
        [CharacterId.HAL]: false,
        [CharacterId.SAKI]: false,
        [CharacterId.REN]: false,
        [CharacterId.OPERATOR]: false,
        [CharacterId.HIDDEN]: false,
    };
    const [dailyProgress, setDailyProgress] = useState<Record<CharacterId, boolean>>(() => loadState('dailyProgress', initialDailyProgress));
    const [histories, setHistories] = useState<Histories>(() => loadState('histories', {
        [CharacterId.JACK]: [], [CharacterId.HAL]: [], [CharacterId.SAKI]: [], [CharacterId.REN]: [],
        [CharacterId.OPERATOR]: [], [CharacterId.HIDDEN]: [],
    }));
    const [missionLogs, setMissionLogs] = useState<MissionLogEntry[]>(() => loadState('missionLogs', []));
    const [currentCharacterId, setCurrentCharacterId] = useState<CharacterId>(() => loadState('currentCharacterId', CharacterId.JACK));
    const [unlockedCharacters, setUnlockedCharacters] = useState<CharacterId[]>(() => loadState('unlockedCharacters', []));

    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [activeLogTab, setActiveLogTab] = useState<'missions' | 'trivia'>('missions');
    const [showMenu, setShowMenu] = useState(false); // Mobile Menu Toggle
    const [error, setError] = useState<string | null>(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    const [showLevelUp, setShowLevelUp] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<RandomEvent | null>(null);
    const [userEvents, setUserEvents] = useState<UserEvents>(() => loadState('userEvents', {
        triggeredToday: [],
        lastEventCheck: '',
    }));
    const scrollRef = useRef<HTMLDivElement>(null);
    const isSendingRef = useRef(false);

    const [showSpecialMission, setShowSpecialMission] = useState(false);
    const [userProgress, setUserProgress] = useState<UserProgress>(() => loadState('userProgress', {
        unlockedSpecialMissions: [],
        completedSpecialMissions: [],
    }));
    const [showWeekend, setShowWeekend] = useState(false);
    const [weekEndChoices, setWeekEndChoices] = useState<WeekEndChoice[]>(() => loadState('weekEndChoices', []));
    const [activeSideMission, setActiveSideMission] = useState<SideMission | null>(null);
    const [seasonalEvent, setSeasonalEvent] = useState<SeasonalEvent | null>(null);

    const availableSpecialMissions = getUnlockableSpecialMissions(stats, userProgress.unlockedSpecialMissions);

    const currentHistory = histories[currentCharacterId] || [];
    const currentCharacter = CHARACTERS[currentCharacterId] || CHARACTERS[CharacterId.JACK];
    const completedCount = Object.values(dailyProgress || {}).filter(Boolean).length;
    const totalMissions = 6;

    // --- Effects ---
    useEffect(() => {
        try {
            const stateToSave = { day, stats, histories, missionLogs, currentCharacterId, dailyProgress, unlockedCharacters, userEvents, userProgress, weekEndChoices };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (e) { console.error("Failed to save state", e); }
    }, [day, stats, histories, missionLogs, currentCharacterId, dailyProgress, unlockedCharacters, userEvents, userProgress, weekEndChoices]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [histories, currentCharacterId, isLoading]);

    useEffect(() => {
        setInputText('');
        setError(null);
    }, [currentCharacterId]);

    // Streak Logic
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (stats.lastLoginDate !== today) {
            const lastDate = new Date(stats.lastLoginDate || 0);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toISOString().split('T')[0];

            let newStreak = stats.streak;
            if (stats.lastLoginDate === yesterdayString) {
                // Consecutive login (handled when completing mission usually, but here checking login)
                // Note: Simplistic approach. Usually streak updates on action completion.
                // Let's update streak only on mission completion to make it meaningful.
            } else if (stats.lastLoginDate && stats.lastLoginDate < yesterdayString) {
                // Streak broken
                newStreak = 0;
                setStats(prev => ({ ...prev, streak: 0, lastLoginDate: today }));
            }
        }
    }, []);

    // Random Event Check on Login
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (userEvents.lastEventCheck !== today) {
            // 日が変わったら今日のイベントをリセット
            const updatedEvents: UserEvents = {
                triggeredToday: [],
                lastEventCheck: today,
            };
            setUserEvents(updatedEvents);

            // ランダムイベントチェック
            const event = getRandomEvent([]);
            if (event) {
                setCurrentEvent(event);
            }
        }
    }, []);

    // Special Mission Unlock Check
    useEffect(() => {
        const unlockable = getUnlockableSpecialMissions(stats, userProgress.unlockedSpecialMissions);
        if (unlockable.length > 0) {
            setShowSpecialMission(true);
            // 解放済みに追加
            setUserProgress(prev => ({
                ...prev,
                unlockedSpecialMissions: [...prev.unlockedSpecialMissions, ...unlockable.map(m => m.id)]
            }));
        }
    }, [stats]);

    // Weekend Check (Saturday)
    useEffect(() => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 6) {
            const currentWeek = Math.floor(day / 7);
            const alreadyChosen = weekEndChoices.find(c => c.week === currentWeek);
            if (!alreadyChosen) {
                setShowWeekend(true);
            }
        }
    }, [day, weekEndChoices]);

    // Seasonal Event Check
    useEffect(() => {
        const activeEvent = getActiveSeasonalEvent();
        setSeasonalEvent(activeEvent);
    }, []);

    // Side Mission Check (occasionally)
    useEffect(() => {
        const mission = generateSideMission(day);
        if (mission) {
            setActiveSideMission(mission);
        }
    }, [day]);

    // --- Logic ---
    const handleAcceptEvent = () => {
        if (!currentEvent) return;

        // ステータス報酬を付与
        if (currentEvent.statReward && currentEvent.statAmount) {
            setStats(prev => ({
                ...prev,
                [currentEvent.statReward!]: Math.min(prev[currentEvent.statReward!] + currentEvent.statAmount, 100)
            }));
        }

        // イベントをトリガー済みに追加
        setUserEvents(prev => ({
            ...prev,
            triggeredToday: [...prev.triggeredToday, currentEvent.id]
        }));

        setCurrentEvent(null);
    };

    const handleCloseEvent = () => {
        setCurrentEvent(null);
    };

    const handleStartSpecialMission = (missionId: string, characterId?: CharacterId) => {
        setShowSpecialMission(false);
        if (characterId) {
            setCurrentCharacterId(characterId);
        }
        // 特別ミッションをAIに依頼する
        const mission = SPECIAL_MISSIONS.find(m => m.id === missionId);
        if (mission) {
            setTimeout(() => {
                handleSendMessage(`特別ミッション「${mission.title}」を開始する`);
            }, 300);
        }
    };

    const handleCloseSpecialMission = () => {
        setShowSpecialMission(false);
    };

    const handleSelectWeekendBranch = (branch: StoryBranch) => {
        const currentWeek = Math.floor(day / 7);
        setWeekEndChoices(prev => [...prev, { week: currentWeek, selectedBranch: branch, completed: true }]);
        setShowWeekend(false);

        if (branch !== 'solo') {
            setCurrentCharacterId(branch);
            setTimeout(() => {
                handleSendMessage('週末ミッションを開始する');
            }, 300);
        }
    };

    const handleCloseWeekend = () => {
        setShowWeekend(false);
    };

    const handleAcceptSideMission = () => {
        if (!activeSideMission) return;

        // ステータス報酬を付与
        if (activeSideMission.statReward && activeSideMission.statAmount) {
            setStats(prev => ({
                ...prev,
                [activeSideMission.statReward]: Math.min(prev[activeSideMission.statReward] + activeSideMission.statAmount, 100)
            }));
        }

        // 完了に設定
        setActiveSideMission(prev => prev ? { ...prev, completed: true } : null);

        // キャラクターに切り替えてAIに依頼
        setCurrentCharacterId(activeSideMission.characterId);
        setTimeout(() => {
            handleSendMessage(`ボーナスミッション「${activeSideMission.title}」を開始する`);
        }, 300);
    };

    const handleDismissSideMission = () => {
        setActiveSideMission(null);
    };

    const handleDismissSeasonalEvent = () => {
        setSeasonalEvent(null);
    };

    const findMissionTitle = (history: Message[], currentDay: number): string => {
        const regex = new RegExp(`\\*\\*【Day ${currentDay}: (.+?)】\\*\\*`);
        for (let i = history.length - 1; i >= 0; i--) {
            const match = history[i].text.match(regex);
            if (match && match[1]) return match[1];
        }
        return "Secret Mission";
    };

    const findMissionTrivia = (history: Message[]): string => {
        // ストーリーパートを抽出する正規表現
        const regex = /\*\*\[ストーリーパート\]\*\*\n?([\s\S]+?)(?=\n?\*\*\[今日の指令\]\*\*|$)/;
        for (let i = history.length - 1; i >= 0; i--) {
            const match = history[i].text.match(regex);
            if (match && match[1]) return match[1].trim();
        }
        return "";
    };

    const handleSendMessage = async (text: string = inputText) => {
        if (!text.trim() || isLoading || isSendingRef.current) return;
        isSendingRef.current = true;
        setError(null);

        const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: text, timestamp: Date.now() };

        setHistories((prev) => ({ ...prev, [currentCharacterId]: [...(prev[currentCharacterId] || []), userMessage] }));
        setInputText('');
        setIsLoading(true);

        try {
            const contextHistory = histories[currentCharacterId] || [];
            const historyForAI = [...contextHistory, userMessage];
            const responseText = await generateResponse(contextHistory, currentCharacterId, day, text, stats);

            let cleanedText = responseText;
            if (responseText.includes('[MISSION_COMPLETE]')) {
                cleanedText = responseText.replace('[MISSION_COMPLETE]', '');
                const charEntry = CHARACTERS[currentCharacterId];
                if (charEntry) {
                    const charStat = charEntry.stat;
                    setStats(prev => ({ ...prev, [charStat]: Math.min(prev[charStat] + 15, 100) }));
                }
                setDailyProgress(prev => ({ ...prev, [currentCharacterId]: true }));

                const existingTitle = findMissionTitle(historyForAI, day);
                const trivia = findMissionTrivia(historyForAI);
                const newLog: MissionLogEntry = {
                    id: Date.now().toString(), day, characterId: currentCharacterId, title: existingTitle, trivia, completedAt: Date.now()
                };
                setMissionLogs(prev => {
                    if (prev.some(log => log.day === day && log.characterId === currentCharacterId)) return prev;
                    return [...prev, newLog];
                });

                // Day Clear Check
                const nextProgress = { ...dailyProgress, [currentCharacterId]: true };
                if (Object.values(nextProgress).every(Boolean)) {
                    // Streak Update
                    const today = new Date().toISOString().split('T')[0];
                    if (stats.lastLoginDate !== today) {
                        setStats(prev => ({ ...prev, streak: prev.streak + 1, lastLoginDate: today }));
                    }
                    setShowLevelUp(true);

                    // --- Character Unlock: HIDDEN ---
                    if (!unlockedCharacters.includes(CharacterId.HIDDEN)) {
                      setUnlockedCharacters(prev => [...prev, CharacterId.HIDDEN]);
                    }
                }

                // --- Character Unlock: OPERATOR ---
                const nextStats = { ...stats };
                if (charEntry) {
                   nextStats[charEntry.stat] = Math.min(nextStats[charEntry.stat] + 15, 100);
                }
                
                if (nextStats.efficiency >= 50 && !unlockedCharacters.includes(CharacterId.OPERATOR)) {
                   setUnlockedCharacters(prev => [...prev, CharacterId.OPERATOR]);
                }
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(), sender: 'ai', characterId: currentCharacterId, text: cleanedText, timestamp: Date.now()
            };
            setHistories((prev) => ({
                ...prev, [currentCharacterId]: [...(prev[currentCharacterId] || []), aiMessage]
            }));

            // Google Driveにチャット履歴を保存
            saveChatToDrive(currentCharacterId, [...historyForAI, aiMessage]);
        } catch (err) {
            setError("Network Glitch. Try again.");
        } finally {
            setIsLoading(false);
            setTimeout(() => { isSendingRef.current = false; }, 100);
        }
    };

    const saveChatToDrive = (charId: CharacterId, messages: Message[]) => {
        const charName = CHARACTERS[charId]?.name || charId;
        const markdown = formatChatAsMarkdown(charName, messages);
        saveContent('chat', `${charName}_Day${day}`, markdown);
    };

    const formatChatAsMarkdown = (charName: string, messages: Message[]): string => {
        let md = `# ${charName} - Day ${day}\n\n`;
        messages.forEach(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString('ja-JP');
            if (msg.sender === 'user') {
                md += `## 👤 User (${time})\n${msg.text}\n\n`;
            } else {
                md += `## 🤖 ${charName} (${time})\n${msg.text}\n\n`;
            }
        });
        return md;
    };

    const handleDeleteLog = (id: string) => {
        setMissionLogs(prev => prev.filter(log => log.id !== id));
        setConfirmingDeleteId(null);
    };

    const handleNextDay = () => {
        setShowLevelUp(false);
        setDay(d => d + 1);
        setDailyProgress(initialDailyProgress);
        // Optional: Clear history for new day or keep it? Keeping it for context is better usually.
        // But for clean slate feel:
        // setHistories({ [CharacterId.JACK]: [], [CharacterId.HAL]: [], [CharacterId.SAKI]: [], [CharacterId.REN]: [] });
    };


    const handleStartMission = () => {
        if (dailyProgress[currentCharacterId]) {
            handleSendMessage("今日のノルマは達成済みだが、何か？");
        } else {
            handleSendMessage("今日のミッションを頼む");
        }
    };

    const handleResetData = () => {
        if (window.confirm("WARNING: 全データを初期化しますか？")) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(REMINDER_STORAGE_KEY);
            window.location.reload();
        }
    };

    // --- Render ---
    const renderMessageText = (text: string) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            if (line.trim().startsWith('**[') && line.trim().endsWith(']**')) {
                return <h3 key={i} className="text-pink-500 font-display text-lg mt-4 mb-2 -rotate-1 transform inline-block bg-white border-2 border-black px-2 shadow-[2px_2px_0_0_#000]">{line.replace(/\*\*/g, '')}</h3>;
            }
            if (line.trim().startsWith('**【') && line.trim().endsWith('】**')) {
                return <div key={i} className="bg-yellow-300 border-2 border-black p-2 my-4 shadow-[4px_4px_0_0_#000]"><h2 className="text-lg font-black text-slate-900">{line.replace(/\*\*/g, '')}</h2></div>;
            }
            if (line.trim().startsWith('・')) {
                return <li key={i} className="ml-4 text-slate-800 font-bold list-disc my-1">{line.replace('・', '')}</li>;
            }
            if (line.trim() === '---') {
                return <hr key={i} className="border-t-2 border-dashed border-slate-300 my-4" />;
            }
            return <p key={i} className="mb-2 leading-relaxed text-slate-800 font-medium">{line}</p>;
        });
    };

    // Determine dynamic colors based on character
    const getCharTheme = (id: CharacterId) => {
        switch (id) {
            case CharacterId.JACK: return { bg: 'bg-rose-50', accent: 'text-rose-500', border: 'border-rose-400' };
            case CharacterId.HAL: return { bg: 'bg-amber-50', accent: 'text-amber-600', border: 'border-amber-400' };
            case CharacterId.SAKI: return { bg: 'bg-indigo-50', accent: 'text-indigo-600', border: 'border-indigo-400' };
            case CharacterId.REN: return { bg: 'bg-emerald-50', accent: 'text-emerald-600', border: 'border-emerald-400' };
            default: return { bg: 'bg-white', accent: 'text-black', border: 'border-black' };
        }
    }
    const theme = getCharTheme(currentCharacterId);

    return (
        <div className="min-h-screen flex flex-col md:flex-row md:h-screen overflow-hidden relative">
            {showLevelUp && <LevelUpModal day={day} onNext={handleNextDay} />}
            {currentEvent && <EventModal event={currentEvent} onAccept={handleAcceptEvent} onClose={handleCloseEvent} />}
            {showSpecialMission && (
                <SpecialMissionModal
                    missions={getUnlockableSpecialMissions(stats, userProgress.unlockedSpecialMissions)}
                    onStartMission={handleStartSpecialMission}
                    onClose={handleCloseSpecialMission}
                />
            )}
            {showWeekend && (
                <WeekendModal
                    week={Math.floor(day / 7)}
                    onSelect={handleSelectWeekendBranch}
                    onClose={handleCloseWeekend}
                />
            )}


            {/* --- Overlay Menu (Mobile) --- */}
            {showMenu && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#f43f5e] w-full max-w-sm p-6 flex flex-col gap-4 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-display text-2xl">MENU</h2>
                            <button onClick={() => setShowMenu(false)}><X className="w-8 h-8 border-2 border-black bg-white hover:bg-slate-100" /></button>
                        </div>
                        <button onClick={() => { setShowLogModal(true); setShowMenu(false); }} className="neo-btn bg-cyan-300 p-4 flex items-center gap-2 text-lg">
                            <Archive /> Mission Archives
                        </button>
                        <button onClick={handleResetData} className="neo-btn bg-slate-200 hover:bg-red-400 p-4 flex items-center gap-2 text-lg">
                            <Trash2 /> Reset Data
                        </button>
                        <div className="mt-4 border-t-2 border-black pt-4">
                            <p className="text-xs font-bold text-center">CLOVER PROTOCOL V3.1</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Left Panel: The Agent Card --- */}
            <section className="w-full md:w-5/12 lg:w-4/12 flex flex-col relative z-10 bg-white md:border-r-4 md:border-black">
                {/* Header Bar */}
                <div className="h-16 border-b-4 border-black bg-slate-900 text-white flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-400 border-2 border-white text-black flex items-center justify-center font-black rounded-full animate-spin-slow">C</div>
                        <h1 className="font-display text-xl tracking-tighter">CLOVER <span className="text-yellow-400">PROTOCOL</span></h1>
                    </div>
                    <button onClick={() => setShowMenu(!showMenu)} className="md:hidden p-2 bg-white text-black border-2 border-black neo-btn">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {/* Agent Visual Area */}
                <div className="flex-1 relative overflow-hidden bg-slate-100 p-4 flex flex-col">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>

                    {/* Top Info Strip */}
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="neo-box px-3 py-1 bg-white">
                            <span className="text-xs font-bold text-slate-500">DAY</span>
                            <span className="text-2xl font-black block leading-none">{day.toString().padStart(2, '0')}</span>
                        </div>
                        <div className="neo-box px-3 py-1 bg-white flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-500">PROGRESS</span>
                            <span className="text-lg font-black block leading-none text-emerald-600">{completedCount} / {totalMissions}</span>
                        </div>
                    </div>

                    {/* Main Character Image Card */}
                    <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-[250px]">
                        <div className={`relative w-64 h-80 border-4 border-black bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-transform duration-500 hover:rotate-1`}>
                            <img src={currentCharacter.imageUrl} alt={currentCharacter.name} className="w-full h-full object-cover grayscale contrast-125" />
                            <div className="absolute bottom-0 left-0 right-0 bg-yellow-400 border-t-4 border-black p-2">
                                <h2 className="font-display text-2xl text-black text-center uppercase tracking-tighter">{currentCharacter.name}</h2>
                                <p className="text-center text-xs font-bold font-mono uppercase bg-black text-white mx-4 -mb-4 py-1 border-2 border-white shadow-md relative z-20">
                                    {currentCharacter.role}
                                </p>
                            </div>
                            {/* Floating Stats Widget */}
                            <div className="absolute -right-10 -top-6 w-32 h-32 hidden md:block z-30 transform hover:scale-110 transition-transform cursor-pointer">
                                <StatsRadar stats={stats} />
                            </div>
                        </div>
                    </div>

                    {/* Squad Selector */}
                    <div className="mt-8 relative z-20">
                        <div className="flex items-center gap-2 mb-2 pl-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                            <span className="text-xs font-black bg-black text-white px-2 py-0.5">SELECT AGENT</span>
                        </div>
                        <CharacterSelector selectedId={currentCharacterId} onSelect={setCurrentCharacterId} dailyProgress={dailyProgress} unlockedCharacters={unlockedCharacters} />
                    </div>
                </div>

                {/* Desktop Footer Menu */}
                <div className="hidden md:flex p-4 border-t-4 border-black bg-slate-50 gap-2">
                    <button onClick={() => setShowLogModal(true)} className="flex-1 neo-btn bg-white hover:bg-cyan-200 py-3 flex items-center justify-center gap-2 text-sm">
                        <Archive className="w-4 h-4" /> ARCHIVES
                    </button>
                    <button onClick={handleResetData} className="neo-btn bg-white hover:bg-rose-200 px-4 flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </section>

            {/* --- Right Panel: The Mission Terminal --- */}
            <main className="flex-1 bg-white flex flex-col relative overflow-hidden">
                {/* Background Pattern for Right Side */}
                <div className="absolute inset-0 bg-slate-50 opacity-50 pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 50%, #e2e8f0 50%, #e2e8f0 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }}>
                </div>

                {/* Chat Header */}
                <div className="bg-white relative z-10">
                    {/* Side Mission Banner */}
                    {activeSideMission && (
                        <div className="mx-4 mt-4">
                            <SideMissionBanner
                                mission={activeSideMission}
                                onAccept={handleAcceptSideMission}
                                onDismiss={handleDismissSideMission}
                            />
                        </div>
                    )}

                    {/* Seasonal Event Banner */}
                    {seasonalEvent && (
                        <SeasonalBanner
                            event={seasonalEvent}
                            onDismiss={handleDismissSeasonalEvent}
                        />
                    )}

                    {/* Main Chat Header */}
                    <div className="p-4 border-b-4 border-black flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                            <span className="font-mono font-bold text-sm tracking-widest text-slate-500">
                                CONNECTING TO: <span className="text-black bg-yellow-300 px-1">{currentCharacter.name.toUpperCase()}</span>
                            </span>
                        </div>
                        <div className="text-xs font-black border-2 border-black px-2 py-1 bg-slate-200">
                            SECURE LINE
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 relative z-10" ref={scrollRef}>
                    {currentHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-80">
                            <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0_0_#fbbf24] text-center max-w-md transform rotate-2">
                                <h2 className="font-display text-3xl mb-4">READY?</h2>
                                <p className="font-bold text-slate-600 mb-6">
                                    日々の退屈を破壊する準備はいいか？<br />
                                    エージェント {currentCharacter.name} が待機中。
                                </p>
                                <button
                                    onClick={handleStartMission}
                                    disabled={dailyProgress[currentCharacterId]}
                                    className="neo-btn bg-black text-white px-8 py-4 text-xl flex items-center gap-2 mx-auto hover:bg-slate-800 disabled:bg-slate-400"
                                >
                                    {dailyProgress[currentCharacterId] ? 'MISSION CLEAR' : 'START MISSION'} <Zap className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        currentHistory.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                             max-w-[85%] md:max-w-[70%] relative group
                             ${msg.sender === 'user' ? 'mr-2' : 'ml-2'}
                         `}>
                                    {/* Speech Bubble Tail */}
                                    <div className={`absolute top-4 w-4 h-4 border-b-2 border-black bg-white rotate-45 
                                 ${msg.sender === 'user' ? '-right-2 border-r-2 bg-slate-900' : '-left-2 border-l-2'}
                             `}></div>

                                    {/* Message Body */}
                                    <div className={`
                                 border-2 border-black p-5 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]
                                 ${msg.sender === 'user'
                                            ? 'bg-slate-900 text-white rounded-xl rounded-tr-none'
                                            : 'bg-white text-slate-800 rounded-xl rounded-tl-none'}
                             `}>
                                        {msg.sender === 'ai' && (
                                            <div className="mb-2 flex items-center gap-2 border-b border-dashed border-slate-300 pb-1">
                                                <span className="font-black text-xs bg-black text-white px-1">{currentCharacter.name}</span>
                                                <span className="text-[10px] font-mono text-slate-400 ml-auto">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}
                                        <div className="font-medium text-sm md:text-base">
                                            {renderMessageText(msg.text)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-yellow-300 border-2 border-black px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-[2px_2px_0_0_#000]">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                DECODING TRANSMISSION...
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-100 border-2 border-red-500 text-red-600 p-4 rounded-lg font-bold text-center">
                            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t-4 border-black relative z-20">
                    <div className="flex items-end gap-2 max-w-4xl mx-auto">
                        <div className="flex-1 relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder={dailyProgress[currentCharacterId] ? "ミッション完了。雑談モード中。" : "メッセージを入力..."}
                                className="w-full neo-input bg-slate-50 p-4 min-h-[60px] max-h-[120px] resize-none rounded-lg text-slate-800 font-bold placeholder:text-slate-400 text-lg"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={isLoading || !inputText.trim()}
                            className="neo-btn bg-black text-white h-[60px] w-[60px] flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:bg-slate-300"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </main>

            {/* --- Log Modal --- */}
            {showLogModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl animate-in zoom-in-95">
                        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-cyan-300">
                            <h2 className="font-display text-2xl flex items-center gap-2">
                                <Archive className="w-6 h-6" /> MISSION LOGS
                            </h2>
                            <button onClick={() => setShowLogModal(false)} className="neo-btn p-2 bg-white hover:bg-red-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Tab Switcher */}
                        <div className="flex border-b-4 border-black bg-slate-100">
                            <button 
                                onClick={() => setActiveLogTab('missions')}
                                className={`flex-1 py-3 font-black text-sm flex items-center justify-center gap-2 transition-all ${activeLogTab === 'missions' ? 'bg-white' : 'hover:bg-slate-200'}`}
                            >
                                <Trophy className="w-4 h-4" /> MISSIONS
                            </button>
                            <button 
                                onClick={() => setActiveLogTab('trivia')}
                                className={`flex-1 py-3 font-black text-sm flex items-center justify-center gap-2 transition-all ${activeLogTab === 'trivia' ? 'bg-white' : 'hover:bg-slate-200'}`}
                            >
                                <Sparkles className="w-4 h-4" /> KNOWLEDGE PIECES
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                            {activeLogTab === 'missions' ? (
                                missionLogs.length === 0 ? (
                                    <div className="text-center py-10 font-mono font-bold text-slate-400 border-2 border-dashed border-slate-300">
                                        NO MISSION DATA
                                    </div>
                                ) : (
                                    (() => {
                                        const grouped = missionLogs.reduce((acc, log) => {
                                            const dateStr = new Date(log.completedAt).toLocaleDateString();
                                            if (!acc[dateStr]) acc[dateStr] = [];
                                            acc[dateStr].push(log);
                                            return acc;
                                        }, {} as Record<string, MissionLogEntry[]>);

                                        return (Object.entries(grouped) as [string, MissionLogEntry[]][])
                                            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                                            .map(([date, logs]) => (
                                                <div key={date} className="space-y-3">
                                                    <div className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-sm border-y border-slate-300 px-3 py-1 -mx-6">
                                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                            <Calendar className="w-3 h-3" /> {date}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {logs.sort((a, b) => b.completedAt - a.completedAt).map((log) => {
                                                            const char = CHARACTERS[log.characterId];
                                                            return (
                                                                <div key={log.id} className="neo-box p-4 flex items-center gap-4 bg-white">
                                                                    <div className="w-14 h-14 border-2 border-black overflow-hidden bg-slate-200 shrink-0">
                                                                        <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover grayscale" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex gap-2 mb-1">
                                                                            <span className="bg-black text-white text-[10px] font-black px-1.5 py-0.5">DAY {log.day}</span>
                                                                            <span className="bg-slate-200 text-black text-[10px] font-bold px-1.5 py-0.5">{new Date(log.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        </div>
                                                                        <h3 className="font-bold text-base truncate">{log.title}</h3>
                                                                        <p className="text-[10px] font-mono text-slate-500">HANDLER: {char.name}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {confirmingDeleteId === log.id ? (
                                                                            <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                                                                                <button
                                                                                    onClick={() => handleDeleteLog(log.id)}
                                                                                    className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                                                                >
                                                                                    消去
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setConfirmingDeleteId(null)}
                                                                                    className="bg-slate-200 text-black text-[10px] font-black px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                                                                >
                                                                                    却下
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500" />
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
                                            ));
                                    })()
                                )
                            ) : (
                                /* Trivia Tab Content */
                                <div className="space-y-4">
                                    {missionLogs.filter(l => l.trivia).length === 0 ? (
                                        <div className="text-center py-10 font-mono font-bold text-slate-400 border-2 border-dashed border-slate-300">
                                            NO KNOWLEDGE COLLECTED
                                        </div>
                                    ) : (
                                        missionLogs.filter(l => l.trivia).map((log) => {
                                            const char = CHARACTERS[log.characterId];
                                            return (
                                                <div key={log.id} className="neo-box p-5 bg-slate-50 border-2 border-black border-l-8" style={{ borderLeftColor: char.color.includes('rose') ? '#fb7185' : char.color.includes('amber') ? '#fbbf24' : char.color.includes('indigo') ? '#818cf8' : '#34d399' }}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Book className="w-4 h-4 text-slate-400" />
                                                        <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5">FRAGMENT FR-D{log.day}</span>
                                                        <span className="text-[10px] font-bold text-slate-500 italic ml-auto">{char.role}</span>
                                                    </div>
                                                    <blockquote className="text-sm font-bold text-slate-800 leading-relaxed pl-4 border-l-2 border-slate-300 italic">
                                                        "{log.trivia}"
                                                    </blockquote>
                                                    <div className="mt-3 text-right">
                                                        <p className="text-[10px] font-black text-slate-400">— {char.name}</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;