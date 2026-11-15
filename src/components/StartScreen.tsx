import React from 'react';
import { Play, Star, BookOpen, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { STAGES } from '../data/stagesData';
import { soundManager } from '../utils/audio';

import { UserStats } from '../utils/sheetSync';

interface StartScreenProps {
  unlockedStages: number[];
  stageScores: Record<number, { stars: number; completedTimes: number }>;
  onStartGame: (stageId?: number) => void;
  onOpenPrincipleForStage: (stageId: number) => void;
  onUnlockAll?: () => void;
  onResetProgress?: () => void;
  userStats: UserStats;
  onOpenSheetModal: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  unlockedStages,
  stageScores,
  onStartGame,
  onOpenPrincipleForStage,
  onUnlockAll,
  onResetProgress,
  userStats,
  onOpenSheetModal,
}) => {
  // Find highest unlocked stage to resume
  const highestUnlocked = Math.max(...unlockedStages, 1);
  const totalStars = Object.values(stageScores).reduce((sum, s) => sum + (s.stars || 0), 0);

  return (
    <div id="start-screen-container" className="max-w-md mx-auto min-h-screen px-4 py-6 flex flex-col space-y-6 animate-fadeIn pb-12">
      {/* Hero Welcome Banner */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold text-amber-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>초중등 눈높이 맞춤 영어 기초문법</span>
        </div>

        {/* Big Catchy Title */}
        <h1 className="font-fun text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <span>영어 야호~!</span>
        </h1>

        <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
          버스에서, 쉬는 시간에 3분 완성! <br />
          외우지 않고 8단계로 끝내는 기초문법 게임
        </p>

        {/* Main V-sign Action Button: "v자 손모양 클릭" */}
        <div className="pt-2 pb-1">
          <button
            id="start-v-sign-btn"
            onClick={() => {
              soundManager.playTap();
              onStartGame(highestUnlocked);
            }}
            className="group relative inline-flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white rounded-3xl shadow-lg border-4 border-amber-300 active:scale-95 transition-all w-64 mx-auto"
          >
            {/* Animated Peace/Victory Hand Icon */}
            <span
              className="text-6xl mb-1 transform group-hover:scale-115 group-hover:-rotate-6 transition-transform duration-200"
              role="img"
              aria-label="v자 손모양"
            >
              ✌️
            </span>
            <span className="font-fun text-xl font-black tracking-wide">
              {highestUnlocked > 1 ? `${highestUnlocked}단계 이어하기!` : '게임 시작하기!'}
            </span>
            <span className="text-[11px] font-bold opacity-90 mt-0.5 bg-amber-600/30 px-3 py-0.5 rounded-full">
              (v자 손모양 클릭!)
            </span>
          </button>
        </div>

        {/* Student Profile & Google Sheet Stats Bar */}
        <div
          onClick={() => {
            soundManager.playTap();
            onOpenSheetModal();
          }}
          className="bg-white/90 hover:bg-white border-2 border-amber-200 hover:border-amber-400 p-3 rounded-2xl shadow-xs transition-all cursor-pointer text-left space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">👤</span>
              <span className="font-fun font-bold text-sm text-slate-800">
                학습자: <span className="text-amber-700 underline decoration-amber-300 decoration-2">{userStats.name || '학생'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">(이름 수정)</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              <span>📊 구글 시트 연동</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 bg-amber-50/60 px-3 py-1.5 rounded-xl border border-amber-100">
            <span>🎮 총 플레이: <b>{userStats.play_count}회</b></span>
            <span>⭕ 정답: <b className="text-emerald-600">{userStats.correct_count}</b></span>
            <span>❌ 오답: <b className="text-rose-500">{userStats.wrong_count}</b></span>
          </div>
        </div>

        {/* Total Stars Counter */}
        <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-amber-200 shadow-2xs text-xs font-bold text-slate-700">
          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          <span>모은 별: <strong className="text-amber-600">{totalStars}</strong> / 24개</span>
        </div>
      </div>

      {/* 8 Stages Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-fun text-base font-bold text-slate-800 flex items-center gap-1.5">
            <span>🗺️ 8단계 문법 지도</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            원하는 단계를 직접 터치해보세요
          </span>
        </div>

        {/* Stages List (Vertical Scrollable for Smartphone) */}
        <div className="space-y-2.5">
          {STAGES.map((stage) => {
            const isUnlocked = unlockedStages.includes(stage.id);
            const score = stageScores[stage.id];
            const stars = score?.stars || 0;

            return (
              <div
                key={stage.id}
                id={`stage-card-${stage.id}`}
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  isUnlocked
                    ? 'bg-white border-amber-200 hover:border-amber-400 shadow-xs'
                    : 'bg-slate-100 border-slate-200 opacity-65'
                }`}
              >
                {/* Left: Badge & Titles */}
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => {
                    if (isUnlocked) {
                      soundManager.playTap();
                      onStartGame(stage.id);
                    }
                  }}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-fun shrink-0 shadow-2xs ${
                      isUnlocked ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isUnlocked ? stage.badge : <Lock className="w-5 h-5 text-slate-400" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-fun font-black text-sm text-slate-900">
                        {stage.title}
                      </span>
                      {stars === 3 && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-tight">
                      {stage.shortDesc}
                    </p>
                  </div>
                </div>

                {/* Right: Stars & Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Principle card peek */}
                  <button
                    onClick={() => {
                      soundManager.playTap();
                      onOpenPrincipleForStage(stage.id);
                    }}
                    className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                    title="원리 먼저 보기"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>

                  {/* Play button */}
                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        soundManager.playTap();
                        onStartGame(stage.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-fun font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>도전</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold px-2 py-1">
                      잠김
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Quick Controls */}
        <div className="pt-4 flex items-center justify-center gap-3 text-xs text-slate-500">
          {unlockedStages.length < 8 && onUnlockAll && (
            <button
              onClick={() => {
                soundManager.playTap();
                onUnlockAll();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 font-medium text-slate-700 transition-colors"
            >
              🔓 모든 단계 해금하기
            </button>
          )}
          {onResetProgress && (
            <button
              onClick={() => {
                soundManager.playTap();
                onResetProgress();
              }}
              className="px-3 py-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              진행상황 초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
