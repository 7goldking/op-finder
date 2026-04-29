import React from 'react';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function toCalDate(dateStr) {
  // Format: YYYYMMDDTHHmmssZ
  const d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function buildGoogleUrl(event) {
  const start = event.event_start ? toCalDate(event.event_start) : toCalDate(event.application_deadline);
  const end = event.event_end ? toCalDate(event.event_end) : start;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: [event.short_description, event.description].filter(Boolean).join('\n\n').slice(0, 500),
    location: event.city || '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function buildIcsContent(event) {
  const start = event.event_start ? toCalDate(event.event_start) : toCalDate(event.application_deadline);
  const end = event.event_end ? toCalDate(event.event_end) : start;
  const description = [event.short_description, event.description].filter(Boolean).join('\\n\\n').slice(0, 500);
  const url = window.location.href;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OpportunityHub//RU',
    'BEGIN:VEVENT',
    `UID:${event.id}@opportunityhub`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${event.city || ''}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadIcs(event) {
  const content = buildIcsContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.slice(0, 40).replace(/[^a-zA-Zа-яА-Я0-9 ]/g, '')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildOutlookUrl(event) {
  const start = event.event_start || event.application_deadline;
  const end = event.event_end || start;
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: new Date(start).toISOString(),
    enddt: new Date(end).toISOString(),
    body: [event.short_description, event.description].filter(Boolean).join('\n\n').slice(0, 300),
    location: event.city || '',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

export default function AddToCalendar({ event }) {
  if (!event.event_start && !event.application_deadline) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full rounded-full gap-2">
          <CalendarPlus className="w-4 h-4" />
          В календарь
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-52">
        <DropdownMenuItem asChild>
          <a href={buildGoogleUrl(event)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
            <img src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png" alt="" className="w-4 h-4 object-contain" />
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadIcs(event)} className="cursor-pointer gap-2">
          <CalendarPlus className="w-4 h-4 text-muted-foreground" />
          Apple Calendar (.ics)
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={buildOutlookUrl(event)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
            <img src="https://res.cdn.office.net/assets/mail/pwa/v2/images/icons/icon-192.png" alt="" className="w-4 h-4 object-contain" />
            Outlook
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}