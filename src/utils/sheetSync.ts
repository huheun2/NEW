/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 구글 스프레드시트 기록 연동 유틸리티
 * 
 * 구글 시트: https://docs.google.com/spreadsheets/d/1l_iOSeiMh33TB6-sIF-FD9N5XEOk6V5yFkhjRCI0Nc8/edit?usp=sharing
 * .env.local 환경 변수: NEXT_PUBLIC_GOOGLE_SCRIPT_URL
 * 저장 열: timestamp, name, play_count, correct_count, wrong_count, sentence_taps, average_taps
 */

export const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1l_iOSeiMh33TB6-sIF-FD9N5XEOk6V5yFkhjRCI0Nc8/edit?usp=sharing';
export const SPREADSHEET_ID = '1l_iOSeiMh33TB6-sIF-FD9N5XEOk6V5yFkhjRCI0Nc8';

// .env.local의 NEXT_PUBLIC_GOOGLE_SCRIPT_URL 값 로드
export const ENV_GAS_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL) ||
  '';

export const DEFAULT_GAS_URL =
  ENV_GAS_URL ||
  'https://script.google.com/macros/s/AKfycbzGqkI1P3M2M8dwVIt8vnjaaz89js54-nu11Zqc2JRaJXkBbzafsKPgv7l68ZFDCSMteg/exec';

export interface UserStats {
  name: string;
  play_count: number;
  correct_count: number;
  wrong_count: number;
}

export interface SheetLogPayload {
  timestamp?: string;
  name: string;
  play_count: number;
  correct_count: number;
  wrong_count: number;
  // 각 문장별 탭 빈도 및 평균
  sentence_taps?: string;
  average_taps?: number;
  sentence_tap_details?: Record<string, number>;
}

const STORAGE_KEYS = {
  USER_NAME: 'yaho_user_name',
  PLAY_COUNT: 'yaho_play_count',
  CORRECT_COUNT: 'yaho_total_correct_count',
  WRONG_COUNT: 'yaho_total_wrong_count',
  GAS_URL: 'yaho_gas_url',
  AUTO_SYNC: 'yaho_auto_sync',
  LAST_SENTENCE_TAPS: 'yaho_last_sentence_taps',
  LAST_AVG_TAPS: 'yaho_last_avg_taps',
};

// 기본 학습자 통계 로드
export function loadUserStats(): UserStats {
  try {
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME) || '민수';
    const play_count = parseInt(localStorage.getItem(STORAGE_KEYS.PLAY_COUNT) || '0', 10);
    const correct_count = parseInt(localStorage.getItem(STORAGE_KEYS.CORRECT_COUNT) || '0', 10);
    const wrong_count = parseInt(localStorage.getItem(STORAGE_KEYS.WRONG_COUNT) || '0', 10);
    return { name, play_count, correct_count, wrong_count };
  } catch {
    return { name: '민수', play_count: 0, correct_count: 0, wrong_count: 0 };
  }
}

// 사용자 이름 저장
export function saveUserName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, name.trim() || '학생');
  } catch (e) {
    console.error('Failed to save user name', e);
  }
}

// 통계 누적 업데이트
export function updateUserStats(updates: Partial<UserStats>): UserStats {
  const current = loadUserStats();
  const next: UserStats = {
    name: updates.name !== undefined ? updates.name : current.name,
    play_count: updates.play_count !== undefined ? updates.play_count : current.play_count,
    correct_count: updates.correct_count !== undefined ? updates.correct_count : current.correct_count,
    wrong_count: updates.wrong_count !== undefined ? updates.wrong_count : current.wrong_count,
  };

  try {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, next.name);
    localStorage.setItem(STORAGE_KEYS.PLAY_COUNT, String(next.play_count));
    localStorage.setItem(STORAGE_KEYS.CORRECT_COUNT, String(next.correct_count));
    localStorage.setItem(STORAGE_KEYS.WRONG_COUNT, String(next.wrong_count));
  } catch (e) {
    console.error('Failed to save user stats', e);
  }

  return next;
}

// 배포된 구글 앱스 스크립트 웹 앱 URL 가져오기 (.env.local의 NEXT_PUBLIC_GOOGLE_SCRIPT_URL 우선 사용)
export function getGasUrl(): string {
  try {
    if (ENV_GAS_URL && ENV_GAS_URL.trim()) {
      return ENV_GAS_URL.trim();
    }
    const stored = localStorage.getItem(STORAGE_KEYS.GAS_URL);
    if (stored && stored.trim()) {
      return stored.trim();
    }
    return DEFAULT_GAS_URL;
  } catch {
    return DEFAULT_GAS_URL;
  }
}

