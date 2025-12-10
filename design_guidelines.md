# Kashta Planning App - Design Guidelines

## Design Approach

**Cultural-Modern Hybrid**: Blend traditional Gulf aesthetic with contemporary web app functionality. Reference modern productivity apps (Linear, Notion) for clean data presentation while infusing authentic desert/cultural elements. This is a utility-first application that celebrates Gulf heritage through visual details.

**Primary Inspiration**: Think Airbnb's card-based layouts + Arabic cultural warmth + Notion's organizational clarity.

## Typography System

**Arabic-First Hierarchy**:
- Primary Font: **Noto Kufi Arabic** (700 for headings, 600 for subheadings, 400 for body)
- Fallback: System Arabic fonts
- Scale: 
  - Hero/Page Titles: text-4xl to text-5xl (bold)
  - Section Headers: text-2xl to text-3xl (semibold)
  - Card Titles: text-lg to text-xl (semibold)
  - Body Text: text-base (regular)
  - Metadata/Labels: text-sm (medium)

**RTL-First Layout**: All text, navigation, and layouts flow right-to-left. Icons appear on right side of text, chevrons point left for "forward" actions.

## Layout System

**Spacing Primitives**: Use Tailwind units of **4, 6, 8, 12, 16, 20** for consistent rhythm (e.g., p-4, gap-8, mb-12)

**Container Strategy**:
- Dashboard Shell: Full viewport with fixed sidebar (w-64), main content area with max-w-7xl
- Content Sections: px-6 md:px-8 lg:px-12 for responsive padding
- Card Grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6

**Key Layouts**:
1. **Dashboard Home**: Stats cards row (4-column grid) → Upcoming events timeline → Quick actions
2. **Event Detail**: Hero card with event info → Tabbed interface (Items, Participants, Budget, History) → Category grid below
3. **Calendar View**: Month grid with event markers, side panel for selected day details
4. **Item Database**: Category sidebar (vertical) + searchable item grid + floating action button

## Component Library

### Navigation
- **Sidebar**: Fixed right-side panel (RTL), logo top, main nav middle, user profile bottom. Icons with Arabic labels, active state with subtle accent
- **Top Bar**: Mobile hamburger (right side), search bar center, notification/settings icons left
- **Breadcrumbs**: Show navigation path in Arabic, separated by left-pointing chevrons

### Cards & Lists
- **Event Cards**: Rounded-2xl, elevated shadow, image thumbnail top OR desert pattern background, event title + date + participant count, status badge top-right corner
- **Item Cards**: Compact design, category icon right, item name + description, checkbox for selection, contributor avatar when assigned
- **Category Cards**: Large rounded cards, prominent category icon, item count badge, gentle hover lift effect
- **Participant Cards**: Avatar (80x80), name, phone, trip count badge, contribution summary

### Data Display
- **Stats Cards**: 4-column grid, large number display, icon + label, subtle gradient backgrounds
- **Timeline**: Vertical line with event nodes, date markers in Arabic/Hijri, expandable event details
- **Budget Tracker**: Horizontal bars showing cost breakdown by category, total at bottom, per-person split
- **Activity Log**: List with avatar + action + timestamp, grouped by date with Arabic headers

### Forms & Inputs
- **Text Inputs**: Rounded borders, right-aligned labels, placeholder text in lighter weight, focus state with accent border
- **Select/Dropdown**: Custom styled with right-aligned chevron, Arabic options
- **Date Picker**: Dual calendar (Gregorian + Hijri) side-by-side, Arabic day/month names
- **Search Bar**: Prominent, rounded-full, icon right side, clear button left
- **Action Buttons**: 
  - Primary: Solid, rounded-lg, text-base, py-3 px-6, prominent
  - Secondary: Outline style, same padding
  - Icon Buttons: Rounded-full, p-3, icon-only for quick actions
  - Floating Action Button: Fixed bottom-left (RTL), rounded-full, large (w-14 h-14), with plus icon

### Modals & Overlays
- **Modal Dialogs**: Centered, max-w-2xl, rounded-2xl, header with close button (top-left), content area with scrolling, footer with actions (right-aligned)
- **Slide-out Panels**: From left side (RTL), full height, for detailed editing
- **Toast Notifications**: Top-center, auto-dismiss, with icon + message + close

## Cultural Design Elements

**Desert Aesthetic Integration**:
- Use subtle sand texture overlays on large background areas
- Hero sections can feature authentic kashta photographs (campfire scenes, desert sunsets, traditional coffee serving)
- Category icons: Custom Gulf-themed (dalla/coffee pot, traditional tent, 4x4 vehicle, majlis seating, shisha, campfire)
- Empty states: Illustrate with cultural scenes (stars over desert, gathering around fire)

**Visual Motifs**:
- Geometric patterns inspired by Arabic/Islamic design as subtle card borders or section dividers
- Rounded corners throughout (rounded-lg to rounded-2xl) for warmth
- Soft shadows for card elevation, never harsh
- Weather indicators use relevant emojis (sun, moon, winter clouds)

## Animations

**Minimal & Purposeful** (use sparingly):
- Card hover: Gentle lift (translate-y-1) + shadow increase
- Button press: Subtle scale (scale-95)
- Modal entrance: Fade + scale from 95% to 100%
- Toast notifications: Slide from top
- Loading states: Skeleton screens with subtle pulse
- NO continuous animations, NO parallax, NO scroll-triggered effects

## Images

**Hero/Feature Images**:
- Dashboard welcome banner: Wide panoramic desert landscape at golden hour
- Event detail hero: Uploaded event photo OR default kashta scene (people around campfire, traditional setup)
- Category headers: Contextual imagery (coffee being poured for Coffee category, grill with meat for Grilling, etc.)
- Participant avatars: Upload capability with emoji fallbacks
- Empty states: Warm, inviting illustrations of kashta activities

**Image Treatment**: Rounded corners (rounded-xl), aspect-ratio-video for landscapes, subtle overlay gradients when text appears on images

## Responsive Strategy

- **Mobile**: Single column, bottom nav bar, collapsible filters, swipe gestures for calendar
- **Tablet**: 2-column grids, side panel appears/disappears
- **Desktop**: Full multi-column layouts, persistent sidebar, all features visible

## Accessibility (Arabic Context)

- All interactive elements meet WCMA touch targets (min 44x44px)
- Form labels always visible, not just placeholders
- High contrast text (especially for smaller Arabic text)
- Screen reader support with proper Arabic aria-labels
- Keyboard navigation following RTL flow