// ============================================================
// INSTRUCCIONES DE DESPLIEGUE
// ============================================================
// 1. Abre script.google.com y crea un nuevo proyecto
// 2. Pega todo este código reemplazando el contenido por defecto
// 3. Cambia SPREADSHEET_ID por el ID de tu Google Sheet
//    (el ID está en la URL: .../spreadsheets/d/<ID>/edit)
// 4. Despliega: Implementar → Nueva implementación
//      Tipo: Aplicación web
//      Ejecutar como: Yo
//      Quién tiene acceso: Cualquier persona
// 5. Copia la URL de implementación y pégala en formulario.html
// ============================================================

var SPREADSHEET_ID = '1OOsX17meZUz2_lF3qzo7iUDoO13F1zI0t0ZYhqLgWvY'; // <-- reemplaza esto
var SHEET_NAME     = 'Registros';

// ─── Entrada POST ────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var raw     = e.postData ? e.postData.contents : '{}';
    var payload = JSON.parse(raw);

    var err = validatePayload(payload);
    if (err) return jsonResponse({ success: false, error: err }, 400);

    var sheet = getOrCreateSheet();
    sheet.appendRow([
      new Date(payload.timestamp || new Date()),
      payload.nombre,
      payload.email,
      payload.telefono,
      payload.direccion,
      payload.lat    || '',
      payload.lng    || '',
      payload.desarrollo,
    ]);

    return jsonResponse({ success: true });

  } catch (ex) {
    return jsonResponse({ success: false, error: ex.message }, 500);
  }
}

// ─── Entrada GET (health-check) ──────────────────────────────────────────────
function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'Apps Script activo' });
}

// ─── Preflight CORS ──────────────────────────────────────────────────────────
function doOptions(e) {
  return ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function validatePayload(p) {
  if (!p.nombre    || p.nombre.trim().length < 3)  return 'Nombre inválido';
  if (!p.email     || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return 'Email inválido';
  if (!p.telefono  || !/^[\d\s\+\-\(\)]{7,20}$/.test(p.telefono))  return 'Teléfono inválido';
  if (!p.direccion || p.direccion.trim().length < 5) return 'Dirección inválida';
  if (!p.desarrollo) return 'Desarrollo no seleccionado';
  return null;
}

function getOrCreateSheet() {
  var ss    = SPREADSHEET_ID === 'TU_SPREADSHEET_ID_AQUI'
              ? SpreadsheetApp.getActiveSpreadsheet()
              : SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Nombre', 'Email', 'Teléfono',
                     'Dirección', 'Latitud', 'Longitud', 'Desarrollo']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  }

  return sheet;
}

function jsonResponse(payload, statusCode) {
  var output = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}
