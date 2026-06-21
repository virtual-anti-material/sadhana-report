'use strict';

const { getSheets, SHEET_ID, ok, err, preflight } = require('./sheet-client');

async function fetchRows(sheets) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Users!A2:B' });
  return res.data.values || [];
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  try {
    const sheets = await getSheets();

    if (event.httpMethod === 'GET') {
      const rows = await fetchRows(sheets);
      const users = rows.filter(r => r[0]).map(r => ({ name: r[0], type: parseInt(r[1] ?? '0', 10) }));
      return ok(users);
    }

    if (event.httpMethod === 'POST') {
      const { name, type } = JSON.parse(event.body || '{}');
      if (!name) return err('name required', 400);

      const rows = await fetchRows(sheets);
      const norm = s => (s || '').trim().toLowerCase();
      const idx = rows.findIndex(r => norm(r[0]) === norm(name));

      if (idx === -1) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: 'Users!A:B',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[name, type ?? 0]] },
        });
      } else {
        const rowNum = idx + 2;
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Users!A${rowNum}:B${rowNum}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[name, type ?? (rows[idx][1] ?? 0)]] },
        });
      }
      return ok({ ok: true });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('users error', e);
    return err(e.message);
  }
};
