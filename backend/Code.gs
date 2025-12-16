/**
 * 相談受付管理システム Backend Logic
 * 
 * 概要:
 * - フロントエンドからのデータ受信とスプレッドシート保存
 * - テンプレート置換によるPDF生成
 * - Googleカレンダー連携
 * - ダッシュボード用データ取得
 */

// --- 設定 ---
const CONFIG = {
  // 指定されたスプレッドシートID
  SPREADSHEET_ID: '1jp6xfE3xtTR7V-iBYFTA2jXlbSLUru-_7PEMmfB4uc8', 
  DATA_SHEET_NAME: 'データシート',
  TEMPLATE_SHEET_NAME: '相談受付票テンプレート',
  PDF_FOLDER_NAME: '相談受付PDF保存先',
  APP_TITLE: '相談受付管理'
};

/**
 * Webアプリとしてアクセスした際にフロントエンドを返す (SPA用)
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle(CONFIG.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * スプレッドシートを取得するヘルパー
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  } catch (e) {
    Logger.log('指定IDでのオープンに失敗、アクティブシートを使用します: ' + e.message);
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * API: 相談データの取得 (年・月フィルタリング)
 * @param {number} year 
 * @param {number} month 
 */
function getConsultations(year, month) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.DATA_SHEET_NAME);
  
  if (!sheet) {
    return []; // シートがまだない場合は空リスト
  }

  // データ範囲取得 (ヘッダー除く)
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const lastCol = sheet.getLastColumn();
  // 1行目はヘッダーなので2行目から取得
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  // フィルタリングとオブジェクト変換
  const results = values.filter(row => {
    // B列 (index 1) が受付日 (YYYY-MM-DD or Date object)
    const dateVal = row[1];
    if (!dateVal) return false;
    
    const date = new Date(dateVal);
    return date.getFullYear() === year && (date.getMonth() + 1) === month;
  }).map(row => {
    // 行データをオブジェクトにマッピング
    // 列定義:
    // 0:ID, 1:受付日, 2:被保険者番号, 3:保険者, 4:名前, 5:フリガナ, 6:性別, 7:生年月日
    // 8:住所, 9:本人電話番号, 10:相談者名, 11:相談手段, 12:相談者電話番号, 13:続柄
    // 14:相談経緯, 15:相談内容, 16:利用状況, 17:認定状況, 18:支援提供, 19:困難な理由
    // 20:対応, 21:初回訪問日時, 22:訪問場所, 23:特記事項, 24:相談受付者, 25:担当ケアマネ
    // 26:PDF作成日時, 27:PDFファイルID, 28:カレンダーID
    return {
      id: String(row[0]),
      receptionDate: formatDate(row[1]),
      insuredNumber: String(row[2]),
      insurer: String(row[3]),
      name: String(row[4]),
      furigana: String(row[5]),
      gender: String(row[6]),
      birthDate: formatDate(row[7]),
      address: String(row[8]),
      phone: String(row[9]),
      consultantName: String(row[10]),
      method: String(row[11]),
      consultantPhone: String(row[12]),
      relationship: String(row[13]),
      background: String(row[14]),
      content: String(row[15]),
      currentUsage: String(row[16]),
      certificationStatus: String(row[17]),
      supportProvided: String(row[18]),
      difficultyReason: String(row[19]),
      response: String(row[20]),
      firstVisitDate: row[21] ? new Date(row[21]).toISOString() : '', // ISO形式で返す
      visitLocation: String(row[22]),
      specialNotes: String(row[23]),
      staffName: String(row[24]),
      careManager: String(row[25]),
      pdfCreatedAt: String(row[26]),
      pdfFileId: String(row[27]),
      calendarEventId: String(row[28])
    };
  });

  // 受付日の新しい順にソート
  return results.reverse();
}

/**
 * API: 相談データの保存・更新処理
 * @param {Object} formData 
 */
