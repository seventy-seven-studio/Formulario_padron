// ============================================================
// INSTRUCCIONES DE DESPLIEGUE
// ============================================================
// 1. Abre script.google.com y crea un nuevo proyecto
// 2. Pega todo este código reemplazando el contenido por defecto
// 3. Asegúrate de que SPREADSHEET_ID sea el ID de tu Google Sheet
//    (el ID está en la URL: .../spreadsheets/d/<ID>/edit)
// 4. Despliega: Implementar → Nueva implementación
//      Tipo: Aplicación web
//      Ejecutar como: Yo
//      Quién tiene acceso: Cualquier persona
// 5. Copia la URL de implementación y pégala en formulario.html
// ============================================================

var SPREADSHEET_ID = '1OOsX17meZUz2_lF3qzo7iUDoO13F1zI0t0ZYhqLgWvY';

var SHEET = {
  TUTORES:     'Tutores',
  ADULTOS:     'Adultos',
  ESTUDIANTES: 'Estudiantes'
};

var HEADERS = {
  TUTORES: [
    'Timestamp', 'CURP', 'Apellido Paterno', 'Apellido Materno', 'Nombre(s)',
    'Fecha Nacimiento', 'Edad', 'Género', 'Estado Civil', 'Domicilio',
    'Latitud', 'Longitud', 'CP Auto', 'CP', 'Lada', 'Celular', 'Email'
  ],
  ADULTOS: [
    'CURP Tutor', 'CURP Adulto', 'Apellido Paterno', 'Apellido Materno', 'Nombre(s)',
    'Fecha Nacimiento', 'Edad', 'Género', 'Ocupación'
  ],
  ESTUDIANTES: [
    'CURP Tutor', 'Apellido Paterno', 'Apellido Materno', 'Nombre(s)',
    'Nivel Escolar', 'Grado Secundaria', 'Plantel'
  ]
};

var CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;

// ─── Entrada POST ────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var raw     = e.postData ? e.postData.contents : '{}';
    var payload = JSON.parse(raw);

    var err = validatePayload(payload);
    if (err) return jsonResponse({ success: false, error: err });

    var ss        = SpreadsheetApp.openById(SPREADSHEET_ID);
    var timestamp = new Date(payload.timestamp || new Date());
    var t         = payload.tutor;

    // ── Hoja Tutores ──────────────────────────────────────────
    var sheetT = getOrCreateSheet(ss, SHEET.TUTORES, HEADERS.TUTORES);
    sheetT.appendRow([
      timestamp,
      t.curp,
      t.apellido_paterno,
      t.apellido_materno,
      t.nombres,
      t.fecha_nacimiento,
      t.edad,
      t.genero,
      t.estado_civil,
      t.domicilio,
      t.lat,
      t.lng,
      t.cp_auto,
      t.cp,
      t.lada,
      t.celular,
      t.email
    ]);

    // ── Hoja Adultos ──────────────────────────────────────────
    if (payload.adultos && payload.adultos.length > 0) {
      var sheetA = getOrCreateSheet(ss, SHEET.ADULTOS, HEADERS.ADULTOS);
      payload.adultos.forEach(function(a) {
        sheetA.appendRow([
          t.curp,
          a.curp,
          a.apellido_paterno,
          a.apellido_materno,
          a.nombres,
          a.fecha_nacimiento,
          a.edad,
          a.genero,
          a.ocupacion
        ]);
      });
    }

    // ── Hoja Estudiantes ──────────────────────────────────────
    if (payload.estudiantes && payload.estudiantes.length > 0) {
      var sheetE = getOrCreateSheet(ss, SHEET.ESTUDIANTES, HEADERS.ESTUDIANTES);
      payload.estudiantes.forEach(function(est) {
        sheetE.appendRow([
          t.curp,
          est.apellido_paterno,
          est.apellido_materno,
          est.nombres,
          est.nivel_escolar,
          est.grado_secundaria,
          est.plantel
        ]);
      });
    }

    return jsonResponse({ success: true });

  } catch (ex) {
    return jsonResponse({ success: false, error: ex.message });
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
  if (!p || !p.tutor) return 'Payload incompleto: falta tutor';

  var t = p.tutor;
  if (!t.apellido_paterno || !t.apellido_paterno.trim()) return 'Apellido paterno del tutor requerido';
  if (!t.nombres          || !t.nombres.trim())          return 'Nombres del tutor requeridos';
  if (!CURP_REGEX.test(t.curp))                          return 'CURP del tutor inválido: ' + t.curp;
  if (!t.fecha_nacimiento)                               return 'Fecha de nacimiento del tutor requerida';
  if (!t.domicilio        || !t.domicilio.trim())        return 'Domicilio del tutor requerido';
  if (!/^\d{5}$/.test(t.cp))                            return 'CP del tutor inválido';

  if (p.adultos) {
    for (var i = 0; i < p.adultos.length; i++) {
      var a = p.adultos[i];
      if (!a.apellido_paterno || !a.apellido_paterno.trim()) return 'Apellido paterno de adulto ' + (i + 1) + ' requerido';
      if (!a.nombres          || !a.nombres.trim())          return 'Nombres de adulto '          + (i + 1) + ' requeridos';
      if (!CURP_REGEX.test(a.curp))                          return 'CURP de adulto '              + (i + 1) + ' inválido';
      if (!a.fecha_nacimiento)                               return 'Fecha de nacimiento de adulto ' + (i + 1) + ' requerida';
    }
  }

  if (p.estudiantes) {
    for (var j = 0; j < p.estudiantes.length; j++) {
      var est = p.estudiantes[j];
      if (!est.apellido_paterno || !est.apellido_paterno.trim()) return 'Apellido paterno de estudiante ' + (j + 1) + ' requerido';
      if (!est.nombres          || !est.nombres.trim())          return 'Nombres de estudiante '          + (j + 1) + ' requeridos';
    }
  }

  return null;
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type');
}
