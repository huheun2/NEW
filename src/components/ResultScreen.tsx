import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, ArrowRight, Home, Star, Award, BookOpen, ExternalLink, CheckCircle, RefreshCw, Fingerprint, BarChart2 } from 'lucide-react';
import { StageInfo, StageResult } from '../types';
import { soundManager } from '../utils/audio';
import { UserStats, GOOGLE_SHEET_URL } from '../utils/sheetSync';

interface ResultScreenProps {
  stage: StageInfo;
  result: StageResult;
  hasNextStage: boolean;
  onReview: () => void;
  onNextStage: () => void;
  onQuit: () => void;
  onOpenPrinciple: () => void;
  userStats?: UserStats;
  sheetLogStatus?: { status: 'sending' | 'success' | 'idle' | 'error'; message?: string };
  onOpenSheetModal?: () => void;
  sentenceTapSummary?: {
    summaryString: string;
    averageTaps: number;
    totalTaps: number;
    sentenceCount: number;
  } | null;
  sentenceTapDetails?: Record<string, number>;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  stage,
  result,
  hasNextStage,
  onReview,
  onNextStage,
  onQuit,
  onOpenPrinciple,
  userStats,
  sheetLogStatus,
  onOpenSheetModal,
  sentenceTapSummary,
  sentenceTapDetails,
}) => {
  // Fire confetti and play clear sound if passed
  useEffect(() => {
    if (result.isCleared) {
      soundManager.playStageClear();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch {
        // Confetti fallback
      }
    } else {
      soundManager.playWrong();
    }
  }, [result.isCleared]);

  const tapEntries = sentenceTapDetails ? Object.entries(sentenceTapDetails) : [];

  return (
    <div id="result-screen-container" className="max-w-md mx-auto min-h-[85vh] p-4 flex flex-col justify-between animate-fadeIn">
      {/* Upper Card: Celebration & Rewards */}
      <div className="bg-white rounded-3xl p-6 border-4 border-amber-300 shadow-xl text-center space-y-4">
        {/* Stage & Title */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
            {stage.title} 완료!
          </span>
          <h2 className="font-fun text-2xl font-black text-slate-900 mt-2">
            {result.isCleared ? '야호! 스테이지 클리어! 🎉' : '아쉬워요! 다시 도전해볼까요? 💪'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {result.isCleared
              ? `${stage.categoryName} 원리를 멋지게 익혔어요!`
              : '원리를 다시 읽어보고 새 문제로 복습해봐요!'}
          </p>
        </div>

        {/* Stars Display */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-2.5 rounded-2xl transition-all duration-500 ${
                starIdx <= result.stars
                  ? 'bg-amber-100 text-amber-500 scale-110 shadow-sm'
                  : 'bg-slate-100 text-slate-300'
              }`}
            >
              <Star
                className={`w-8 h-8 ${
                  starIdx <= result.stars ? 'fill-amber-400 text-amber-500' : ''
                }`}
              />
            </div>
          ))}
        </div>

        {/* Reward Badge (스테이지 클리어 보상 화면) */}
        {result.isCleared && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center text-2xl shadow-sm">
              {stage.badge}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                <Award className="w-3.5 h-3.5" />
                <span>성공 보상 배지 획득!</span>
              </div>
              <div className="font-fun font-bold text-slate-900 text-sm">
                "{stage.categoryName} 마스터"
              </div>
            </div>
          </div>
        )}

        {/* Score Summary Box */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
          <div className="p-2 bg-white rounded-xl">
            <span className="text-slate-500 block">이번 단계 정답</span>
            <span className="font-fun font-bold text-emerald-600 text-base">
              {result.correctCount} / {result.totalQuestions}
            </span>
          </div>
          <div className="p-2 bg-white rounded-xl">
            <span className="text-slate-500 block">이번 단계 정답률</span>
            <span className="font-fun font-bold text-amber-600 text-base">
              {Math.round((result.correctCount / result.totalQuestions) * 100)}%
            </span>
          </div>
        </div>

        {/* 문장별 탭 빈도 및 평균 통계 박스 */}
        <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-left space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs">
              <Fingerprint className="w-4 h-4 text-indigo-600" />
              <span>각 문장별 탭(클릭) 빈도 & 평균</span>
            </div>
            {sentenceTapSummary && (
              <span className="text-xs font-black text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                평균 {sentenceTapSummary.averageTaps}회
              </span>
            )}
          </div>

          {/* 문장별 탭 목록 */}
          {tapEntries.length > 0 ? (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {tapEntries.map(([sentence, count], idx) => (
                <div
                  key={idx}
                  className="p-2 bg-white/95 rounded-xl border border-indigo-100 flex items-center justify-between text-[11px] gap-2 shadow-2xs"
                >
                  <span className="font-fun text-slate-800 truncate" title={sentence}>
                    {sentence}
                  </span>
                  <span className="shrink-0 font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px]">
                    {count}회 탭
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">문장별 탭 데이터가 기록되었습니다.</p>
          )}

          <div className="flex items-center justify-between text-[10px] text-indigo-700/80 pt-1 border-t border-indigo-200/50">
            <span>총 문장수: <b>{sentenceTapSummary?.sentenceCount || tapEntries.length}개</b></span>
            <span>총 탭 수: <b>{sentenceTapSummary?.totalTaps || 0}회</b></span>
            <span>평균 탭 빈도: <b className="text-indigo-900">{sentenceTapSummary?.averageTaps || 0}회</b></span>
          </div>
        </div>

        {/* Google Sheet Sync Record Status Banner */}
        <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-left space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <BarChart2 className="w-3.5 h-3.5 text-amber-700" />
              <span>📊 구글 시트 연동 기록</span>
              {sheetLogStatus?.status === 'sending' && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
              )}
              {sheetLogStatus?.status === 'success' && (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </div>
            <a
              href={GOOGLE_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline"
            >
              <span>시트 보기</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center justify-between text-slate-700 font-medium flex-wrap gap-1">
              <span>이름: <b>{userStats?.name || '학생'}</b></span>
              <span>플레이: <b>{userStats?.play_count || 0}회</b></span>
              <span>정답: <b className="text-emerald-600">{userStats?.correct_count || 0}</b></span>
              <span>오답: <b className="text-rose-500">{userStats?.wrong_count || 0}</b></span>
            </div>
            {sheetLogStatus?.status === 'success' ? (
              <p className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200 leading-snug">
                ✅ 구글 시트에 문장별 탭 빈도·평균(sentence_taps, average_taps)과 학습 통계가 안전하게 저장되었습니다!
              </p>
            ) : sheetLogStatus?.status === 'sending' ? (
              <p className="text-amber-700 font-medium bg-white/70 px-2 py-1 rounded-lg">
                구글 시트로 문장별 탭 빈도·평균 및 학습 기록을 전송 중입니다...
              </p>
            ) : sheetLogStatus?.status === 'error' ? (
              <div className="flex items-center justify-between bg-rose-50 p-2 rounded-lg border border-rose-200 text-rose-800 text-[11px]">
                <span className="truncate">{sheetLogStatus.message}</span>
                {onOpenSheetModal && (
                  <button
                    onClick={() => {
                      soundManager.playTap();
                      onOpenSheetModal();
                    }}
                    className="shrink-0 underline font-bold ml-2 text-rose-900"
                  >
                    설정 확인
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-500">.env.local 웹 앱 URL로 자동 저장됩니다.</span>
                {onOpenSheetModal && (
                  <button
                    onClick={() => {
                      soundManager.playTap();
                      onOpenSheetModal();
                    }}
                    className="font-bold text-amber-700 underline text-[11px]"
                  >
                    연동 설정
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Principle Review Button */}
        <button
          onClick={() => {
            soundManager.playTap();
            onOpenPrinciple();
          }}
          className="w-full py-2.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span>💡 이번 단계 핵심 원리 다시 확인하기</span>
        </button>
      </div>

      {/* Action Buttons: Strictly in requested order from top to bottom:
          1) [복습하기]
          2) [다음 단계]
          3) [그만하기] */}
      <div className="space-y-3 pt-4 pb-2">
        {/* 1. 복습하기 */}
        <button
          id="result-review-btn"
          onClick={() => {
            soundManager.playTap();
            onReview();
          }}
          className="w-full py-4 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-fun font-bold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 border-2 border-amber-600"
        >
          <RotateCcw className="w-5 h-5" />
          <span>[복습하기] (새로운 문제로 다시 풀기)</span>
        </button>

        {/* 2. 다음 단계 */}
        <button
          id="result-next-btn"
          onClick={() => {
            soundManager.playTap();
            onNextStage();
          }}
          className={`w-full py-4 px-5 rounded-2xl font-fun font-bold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 ${
            result.isCleared
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-600'
              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-2 border-emerald-300'
          }`}
        >
          <span>[다음 단계]</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* 3. 그만하기 */}
        <button
          id="result-quit-btn"
          onClick={() => {
            soundManager.playTap();
            onQuit();
          }}
          className="w-full py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-fun font-bold text-sm active:scale-98 transition-all flex items-center justify-center gap-2 border border-slate-300"
        >
          <Home className="w-4 h-4 text-slate-500" />
          <span>[그만하기]</span>
        </button>
      </div>
    </div>
  );
};
