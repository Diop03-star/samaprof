---
name: SamaProf AI Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464554'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#6b38d4'
  on-tertiary: '#ffffff'
  tertiary-container: '#8455ef'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.03em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The brand personality merges high-velocity pedagogical precision with approachable, empathetic artificial intelligence. Designed for ambitious learners and professional development, the experience must feel inspiring, intelligent, and distinctly human.

### Design Movement: Modern Functionalism with Expressive AI Accents
The style anchors itself in clean, utilitarian SaaS structure while incorporating expressive, characterful display typography and tactile pill-shaped components. This counterbalances institutional EdTech coldness with warmth, momentum, and optimism.

### Emotional Goals
- **Empowerment & Agency:** Learners feel immediate mastery through structured progress tracking and feedback loops.
- **Trustworthy Intelligence:** AI interactions avoid synthetic or alien tropes, presenting instead as an attentive, expert personal mentor.
- **Clarity & Focus:** Distraction-free surfaces with purposeful chromatic highlights that immediately prioritize cognitive load.

## Colors

The color architecture supports a structured light mode with clear functional and semantic tiers.

### Functional Palette Mapping
- **Primary (`#6366F1` - Electric Indigo):** Primary interactive targets, focal states, active tabs, progress bars, and high-priority action affordances.
- **Secondary (`#0F172A` - Deep Slate):** Grounded base typography, structural contrast, active toggle states, and high-impact structural containers.
- **Tertiary (`#8B5CF6` - Soft Violet):** Contextual AI insights, dynamic generation prompts, adaptive hints, and smart diagnostic pill tags.
- **Neutral Canvas (`#F8FAFC` - Light Slate Neutral):** Low-strain canvas background, secondary surfaces (`#F1F5F9`), and crisp pure white card surfaces (`#FFFFFF`).

### Semantic Signals
- **Success / Mastered (`#10B981`):** Complete modules, validated quizzes, mastery badges, and positive retention deltas.
- **Warning / Review Required (`#F59E0B`):** Spaced repetition alerts, concepts requiring revision, and incomplete prerequisite flags.
- **Destructive / Error (`#EF4444`):** Failed verification, critical drop-off points, and destructive configuration actions.

## Typography

The type system blends the energetic geometry of **Bricolage Grotesque** for headlines with the clean, highly legible precision of **DM Sans** for didactic body copy and instructional components.

### Editorial Guidelines
- Use `Bricolage Grotesque` exclusively for dynamic milestones, module headers, metric highlights, and onboarding intros.
- Maintain `DM Sans` for continuous reading, lesson modules, quiz prompts, and data tables to preserve reading comfort over extended study sessions.
- In French localization, preserve typographic punctuation rules: ensure non-breaking spaces before colons, semicolons, question marks, and exclamation marks.

## Layout & Spacing

The layout is built on an adaptive responsive grid with an 8-point base rhythm.

### Grid System & Breakpoints
- **Mobile (<768px):** Single-column fluid stack, 16px margins, fixed bottom navigation bar (height: 64px) with safe-area bottom offset.
- **Tablet (768px - 1024px):** 8-column layout, 24px gutters, collapsible side navigation rail.
- **Desktop (>1024px):** 12-column layout, 24px gutters, persistent vertical sidebar (260px fixed width), and centered content max-width container of 1280px.

### Spatial Rhythm
- Apply `space-md` for standard component interior padding (card borders to content).
- Apply `space-lg` between distinct structural groups (e.g., between lesson progression overview and AI suggested modules).
- Apply `space-xs` and `space-sm` for compact pill badges, icon-to-label offsets, and metadata groupings.

## Elevation & Depth

Visual hierarchy leverages pure white surfaces suspended above the `#F8FAFC` base through delicate borders and indigo-tinted ambient shadows.

