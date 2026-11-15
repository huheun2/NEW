import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, Check, Send, AlertCircle, Sparkles, User, RefreshCw, BarChart2, Fingerprint } from 'lucide-react';
import {
  GOOGLE_SHEET_URL,
  UserStats,
  saveUserName,
  updateUserStats,
  getGasUrl,
  saveGasUrl,
  logToGoogleSheet,
  getFormattedTimestamp,
  DEFAULT_GAS_URL,
  loadLastSentenceTapStats,
  formatSentenceTapsSummary,
} from '../utils/sheetSync';
import { soundManager } from '../utils/audio';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  onStatsUpdated: (stats: UserStats) => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  userStats,
  onStatsUpdated,
}) => {
  const [userName, setUserName] = useState<string>(userStats.name);
  const [gasUrl, setGasUrlInput] = useState<string>(getGasUrl());
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'code'>('status');

  useEffect(() => {
    if (isOpen) {
      setUserName(userStats.name);
      setGasUrlInput(getGasUrl());
    }
  }, [isOpen, userStats.name]);

  if (!isOpen) return null;

  const lastTapData = loadLastSentenceTapStats();
  const tapSummary = formatSentenceTapsSummary(lastTapData.taps);

  // 구글 앱스 스크립트 소스 코드 (sentence_taps, average_taps 포함)
  const gasScriptCode = `/**
 * 영어 야호~! 구글 스프레드시트 기록 저장 앱스 스크립트
 * 시트 링크: https://docs.google.com/spreadsheets/d/1l_iOSeiMh33TB6-sIF-FD9N5XEOk6V5yFkhjRCI0Nc8/edit?usp=sharing
 * 저장 열: timestamp, name, play_count, correct_count, wrong_count, sentence_taps, average_taps
 */
const SPREADSHEET_ID = "1l_iOSeiMh33TB6-sIF-FD9N5XEOk6V5yFkhjRCI0Nc8";
const HEADERS = ["timestamp", "name", "play_count", "correct_count", "wrong_count", "sentence_taps", "average_taps"];

function getTargetSheet() {
  let ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  let sheet = ss.getSheets()[0];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const range = sheet.getRange(1, 1, 1, HEADERS.length);
    range.setFontWeight("bold");
    range.setBackground("#fef3c7");
    range.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  } else if (sheet.getLastColumn() < HEADERS.length) {
    const range = sheet.getRange(1, 1, 1, HEADERS.length);
    range.setValues([HEADERS]);
    range.setFontWeight("bold");
    range.setBackground("#fef3c7");
    range.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const timeZone = Session.getScriptTimeZone() || "Asia/Seoul";
    const timestamp = data.timestamp || Utilities.formatDate(new Date(), timeZone, "yyyy-MM-dd HH:mm:ss");
    const name = data.name ? String(data.name).trim() : "학생";
    const play_count = Number(data.play_count) || 0;
    const correct_count = Number(data.correct_count) || 0;
    const wrong_count = Number(data.wrong_count) || 0;
    const sentence_taps = data.sentence_taps ? String(data.sentence_taps) : "";
    const average_taps = data.average_taps !== undefined ? Number(data.average_taps) : 0;

    const sheet = getTargetSheet();
    sheet.appendRow([timestamp, name, play_count, correct_count, wrong_count, sentence_taps, average_taps]);

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, HEADERS.length).setHorizontalAlignment("center");

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      recorded: { timestamp, name, play_count, correct_count, wrong_count, sentence_taps, average_taps }
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e && e.parameter && (e.parameter.name || e.parameter.play_count || e.parameter.sentence_taps)) {
    return doPost(e);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "영어 야호 구글 시트 로거 정상 작동 중입니다.",
    spreadsheetId: SPREADSHEET_ID,
    columns: HEADERS
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyCode = async () => {
    soundManager.playTap();
    try {
      await navigator.clipboard.writeText(gasScriptCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      setIsCopied(true);
    }
  };

  const handleSaveUserName = (newName: string) => {
    setUserName(newName);
    saveUserName(newName);
    const updated = updateUserStats({ name: newName });
    onStatsUpdated(updated);
  };

  const handleSaveUrl = (newUrl: string) => {
    setGasUrlInput(newUrl);
    saveGasUrl(newUrl);
  };

  const handleTestSend = async () => {
    soundManager.playTap();
    if (!gasUrl.trim()) {
      setFeedback({
        type: 'error',
        message: '구글 앱스 스크립트 웹 앱 URL을 먼저 아래 입력창에 넣어주세요!',
      });
      return;
    }

    setIsSending(true);
    setFeedback({ type: 'info', message: '문장 탭 빈도 및 학습 기록을 구글 시트로 전송하고 있습니다...' });

    // 문장 탭 데이터가 있으면 해당 데이터, 없으면 샘플 데이터 생성
    const sentenceSummary =
      tapSummary.sentenceCount > 0
        ? tapSummary.summaryString
        : '[I like dogs]: 3회 | [She smiles]: 2회 | [He drinks milk]: 4회';
    const avgTaps = tapSummary.sentenceCount > 0 ? tapSummary.averageTaps : 3.0;

    const result = await logToGoogleSheet({
      name: userName || '학생',
      play_count: userStats.play_count,
      correct_count: userStats.correct_count,
      wrong_count: userStats.wrong_count,
      timestamp: getFormattedTimestamp(),
      sentence_taps: sentenceSummary,
      average_taps: avgTaps,
    });

    setIsSending(false);
    if (result.success) {
      soundManager.playStageClear();
      setFeedback({
        type: 'success',
        message: result.message,
      });
    } else {
      soundManager.playWrong();
      setFeedback({
        type: 'error',
        message: result.message,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg shadow-inner">
              📊
            </div>
            <div>
              <h3 className="font-fun font-black text-lg tracking-tight leading-tight">
                구글 시트 연동 설정
              </h3>
              <p className="text-[11px] text-amber-100 font-medium">
                문장별 탭 빈도, 평균, 정답률 자동 기록
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white active:scale-95 transition-all"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Link Quick Access Button */}
        <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>연동 대상 구글 시트</span>
          </div>
          <a
            href={GOOGLE_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            <span>시트 열기</span>
            <ExternalLink className="w-3 h-3 text-amber-600" />
          </a>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => {
              soundManager.playTap();
              setActiveTab('status');
            }}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'status'
                ? 'border-amber-500 text-amber-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>학습 기록 & 시트 전송</span>
          </button>
          <button
            onClick={() => {
              soundManager.playTap();
              setActiveTab('code');
            }}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'code'
                ? 'border-amber-500 text-amber-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>앱스 스크립트 코드 생성</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs">
          {activeTab === 'status' ? (
            <>
              {/* 1. Student Name Setting */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-1.5 font-bold text-slate-700">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>학습자 이름 (name)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => handleSaveUserName(e.target.value)}
                    placeholder="이름 입력 (예: 김민수)"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  💡 게임을 완료할 때마다 이 이름으로 구글 시트에 기록이 남겨집니다.
                </p>
              </div>

              {/* 2. Real-time Log Stats Grid */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 flex items-center justify-between">
                  <span>현재 학습 통계 (Sheet 전송 대상)</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {getFormattedTimestamp()} 기준
                  </span>
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-2xl">
                    <span className="text-[11px] text-blue-600 font-bold block mb-0.5">
                      🎮 플레이 횟수
                    </span>
                    <span className="text-xl font-fun font-black text-blue-900">
                      {userStats.play_count}회
                    </span>
                    <span className="text-[10px] text-blue-500 block">play_count</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl">
                    <span className="text-[11px] text-emerald-600 font-bold block mb-0.5">
                      ⭕ 맞힌 정답
                    </span>
                    <span className="text-xl font-fun font-black text-emerald-900">
                      {userStats.correct_count}개
                    </span>
                    <span className="text-[10px] text-emerald-500 block">correct_count</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-2xl">
                    <span className="text-[11px] text-rose-600 font-bold block mb-0.5">
                      ❌ 틀린 오답
                    </span>
                    <span className="text-xl font-fun font-black text-rose-900">
                      {userStats.wrong_count}개
                    </span>
                    <span className="text-[10px] text-rose-500 block">wrong_count</span>
                  </div>
                </div>
              </div>

              {/* 3. 문장별 탭 통계 요약 카드 */}
              <div className="bg-indigo-50/80 p-3 rounded-2xl border border-indigo-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-indigo-900">
                  <span className="flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5 text-indigo-600" />
                    <span>문장별 탭 빈도 & 평균 저장</span>
                  </span>
                  <span className="text-[11px] bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    평균 {tapSummary.averageTaps}회
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  학생이 각 문장을 듣거나 단어를 배치할 때의 탭 횟수를 측정하여, <b>sentence_taps</b>와 <b>average_taps</b> 열에 함께 저장합니다.
                </p>
                {tapSummary.sentenceCount > 0 && (
                  <div className="text-[10px] bg-white/80 p-2 rounded-xl text-slate-700 font-mono border border-indigo-100 max-h-16 overflow-y-auto">
                    {tapSummary.summaryString}
                  </div>
                )}
              </div>

              {/* 4. Web App URL Input with .env.local indicator */}
              <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    구글 웹 앱 URL (NEXT_PUBLIC_GOOGLE_SCRIPT_URL)
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    .env.local 연동됨
                  </span>
                </div>
                <input
                  type="url"
                  value={gasUrl}
                  onChange={(e) => handleSaveUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">
                    기본값: .env.local의 NEXT_PUBLIC_GOOGLE_SCRIPT_URL
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveUrl(DEFAULT_GAS_URL)}
                    className="text-amber-700 underline font-bold"
                  >
                    기본 URL 복원
                  </button>
                </div>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`p-3 rounded-xl flex items-start gap-2 text-xs ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : feedback.type === 'error'
                      ? 'bg-rose-50 border border-rose-200 text-rose-800'
                      : 'bg-blue-50 border border-blue-200 text-blue-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{feedback.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleTestSend}
                  disabled={isSending}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-fun font-bold text-sm rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>전송 중...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>시트로 지금 바로 전송하기 (테스트 전송)</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* TAB 2: Apps Script Code & Deployment Guide */
            <div className="space-y-3.5">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-amber-900 text-xs">
                    📜 생성된 구글 앱스 스크립트 (Code.gs)
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-2xs active:scale-95 transition-all"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white" />
                        <span>코드 전체 복사</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-amber-800 mb-2">
                  이 코드는 구글 시트의 <b>timestamp, name, play_count, correct_count, wrong_count, sentence_taps, average_taps</b> 열에 문장별 탭 빈도·평균과 학습 통계를 저장합니다.
                </p>

                {/* Code Block Container */}
                <pre className="bg-slate-900 text-amber-300 p-3 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
                  {gasScriptCode}
                </pre>
              </div>

              {/* 4-Step Deployment Instructions */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span>🚀 1분 만에 끝내는 시트 배포 방법</span>
                </h4>
                <ol className="space-y-2 text-[11px] text-slate-600 leading-normal list-decimal list-inside font-medium">
                  <li>
                    <b className="text-slate-800">구글 시트 열기</b>: 상단의 <b>[시트 열기]</b> 버튼을 눌러 스프레드시트를 엽니다.
                  </li>
                  <li>
                    <b className="text-slate-800">Apps Script 실행</b>: 시트 상단 메뉴에서 <b>[확장 프로그램] ➔ [Apps Script]</b>를 클릭합니다.
                  </li>
                  <li>
                    <b className="text-slate-800">코드 붙여넣기 및 저장</b>: 기존 편집창 내용을 지우고, 위의 <b>[코드 전체 복사]</b> 버튼으로 복사한 내용을 붙여넣은 뒤 <b>저장(Ctrl+S)</b>합니다.
                  </li>
                  <li>
                    <b className="text-slate-800">웹 앱으로 배포</b>:
                    <div className="mt-1 pl-3 text-slate-700 bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                      <div>① 우측 상단 <b>[배포] ➔ [새 배포]</b> 클릭</div>
                      <div>② 유형 선택(톱니바퀴) ➔ <b>[웹 앱]</b> 선택</div>
                      <div>③ 다음 사용자 권한으로 실행: <b>나 (Me)</b></div>
                      <div>④ 액세스 권한이 있는 사용자: <b>모든 사용자 (Anyone)</b> (필수!)</div>
                      <div>⑤ <b>[배포]</b> 클릭 후 나오는 <b>웹 앱 URL</b>을 복사하여 `.env.local`의 <code>NEXT_PUBLIC_GOOGLE_SCRIPT_URL</code>에 할당!</div>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-fun font-bold text-xs text-slate-700 transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
