'use strict';

const { getSheets, SHEET_ID, ok, err, preflight } = require('./sheet-client');

const FIELD_KEYS = [
  'sleepTime','wakeupTime','dayRest','chantEnd','rounds',
  'hearingTopic','hearingDuration','readingTopic','readingDuration',
  'serviceNames','serviceDuration','comments',
];
const HEADERS = ['date', 'name', ...FIELD_KEYS];
const RANGE_END = String.fromCharCode(65 + HEADERS.length - 1); // 'N'

function rowToEntry(r) {
  const e = {};
  HEADERS.forEach((h, i) => { e[h] = r[i] ?? ''; });
  return e;
}

function entryToRow(entry) {
  return HEADERS.map(h => entry[h] ?? '');
}

async function fetchRows(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `Entries!A2:${RANGE_END}`,
  });
  return res.data.values || [];
}

const norm = s => (s || '').trim().toLowerCase();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  try {
    const sheets = await getSheets();

    if (event.httpMethod === 'GET') {
      const name = event.queryStringParameters?.name;
      const rows = await fetchRows(sheets);
      let entries = rows.filter(r => r[0]).map(rowToEntry);
      if (name) entries = entries.filter(e => norm(e.name) === norm(name));
      return ok(entries);
    }

    if (event.httpMethod === 'POST') {
      const entry = JSON.parse(event.body || '{}');
      const { name, date } = entry;
      if (!name || !date) return err('name and date required', 400);

      const rows = await fetchRows(sheets);
      const idx = rows.findIndex(r => r[0] === date && norm(r[1]) === norm(name));
      const newRow = entryToRow(entry);

      if (idx === -1) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `Entries!A:${RANGE_END}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [newRow] },
        });
      } else {
        const rowNum = idx + 2;
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Entries!A${rowNum}:${RANGE_END}${rowNum}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [newRow] },
        });
      }
      return ok({ ok: true });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('entries error', e);
    return err(e.message);
  }
};
