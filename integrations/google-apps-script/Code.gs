/**
 * Google Apps Script for Grand Hotel Plovdiv 2027 inquiries.
 * Script Properties: SHEET_ID, INQUIRY_TOKEN, NOTIFY_EMAIL.
 * Deploy > New deployment > Web app > Execute as me > Anyone.
 * The public web-app URL is used only from Cloudflare Pages Functions.
 */
function doPost(e) {
  const out = (data) => ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  try {
    const props = PropertiesService.getScriptProperties();
    const expected = props.getProperty('INQUIRY_TOKEN');
    const payload = JSON.parse(e.postData.contents);
    if (!expected || expected.length < 32 || payload.token !== expected) return out({ok:false,error:'unauthorized'});
    const d = payload.inquiry;
    if (!d || !/^[A-Za-z0-9-]{8,64}$/.test(String(d.submissionId || ''))) return out({ok:false,error:'invalid'});
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getSheetByName('Заявки');
      if (!sheet) throw new Error('Missing Заявки tab');
      const ids = sheet.getLastRow() > 1 ? sheet.getRange(2,2,sheet.getLastRow()-1,1).getValues().flat() : [];
      if (ids.includes(d.submissionId)) return out({ok:true,duplicate:true});
      const b = d.booking;
      const rooms = (b.rooms || []).map((g,i) => '№'+(i+1)+': '+g.adults+' взр., '+g.children+' детей 2–11, '+g.infants+' до 2').join('; ');
      const safe = v => { const s = String(v == null ? '' : v); return /^[=+@\-\t\r]/.test(s) ? "'"+s : s; };
      const row = [new Date(), d.submissionId, d.pageLang, d.name, d.email, d.phone, b.product, b.nights || '', b.room || '', (b.rooms || []).length, b.adults, b.children, b.infants, rooms, b.estimatedTotal, d.comment, 'Новая'].map(safe);
      sheet.appendRow(row);
      const email = props.getProperty('NOTIFY_EMAIL');
      if (email) {
        const lines = ['Новая заявка: Grand Hotel Plovdiv 2027', '', 'Имя: '+d.name, 'Телефон: '+d.phone, 'Email: '+d.email, 'Предложение: '+b.product, 'Ночей: '+(b.nights || '—'), 'Номер: '+(b.room || '—'), 'Гости: '+b.adults+' взрослых, '+b.children+' детей 2–11, '+b.infants+' детей до 2', 'Номера: '+(rooms || '—'), 'Стоимость: '+b.estimatedTotal+' EUR', 'Комментарий: '+(d.comment || '—'), '', 'Заявка не подтверждает бронирование.'];
        MailApp.sendEmail({to:email,subject:'Новая заявка Grand Hotel Plovdiv: '+String(d.name).replace(/[\r\n]/g,' '),body:lines.join('\n'),replyTo:d.email,name:'Grand Hotel Plovdiv — заявки'});
      }
      return out({ok:true});
    } finally { lock.releaseLock(); }
  } catch(err) { console.error(String(err)); return out({ok:false,error:'internal'}); }
}
