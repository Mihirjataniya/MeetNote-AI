# Theme File Setup

_Started 2026-05-15 19:31 UTC_

---

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "MeetNote Ui"
Current date is now May 16, 2026
</system-info>

<default aesthetic>
If no references, art direction or design systems were provided, use this default professional modern, minimal aesthetic as a base. Declare your choice out loud so you stick to it. Guidance:
- Choose a type pairing from web-safe set or Google Fonts. Helvetica is a good choice. Avoid hard-to-read or overly stylized fonts. Use 1-3 fonts only.
- Foreground and background: choose a color tone (warm, cool, neutral, something in-between). Use subtly-toned whites and blacks; avoid saturations above 0.02 for whites.
- Accents: choose 0-2 additional accent colors using oklch. All accents should share same chroma and lightness; vary hue.
- NEVER write out an SVG yourself that's more complicated than a square, circle, diamond, etc.
- For imagery, never hand-draw SVGs; use subtly-striped SVG placeholders instead with monospace explainers for what should be dropped there (e.g. “product shot”)

CRITICAL: ignore default aesthetic entirely if given other aesthetic instructions like reference images, design systems or guidance, or if there are files in the project already.
</default aesthetic>

<pasted_text name="Pasted text (222 lines)">
Design a modern premium SaaS web application UI for a platform called “MeetNote” — an AI-powered meeting collaboration and meeting notes platform. The product helps users collaborate remotely through meetings and later generates refined AI-powered meeting notes that are structured, readable, and exportable as PDFs.

The overall UI style should be:
- monochromatic light theme
- calm productivity aesthetic
- modern minimalism
- clean editorial layouts
- premium SaaS experience
- document-centric interface
- highly polished spacing and typography
- inspired by Notion, Linear, Apple productivity apps, and modern editorial SaaS products

Avoid:
- colorful gradients
- gaming aesthetics
- cyberpunk visuals
- flashy animations
- neon effects
- crowded enterprise UI
- excessive charts/widgets

The application should feel:
- intelligent
- calm
- organized
- premium
- distraction-free
- elegant
- modern

Use:
- soft shadows
- subtle borders
- layered spacing
- medium rounded corners
- grayscale hierarchy
- refined typography
- generous whitespace

Color palette:
- background: #FAFAFA
- primary surfaces: white
- primary text: #111111
- secondary text: #666666
- borders: very subtle rgba black opacity
- hover surfaces: very soft gray tones

Typography:
- Inter or Geist font
- semi-bold headings
- clean readable body text
- modern SaaS typography hierarchy

Create the following screens and flows:

1. Landing Page
- premium hero section
- strong product positioning
- “Turn conversations into structured knowledge”
- CTA buttons
- AI meeting notes showcase
- collaboration showcase
- feature sections
- workflow section
- testimonials
- clean footer
- modern SaaS layout with elegant spacing

2. Dashboard Layout
Persistent application layout including:
- floating left sidebar
- top navigation bar
- content area

Sidebar navigation:
- Home
- Schedules
- Meeting Histories
- Settings

Bottom sidebar section:
- small profile card

Top navbar:
- logo
- notification icon
- profile avatar

3. Home Page
Main dashboard command center.

Sections:
- Start Meeting hero card
- Schedule Meeting button
- Upcoming Meetings section
- Recent Meetings section

Start Meeting card should feel premium and focused with elegant monochromatic design.

Upcoming meetings cards should include:
- title
- date
- participants
- join action

Recent meetings cards should include:
- title
- duration
- notes available
- open notes action

4. Schedules Page
Modern calendar-based meeting scheduling interface.

Include:
- clean monthly calendar
- elegant meeting cards
- soft hover states
- modern productivity calendar aesthetic

Avoid making it look like Google Calendar clone.

5. Meeting Histories Page
Structured archive of previous meetings.

Include:
- search bar
- filter options
- meeting history cards/table

Each item includes:
- title
- participants
- duration
- generated notes status
- export PDF option

6. Settings Page
Minimal categorized settings layout.

Sections:
- Profile
- Security
- Notifications
- Meeting Preferences
- AI Preferences
- Export Preferences

7. Profile Page
Professional account management interface.

Include:
- avatar upload
- personal information
- email
- password reset
- account preferences

8. Notification Panel
Slide-over notification panel from navbar.

Include:
- upcoming meeting reminders
- generated notes notifications
- meeting invites

9. Authentication Pages
Create:
- Sign In
- Sign Up

