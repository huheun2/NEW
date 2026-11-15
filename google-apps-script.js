/**
 * ==============================================================================
 * 영어 야호~! - 구글 스프레드시트 기록 연동 구글 앱스 스크립트 (Google Apps Script)
 * ==============================================================================
 * 
 * 구글 시트 링크:
 * https://docs.google.com/spreadsheets/d/1CA_BzGK7VkqJN2zfGuz0glO253l0pfbR_bRY6etNLYc/edit?usp=sharing
 * 
 * 저장 열 (Columns):
 * [1] timestamp     : 기록 일시 (예: 2026-10-30 14:20:11)
 * [2] name          : 학습자 이름 (예: 김민수)
 * [3] play_count    : 누적 게임 플레이 횟수
 * [4] correct_count : 누적 맞힌 정답 수
 * [5] wrong_count   : 누적 틀린 오답 수
 * [6] sentence_taps : 각 문장별 탭 빈도 (예: [I love dogs]: 3회 | [She smiles]: 2회)
 * [7] average_taps  : 문장별 평균 탭 수 (예: 2.5)
 * 
 * ------------------------------------------------------------------------------
 * [설치 및 배포 4단계]
 * 1. 구글 시트 상단 메뉴 [확장 프로그램 (Extensions)] > [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 스크립트 전체를 복사하여 붙여넣기 후 저장 (Ctrl+S)
 * 3. 우측 상단 [배포 (Deploy)] > [새 배포 (New deployment)] 클릭
 *    - 유형: [웹 앱 (Web app)]
 *    - 설명: 영어 야호 문장별 탭 빈도 및 학습 기록 저장
 *    - 다음 사용자 권한으로 실행 (Execute as): "나 (Me)"
 *    - 액세스 권한이 있는 사용자 (Who has access): "모든 사용자 (Anyone)" (필수)
 * 4. [배포] 클릭 후 발급된 "웹 앱 URL (Web App URL)"을 .env.local 파일의
 *    NEXT_PUBLIC_GOOGLE_SCRIPT_URL 키 값으로 사용합니다.
 * ==============================================================================
 */

// 대상 스프레드시트 ID
const SPREADSHEET_ID = '1CA_BzGK7VkqJN2zfGuz0glO253l0pfbR_bRY6etNLYc';
const SHEET_NAME = 'Sheet1';

function getTargetSheet() {
  let ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }

  const fullHeaders = ['timestamp', 'name', 'play_count', 'correct_count', 'wrong_count', 'sentence_taps', 'average_taps'];

  // 시트가 비어있는 경우 헤더 생성
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(fullHeaders);
    const range = sheet.getRange(1, 1, 1, fullHeaders.length);
    range.setFontWeight('bold');
    range.setBackground('#fef3c7');
    range.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  } else {
    // 기존에 5개 열만 있었을 경우 6, 7번째 열 헤더 자동 보완
    const lastCol = sheet.getLastColumn();
    if (lastCol < 7) {
      const headerRange = sheet.getRange(1, 1, 1, fullHeaders.length);
      headerRange.setValues([fullHeaders]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#fef3c7');
      headerRange.setHorizontalAlignment('center');
    }
  }

  return sheet;
}

/**
 * 앱에서 게임 종료 또는 동기화 시 POST 요청 처리
 */
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

    const timeZone = Session.getScriptTimeZone() || 'Asia/Seoul';
    const timestamp = data.timestamp || Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd HH:mm:ss');
    const name = data.name ? String(data.name) : '학생';
    const play_count = Number(data.play_count) || 0;
    const correct_count = Number(data.correct_count) || 0;
    const wrong_count = Number(data.wrong_count) || 0;
    const sentence_taps = data.sentence_taps ? String(data.sentence_taps) : '';
    const average_taps = data.average_taps !== undefined ? Number(data.average_taps) : 0;

    const sheet = getTargetSheet();
    sheet.appendRow([timestamp, name, play_count, correct_count, wrong_count, sentence_taps, average_taps]);

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 7).setHorizontalAlignment('center');

    const response = {
      status: 'success',
      message: '시트에 안전하게 기록되었습니다.',
      recorded: {
        timestamp,
        name,
        play_count,
        correct_count,
        wrong_count,
        sentence_taps,
        average_taps
      }
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 웹 브라우저 테스트용 GET 요청 처리
 */
function doGet(e) {
  if (e && e.parameter && (e.parameter.name || e.parameter.play_count)) {
    return doPost(e);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: '영어 야호~! 구글 시트 로거 정상 작동 중입니다.',
    spreadsheetId: SPREADSHEET_ID,
    columns: ['timestamp', 'name', 'play_count', 'correct_count', 'wrong_count', 'sentence_taps', 'average_taps']
  })).setMimeType(ContentService.MimeType.JSON);
}
