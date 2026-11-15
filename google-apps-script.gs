/**
 * ==============================================================================
 * 영어 야호~! - 구글 스프레드시트 기록 연동 구글 앱스 스크립트 (Google Apps Script)
 * ==============================================================================
 *
 * 구글 시트 링크:
 * https://docs.google.com/spreadsheets/d/1l_iOSeiMh33TB6-sIF-FD9N5XEOk6V5yFkhjRCI0Nc8/edit?usp=sharing
 *
 * 저장 열 (Columns):
 * [1] timestamp     : 기록 일시 (예: 2026-11-15 05:02:52)
 * [2] name          : 사용자 이름 (예: 김민수)
 * [3] play_count    : 게임 플레이 횟수
 * [4] correct_count : 맞힌 정답 수
 * [5] wrong_count   : 틀린 오답 수
 * [6] sentence_taps : 각 문장별 탭 빈도 (예: [I like dogs]: 3회 | [She smiles]: 2회)
 * [7] average_taps  : 문장별 평균 탭 수 (예: 2.5)
 */

const SPREADSHEET_ID = '1l_iOSeiMh33TB6-sIF-FD9N5XEOk6V5yFkhjRCI0Nc8';
const SHEET_NAME = 'Sheet1';
const HEADERS = ['timestamp', 'name', 'play_count', 'correct_count', 'wrong_count', 'sentence_taps', 'average_taps'];

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

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#fef3c7');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastColumn() < HEADERS.length) {
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setValues([HEADERS]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#fef3c7');
    headerRange.setHorizontalAlignment('center');
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

    const timeZone = Session.getScriptTimeZone() || 'Asia/Seoul';
    const timestamp = data.timestamp || Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd HH:mm:ss');
    const name = data.name ? String(data.name).trim() : '학생';
    const play_count = Number(data.play_count) || 0;
    const correct_count = Number(data.correct_count) || 0;
    const wrong_count = Number(data.wrong_count) || 0;
    const sentence_taps = data.sentence_taps ? String(data.sentence_taps) : '';
    const average_taps = data.average_taps !== undefined ? Number(data.average_taps) : 0;

    const sheet = getTargetSheet();
    sheet.appendRow([timestamp, name, play_count, correct_count, wrong_count, sentence_taps, average_taps]);

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, HEADERS.length).setHorizontalAlignment('center');

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '시트에 안전하게 기록되었습니다.',
      recorded: {
        timestamp: timestamp,
        name: name,
        play_count: play_count,
        correct_count: correct_count,
        wrong_count: wrong_count,
        sentence_taps: sentence_taps,
        average_taps: average_taps
      }
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e && e.parameter && (e.parameter.name || e.parameter.play_count || e.parameter.sentence_taps)) {
    return doPost(e);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: '영어 야호~! 구글 시트 로거 정상 작동 중입니다.',
    spreadsheetId: SPREADSHEET_ID,
    columns: HEADERS
  })).setMimeType(ContentService.MimeType.JSON);
}
