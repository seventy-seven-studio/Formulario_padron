// ============================================================
// GOOGLE APPS SCRIPT — Guardar registros en Google Sheets
// ============================================================
// INSTRUCCIONES DE INSTALACIÓN:
//
// 1. Abre Google Sheets en el archivo donde quieres guardar datos
// 2. Menú: Extensiones → Apps Script
// 3. Borra el código de ejemplo y pega TODO este archivo
// 4. Cambia SHEET_NAME si quieres otro nombre de pestaña (opcional)
// 5. Menú: Implementar → Nueva implementación
//    - Tipo: Aplicación web
//    - Ejecutar como: Yo (tu cuenta)
//    - Quién tiene acceso: Cualquier usuario
// 6. Clic en "Implementar" → copia la URL que aparece
// 7. Pega esa URL en el formulario HTML (variable SCRIPT_URL)
// ============================================================

const SHEET_NAME = 'Registros'; // Nombre de la pestaña destino

const COLUMNS = [
  'Nombre',
  'Email',
  'Teléfono',
  'Dirección',
  'Latitud',
  'Longitud',
  'Desarrollo',
  'Fecha/Hora',
];

// ─── Punto de entrada POST ───────────────────────────────────────────────────
function doPost(e) {
  try {
    const raw = e.postData && e.postData.contents;
    if (!raw) throw new Error('No se recibió contenido en el body');

    const data = JSON.parse(raw);
    validatePayload(data);

    const sheet = getOrCreateSheet();
    appendRow(sheet, data);

    return jsonResponse({ success: true, message: 'Datos guardados correctamente' });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 400);
  }
}

// ─── Validación mínima del payload ──────────────────────────────────────────
function validatePayload(data) {
  const required = ['nombre', 'email', 'telefono', 'direccion', 'desarrollo'];
  const missing = required.filter(k => !data[k] || String(data[k]).trim() === '');
  if (missing.length > 0) {
    throw new Error('Campos requeridos faltantes: ' + missing.join(', '));
  }
}

// ─── Obtener o crear la hoja con encabezados ─────────────────────────────────
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    formatHeaders(sheet);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    formatHeaders(sheet);
  }

  return sheet;
}

// ─── Dar formato visual a los encabezados ────────────────────────────────────
function formatHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
  headerRange.setBackground('#1a73e8');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  // Anchos de columna
  const widths = [180, 220, 150, 320, 100, 100, 160, 180];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
}

// ─── Insertar fila de datos ──────────────────────────────────────────────────
function appendRow(sheet, data) {
  const timestamp = data.timestamp
    ? new Date(data.timestamp)
    : new Date();

  const row = [
    String(data.nombre  || '').trim(),
    String(data.email   || '').trim(),
    String(data.telefono|| '').trim(),
    String(data.direccion || '').trim(),
    data.lat  !== undefined ? Number(data.lat)  : '',
    data.lng  !== undefined ? Number(data.lng)  : '',
    String(data.desarrollo || '').trim(),
    timestamp,
  ];

  sheet.appendRow(row);

  // Formato de fecha en la última columna insertada
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 8).setNumberFormat('dd/mm/yyyy hh:mm:ss');
}

// ─── Construir respuesta JSON con CORS ──────────────────────────────────────
function jsonResponse(payload, statusCode) {
  const output = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ─── GET de prueba (navegador) ───────────────────────────────────────────────
// Visita la URL del script en el navegador para confirmar que está activo.
function doGet() {
  return jsonResponse({ status: 'ok', message: 'Script activo y escuchando POST' });
}