### Elevation Levels
- **Level 0 (Flat Canvas):** `#F8FAFC` — no elevation, base background for dashboards and course views.
- **Level 1 (Card / Content Tier):** `#FFFFFF` background, paired with `1px solid rgba(226, 232, 240, 0.7)` and an ambient shadow: `0px 1px 3px rgba(15, 23, 42, 0.04), 0px 4px 12px rgba(99, 102, 241, 0.03)`.
- **Level 2 (Interactive Overlays & Active Modules):** Hovered course cards, floating action controls, and dropdowns. Shadow: `0px 4px 6px -1px rgba(15, 23, 42, 0.06), 0px 10px 20px -2px rgba(99, 102, 241, 0.08)`.
- **Level 3 (Modals & AI Prompts):** Contextual diagnostic dialogs, AI generation sheets, and popovers: `0px 20px 25px -5px rgba(15, 23, 42, 0.1), 0px 8px 10px -6px rgba(15, 23, 42, 0.05)`.

## Shapes

The interface embraces a pill-shaped and deeply rounded aesthetic (Level 3), imparting warmth and high-touch modern digital tactility.

### Radius Scale Implementation
- **Full Pill (`9999px`):** All action buttons, input fields, interactive chips, progress meters, and AI alert badges.
- **Cards & Primary Modules (`1.5rem` / `24px`):** Content containers, diagnostic widgets, and assessment containers.
- **Nested Inner Surfaces (`0.75rem` / `12px`):** Inner code blocks, callout containers, and feedback micro-panels.

## Components

### Buttons
- **Primary:** Full-pill shape, background `#6366F1`, text `#FFFFFF`, typography `label-md`. Hover: `#4F46E5`. Active: slight inset scale (`scale(0.98)`).
- **Secondary / Outline:** Full-pill shape, background `#FFFFFF`, border `1.5px solid #E2E8F0`, text `#0F172A`. Hover: background `#F8FAFC`.
- **AI Assist Action:** Full-pill shape, subtle gradient (`linear-gradient(135deg, #6366F1, #8B5CF6)`), text `#FFFFFF`, paired with a leading dynamic sparkle icon.

### Chips & Badges
- **Contextual AI Badge:** Background `rgba(139, 92, 246, 0.12)`, text `#7C3AED`, full-pill radius, typography `label-sm`.
- **Mastered Badge:** Background `rgba(16, 185, 129, 0.12)`, text `#059669`, full-pill radius.
- **Review Required Badge:** Background `rgba(245, 158, 11, 0.12)`, text `#D97706`, full-pill radius.

### Input Fields
- Fully rounded pill containers (`height: 48px`), background `#FFFFFF`, border `1px solid rgba(226, 232, 240, 0.8)`.
- Focus state: border-color `#6366F1`, box-shadow `0 0 0 3px rgba(99, 102, 241, 0.15)`.

### Cards
- Base: `#FFFFFF` fill, `24px` border radius, border `1px solid rgba(226, 232, 240, 0.7)`.
- Internal spacing: `space-lg` (`24px`).
- Interactive Card: On hover, subtle vertical translation (`-2px`) and Level 2 ambient elevation shadow.

### Checkboxes & Radio Buttons
- **Radio Buttons:** Circular, `20px` diameter, `2px solid #CBD5E1`. Selected state: `#6366F1` background with inner white concentric circle (`8px`).
- **Checkboxes:** `8px` rounded square, `2px solid #CBD5E1`. Selected: `#6366F1` with white checkmark glyph.

### Navigation Architecture
- **Desktop Sidebar:** Fixed left, width `260px`, background `#FFFFFF`, border-right `1px solid #E2E8F0`. Nav links use full-pill active indicator pills with background `rgba(99, 102, 241, 0.08)` and label color `#6366F1`.
- **Mobile Bottom Navigation:** Fixed bottom dock (`height: 64px`), background `rgba(255, 255, 255, 0.95)` with backdrop blur (`12px`), border-top `1px solid #E2E8F0`. Active route indicator uses centered `#6366F1` icon with micro-dot indicator below.