function saveConsultation(formData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const ss = getSpreadsheet();
    const dataSheet = getOrCreateSheet(ss, CONFIG.DATA_SHEET_NAME);
    
    if (!formData.id) {
      formData.id = Utilities.getUuid();
    }

    // カレンダー連携
    if (formData.firstVisitDate && !formData.calendarEventId) {
      const eventId = syncToCalendar(formData);
      if (eventId) {
        formData.calendarEventId = eventId;
      }
    }

    // PDF生成
    const pdfInfo = createPdf(ss, formData);
    formData.pdfCreatedAt = new Date().toISOString();
    formData.pdfFileId = pdfInfo.id;
    formData.pdfUrl = pdfInfo.url;

    // 保存
    saveToSheet(dataSheet, formData);

    return {
      success: true,
      id: formData.id,
      pdfUrl: formData.pdfUrl,
      message: '保存とPDF作成が完了しました'
    };

  } catch (e) {
    Logger.log(e);
    return {
      success: false,
      message: e.toString()
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 内部関数: シートへの行データ保存
 */
function saveToSheet(sheet, data) {
  const lastRow = sheet.getLastRow();
  const allIds = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat() : [];
  
  let rowIndex = allIds.indexOf(data.id);
  
  const rowData = [
    data.id,
    data.receptionDate,
    data.insuredNumber || '',
    data.insurer || '',
    data.name,
    data.furigana,
    data.gender,
    data.birthDate,
    data.address || '',
    data.phone || '',
    data.consultantName,
    data.method,
    data.consultantPhone || '',
    data.relationship || '',
    data.background || '',
    data.content,
    data.currentUsage || '',
    data.certificationStatus || '',
    data.supportProvided || '',
    data.difficultyReason || '',
    data.response,
    data.firstVisitDate || '',
    data.visitLocation || '',
    data.specialNotes || '',
    data.staffName,
    data.careManager || '',
    data.pdfCreatedAt,
    data.pdfFileId,
    data.calendarEventId || ''
  ];

  if (rowIndex !== -1) {
    // 更新
    sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // 新規追加
    sheet.appendRow(rowData);
  }
}

/**
 * 内部関数: PDF生成処理
 */
function createPdf(ss, data) {
  const templateSheet = ss.getSheetByName(CONFIG.TEMPLATE_SHEET_NAME);
  if (!templateSheet) throw new Error('テンプレートシート「' + CONFIG.TEMPLATE_SHEET_NAME + '」が見つかりません');

  const tempSheet = templateSheet.copyTo(ss);
  tempSheet.setName(`temp_${data.id}_${Date.now()}`);

  try {
    const replacements = {
      '<<受付日>>': formatDate(data.receptionDate),
      '<<被保険者番号>>': data.insuredNumber || '',
      '<<保険者>>': data.insurer || '',
      '<<名前>>': data.name,
      '<<フリガナ>>': data.furigana,
      '<<性別>>': data.gender,
      '<<生年月日（和暦）>>': convertToJapaneseEra(data.birthDate),
      '<<住所>>': data.address || '',
      '<<本人電話番号>>': data.phone || '',
      '<<相談者名>>': data.consultantName,
      '<<相談手段>>': data.method,
      '<<相談者電話番号>>': data.consultantPhone || '',
      '<<続柄・関係>>': data.relationship || '',
      '<<相談経緯>>': data.background || '',
      '<<相談内容>>': data.content,
      '<<利用状況>>': data.currentUsage || '',
      '<<認定状況>>': data.certificationStatus || '',
      '<<支援提供>>': data.supportProvided || '',
      '<<困難な理由>>': data.difficultyReason || '',
      '<<対応>>': data.response,
      '<<初回訪問日時>>': formatDateTime(data.firstVisitDate),
      '<<訪問場所>>': data.visitLocation || '',
      '<<特記事項>>': data.specialNotes || '',
      '<<相談受付者>>': data.staffName,
      '<<担当ケアマネ>>': data.careManager || ''
    };

    // TextFinderで置換
    for (const [key, value] of Object.entries(replacements)) {
      tempSheet.createTextFinder(key).replaceAllWith(value);
    }

    SpreadsheetApp.flush();

    const pdfBlob = tempSheet.getAs(MimeType.PDF);
    const fileName = `${formatDate(data.receptionDate, 'YYYYMMDD')}_${data.name}_相談受付.pdf`;
    pdfBlob.setName(fileName);

    const folder = getOrCreateFolder(CONFIG.PDF_FOLDER_NAME);
    const file = folder.createFile(pdfBlob);

    return {
      id: file.getId(),
      url: file.getUrl()
    };

  } finally {
    ss.deleteSheet(tempSheet);
  }
}

/**
 * 内部関数: Googleカレンダー連携
 */
function syncToCalendar(data) {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const startDate = new Date(data.firstVisitDate);
    const endDate = new Date(startDate.getTime() + (60 * 60 * 1000));

    const title = `【訪問】${data.name}様 (担当: ${data.staffName})`;
    const description = `相談ID: ${data.id}\n場所: ${data.visitLocation || '未定'}\n特記事項: ${data.specialNotes || 'なし'}`;

    const event = calendar.createEvent(title, startDate, endDate, {
      description: description,
      location: data.visitLocation || ''
    });

    return event.getId();
  } catch (e) {
    Logger.log(`Calendar sync failed: ${e.message}`);
    return null;
  }
}

// --- Utils ---

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // ヘッダー行を作成
    const headers = [
      'ID', '受付日', '被保険者番号', '保険者', '名前', 'フリガナ', '性別', '生年月日',
      '住所', '本人電話番号', '相談者名', '相談手段', '相談者電話番号', '続柄',
      '相談経緯', '相談内容', '利用状況', '認定状況', '支援提供', '困難な理由',
      '対応', '初回訪問日時', '訪問場所', '特記事項', '相談受付者', '担当ケアマネ',
      'PDF作成日時', 'PDFファイルID', 'カレンダーID'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

function formatDate(date, format = 'YYYY/MM/DD') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  if (format === 'YYYYMMDD') {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyyMMdd');
  }
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy/MM/dd');
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const d = new Date(dateTimeStr);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm');
}

function convertToJapaneseEra(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let era = '';
  let eraYear = year;

  if (year >= 2019) { era = '令和'; eraYear = year - 2018; }
  else if (year >= 1989) { era = '平成'; eraYear = year - 1988; }
  else if (year >= 1926) { era = '昭和'; eraYear = year - 1925; }
  else { return `${year}年${month}月${day}日`; }

  const eraYearStr = eraYear === 1 ? '元' : eraYear;
  return `${era}${eraYearStr}年${month}月${day}日`;
}