Style:
- centered minimal layouts
- elegant monochromatic cards
- premium spacing
- subtle visual depth

10. Modal System

A. Start Meeting Modal
Fields:
- meeting title
- optional description

Actions:
- Start Meeting
- Cancel

B. Schedule Meeting Modal
Fields:
- title
- description
- date
- time
- participants

Actions:
- Schedule
- Cancel

Design Requirements:
- highly polished modern UI
- strong spacing system
- balanced visual hierarchy
- subtle animations
- responsive design
- modern SaaS components
- professional productivity-focused UX
- document-centric visual identity
- soft monochromatic surfaces
- premium clean interfaces
- consistent card system
- refined minimal aesthetic

The final design should feel like a blend of:
- Notion
- Linear
- Apple productivity software
- modern editorial SaaS platforms

The emotional experience should feel like:
“clarity after meetings.”
</pasted_text>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Hi-fi design">
Create a high-fidelity, polished design. Follow the instructions about design in your system prompt, particularly the 'How to do design work' section. Use the design_canvas starter component, or make a full-bleed prototype and offer options via Tweaks.
</attached-skill>

<attached-skill name="Interactive prototype">
Create a fully interactive prototype with realistic state management and transitions. Use React useState/useEffect for dynamic behavior. Include hover states, click interactions, form validation, animated transitions, and multi-step navigation flows. It should feel like a real working app, not a static mockup.
</attached-skill>


<system-reminder>Auto-injected reminder (ignore if not relevant): do not recreate copyrighted or branded UI unless the user's email domain matches that company. Create original designs instead.</system-reminder>

## Assistant

_[tool: update_todos]_

I'll design MeetNote as a high-fidelity interactive prototype with all screens laid out on a design canvas. Given the detailed brief, I'll commit to the aesthetic system you described (monochrome light, Inter, calm productivity) and lay out the full app.

Plan:
- **System**: Inter, #FAFAFA bg, white surfaces, #111 / #666 text, subtle borders, soft shadows, 12–16px radii
- **Layout**: Design canvas with artboards grouped by section (Marketing · Auth · App · Modals)
- **App screens** share a real sidebar/topbar shell with working navigation between Home, Schedules, History, Settings, Profile + working modals and slide-over panels

_[tool: copy_starter_component]_

_[tool: read_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: show_html]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Built **MeetNote** as a full interactive prototype on a design canvas. Each artboard is fully clickable — you can navigate between Home, Schedules, History, Settings, and Profile using the sidebar in any of the application artboards.

**System chosen:** Inter / Inter Tight / JetBrains Mono · #FAFAFA background · monochrome grays · 10–14px radii · soft shadows. Editorial pull quotes and Georgia italics for moments of warmth.

**What's on the canvas:**
- **Marketing site** — Landing page (scrollable, with editorial hero, full AI-notes showcase, three-up features, workflow, testimonials, CTA, footer)
- **Authentication** — Sign in & Sign up (centered minimal, dual column with editorial side panel)
- **Application** — Home (with the dark Start-Meeting hero, stats strip, upcoming + recent), Schedules (monthly calendar + week list), Meeting Histories (search/filter + list/grid toggle), Settings (six categorized sections), Profile
- **Modals & overlays** — Start Meeting modal, Schedule Meeting modal (with participant pill picker), Notification slide-over

Click the ↗ on any artboard to focus it fullscreen, or drag to reorder. Tell me which screen to push further — I'd start by exploring a couple of variants of the Home hero or the meeting-notes document layout.

## User

Create a theme file for it which i can handle to claude code for proper reference of the theme of the projec

## Assistant

_[tool: write_file]_

Created **`THEME.md`** — a single hand-off doc for Claude Code with:

- **17 sections** covering principles, color tokens, type scale, spacing, radii, shadows, motion, component recipes (Button, Input, Card, Pill, Avatar, Modal, Slide-over, Toggle, Table, Calendar), app shell layout, iconography rules, voice & copy, accessibility, and explicit don'ts
- **CSS variable definitions** ready to paste
- **JSON token export** for Style Dictionary / Tokens Studio
- **Tailwind config snippet** if they're using Tailwind
- **File map** so they know where each piece of the prototype lives

Open `THEME.md` from the file tree, or download it directly to hand off:

## User

This is too much detailed file i just want you to menion colors fonts etc no this many details

## Assistant

_[tool: write_file]_

Trimmed down — just the essentials now: colors, fonts, radii, shadows, motion. Open `THEME.md` to see it.