// 배포된 구글 앱스 스크립트 웹 앱 URL 저장
export function saveGasUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GAS_URL, url.trim());
  } catch (e) {
    console.error('Failed to save GAS url', e);
  }
}

// 현재 타임스탬프 형식 (YYYY-MM-DD HH:mm:ss)
export function getFormattedTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 각 문장별 탭 빈도 및 평균 탭 계산 헬퍼
 */
export function formatSentenceTapsSummary(sentenceTaps: Record<string, number>): {
  summaryString: string;
  averageTaps: number;
  totalTaps: number;
  sentenceCount: number;
} {
  const entries = Object.entries(sentenceTaps);
  if (entries.length === 0) {
    return {
      summaryString: '기록 없음',
      averageTaps: 0,
      totalTaps: 0,
      sentenceCount: 0,
    };
  }

  const totalTaps = entries.reduce((sum, [, count]) => sum + count, 0);
  const sentenceCount = entries.length;
  const averageTaps = Number((totalTaps / sentenceCount).toFixed(2));
  const summaryString = entries
    .map(([sentence, count]) => `[${sentence}]: ${count}회`)
    .join(' | ');

  return {
    summaryString,
    averageTaps,
    totalTaps,
    sentenceCount,
  };
}

/**
 * 마지막 플레이된 문장 탭 빈도 로컬 캐시
 */
export function saveLastSentenceTapStats(taps: Record<string, number>, avg: number) {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SENTENCE_TAPS, JSON.stringify(taps));
    localStorage.setItem(STORAGE_KEYS.LAST_AVG_TAPS, String(avg));
  } catch {
    // fallback
  }
}

export function loadLastSentenceTapStats(): { taps: Record<string, number>; avg: number } {
  try {
    const rawTaps = localStorage.getItem(STORAGE_KEYS.LAST_SENTENCE_TAPS);
    const rawAvg = localStorage.getItem(STORAGE_KEYS.LAST_AVG_TAPS);
    return {
      taps: rawTaps ? JSON.parse(rawTaps) : {},
      avg: rawAvg ? parseFloat(rawAvg) : 0,
    };
  } catch {
    return { taps: {}, avg: 0 };
  }
}

/**
 * 구글 앱스 스크립트 웹 앱으로 기록 전송 (.env.local NEXT_PUBLIC_GOOGLE_SCRIPT_URL 사용)
 */
export async function logToGoogleSheet(
  customPayload?: Partial<SheetLogPayload>
): Promise<{ success: boolean; message: string; payload: SheetLogPayload }> {
  const gasUrl = getGasUrl();
  const currentStats = loadUserStats();

  const payload: SheetLogPayload = {
    timestamp: customPayload?.timestamp || getFormattedTimestamp(),
    name: customPayload?.name || currentStats.name || '학생',
    play_count: customPayload?.play_count !== undefined ? customPayload.play_count : currentStats.play_count,
    correct_count: customPayload?.correct_count !== undefined ? customPayload.correct_count : currentStats.correct_count,
    wrong_count: customPayload?.wrong_count !== undefined ? customPayload.wrong_count : currentStats.wrong_count,
    sentence_taps: customPayload?.sentence_taps ?? '',
    average_taps: customPayload?.average_taps ?? 0,
    sentence_tap_details: customPayload?.sentence_tap_details ?? {},
  };

  if (!gasUrl) {
    return {
      success: false,
      message: '구글 앱스 스크립트 웹 앱 URL이 설정되지 않았습니다. .env.local 또는 [연동 설정]을 확인해주세요.',
      payload,
    };
  }

  try {
    // text/plain 타입으로 전송하여 CORS preflight 옵션 차단 회피
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: `구글 시트에 성공적으로 기록되었습니다! (${payload.name} - 플레이: ${payload.play_count}회, 정답: ${payload.correct_count}, 평균 탭: ${payload.average_taps}회)`,
      payload,
    };
  } catch (error: any) {
    console.error('Google Sheet log error:', error);
    return {
      success: false,
      message: `전송 중 오류 발생: ${error?.message || '네트워크 확인 필요'}`,
      payload,
    };
  }
}
