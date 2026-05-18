// MeetNote — App data + utilities

const MN_PEOPLE = [
  { name: 'Sara Kim', email: 'sara@northwind.co', role: 'Product' },
  { name: 'Diego Ortiz', email: 'diego@northwind.co', role: 'Engineering' },
  { name: 'Mei Tanaka', email: 'mei@northwind.co', role: 'Design' },
  { name: 'Alex Reyes', email: 'alex@northwind.co', role: 'You' },
  { name: 'Priya Shah', email: 'priya@halcyon.io', role: 'Customer' },
  { name: 'Tomás Lindqvist', email: 'tomas@folio.com', role: 'Customer' },
  { name: 'Aliyah Brooks', email: 'aliyah@plate.co', role: 'Customer' },
];

const MN_UPCOMING = [
  { id: 'u1', title: 'Q3 Launch Readiness', date: 'Today', time: '11:00 — 11:45', dow: 'Tue', day: '14', participants: ['Sara Kim', 'Diego Ortiz', 'Mei Tanaka', 'Alex Reyes'], status: 'live' },
  { id: 'u2', title: 'Weekly 1:1 — Sara', date: 'Today', time: '14:00 — 14:30', dow: 'Tue', day: '14', participants: ['Sara Kim', 'Alex Reyes'] },
  { id: 'u3', title: 'Customer Discovery — Halcyon', date: 'Tomorrow', time: '09:30 — 10:15', dow: 'Wed', day: '15', participants: ['Priya Shah', 'Diego Ortiz', 'Alex Reyes'] },
  { id: 'u4', title: 'Design Review · Notes editor', date: 'Thu, May 16', time: '15:00 — 16:00', dow: 'Thu', day: '16', participants: ['Mei Tanaka', 'Diego Ortiz', 'Alex Reyes'] },
];

const MN_RECENT = [
  { id: 'r1', title: 'Q3 Launch Planning', when: '13 May · 11:00', duration: '42m', participants: ['Sara Kim', 'Diego Ortiz', 'Alex Reyes'], notes: 'ready', actions: 7 },
  { id: 'r2', title: 'Onboarding flow critique', when: '13 May · 16:00', duration: '28m', participants: ['Mei Tanaka', 'Alex Reyes'], notes: 'ready', actions: 4 },
  { id: 'r3', title: 'Customer Interview · Folio', when: '12 May · 10:30', duration: '51m', participants: ['Tomás Lindqvist', 'Alex Reyes'], notes: 'ready', actions: 9 },
  { id: 'r4', title: 'Design system sync', when: '12 May · 14:00', duration: '35m', participants: ['Mei Tanaka', 'Diego Ortiz'], notes: 'generating' },
  { id: 'r5', title: 'All-hands prep', when: '10 May · 09:00', duration: '22m', participants: ['Sara Kim', 'Alex Reyes'], notes: 'ready', actions: 3 },
];

const MN_HISTORY = [
  ...MN_RECENT,
  { id: 'h1', title: 'Hiring sync — Eng', when: '09 May · 11:00', duration: '40m', participants: ['Sara Kim', 'Diego Ortiz'], notes: 'ready', actions: 5 },
  { id: 'h2', title: 'Q2 retro', when: '07 May · 13:00', duration: '1h 02m', participants: ['Sara Kim', 'Diego Ortiz', 'Mei Tanaka', 'Alex Reyes'], notes: 'ready', actions: 12 },
  { id: 'h3', title: 'Roadmap review with founders', when: '06 May · 15:30', duration: '55m', participants: ['Sara Kim', 'Alex Reyes'], notes: 'ready', actions: 8 },
  { id: 'h4', title: 'Customer call · Plate & Co', when: '05 May · 10:00', duration: '38m', participants: ['Aliyah Brooks', 'Alex Reyes'], notes: 'ready', actions: 6 },
  { id: 'h5', title: 'Marketing weekly', when: '03 May · 09:30', duration: '31m', participants: ['Sara Kim', 'Mei Tanaka'], notes: 'ready', actions: 4 },
  { id: 'h6', title: 'Bug triage', when: '02 May · 16:00', duration: '24m', participants: ['Diego Ortiz', 'Mei Tanaka'], notes: 'failed' },
];

const MN_NOTIFICATIONS = [
  { id: 'n1', kind: 'reminder', icon: 'bell', title: 'Q3 Launch Readiness starts in 12 min', meta: '11:00 · Sara, Diego, Mei', time: '12m' },
  { id: 'n2', kind: 'notes', icon: 'fileText', title: 'Notes ready — Customer Interview · Folio', meta: '51m meeting · 9 action items', time: '1h' },
  { id: 'n3', kind: 'invite', icon: 'mail', title: 'Priya Shah invited you to a meeting', meta: 'Customer Discovery · Tomorrow 09:30', time: '2h' },
  { id: 'n4', kind: 'notes', icon: 'fileText', title: 'Notes ready — Onboarding flow critique', meta: '28m meeting · 4 action items', time: '3h' },
  { id: 'n5', kind: 'reminder', icon: 'sparkle', title: 'Weekly digest generated', meta: '12 meetings · 38 action items this week', time: 'Yesterday' },
];

Object.assign(window, { MN_PEOPLE, MN_UPCOMING, MN_RECENT, MN_HISTORY, MN_NOTIFICATIONS });
