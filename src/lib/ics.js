// Простой генератор .ics-файла для скачивания встречи в любой календарь
function formatDateUTC(date) {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICS(text = '') {
  return String(text).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function buildICS({ title, description = '', start, end, attendees = [], organizer, location = '' }) {
  const dtStart = formatDateUTC(start);
  const dtEnd = formatDateUTC(end || new Date(new Date(start).getTime() + 60 * 60 * 1000));
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@opfinder`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Opfinder//Mentorship//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateUTC(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    location ? `LOCATION:${escapeICS(location)}` : null,
    organizer ? `ORGANIZER;CN=${escapeICS(organizer.name || '')}:mailto:${organizer.email}` : null,
    ...attendees.map(a => `ATTENDEE;CN=${escapeICS(a.name || '')};ROLE=REQ-PARTICIPANT:mailto:${a.email}`),
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function downloadICS(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}