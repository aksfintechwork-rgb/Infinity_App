# Design Guidelines: SUPREMO TRADERS LLP Team Communication Platform

## Design Approach

**Selected Approach:** Hybrid (Slack + Linear + Microsoft Teams)
- **Primary Inspiration:** Slack's organizational clarity + Linear's modern polish + Microsoft Teams' professional credibility
- **Rationale:** Internal business communication demands efficiency, trust, and professional polish for daily enterprise use.
- **Key Principles:**
  - Clean, business-focused interface with refined aesthetics
  - Solid colors with strategic subtle accents
  - Professional blue palette conveying trust and stability
  - Clear visual hierarchy through typography and spacing
  - Minimal, purposeful design elements

## Color System

**Primary Palette:**
- **Professional Blue:** Primary actions, brand elements (#2563EB)
- **Deep Navy:** Header backgrounds, important elements (#1E3A8A)
- **Light Blue:** Hover states, subtle accents (#DBEAFE)
- **Neutral Gray:** Text, borders (#64748B, #94A3B8, #CBD5E1)
- **Pure White:** Backgrounds, cards (#FFFFFF)
- **Soft Gray:** Secondary backgrounds (#F8FAFC, #F1F5F9)

**Accent Colors:**
- **Success Green:** #10B981
- **Warning Amber:** #F59E0B
- **Error Red:** #EF4444
- **Online Teal:** #14B8A6

**Application Strategy:**
- Primary buttons: Solid professional blue with subtle hover darkening
- Active states: Light blue background (10% opacity)
- Borders: Neutral gray with blue accent on focus
- Shadows: Subtle, multi-layer for depth (never colored)
- Text: Dark slate on light backgrounds, ensuring WCAG AAA

## Typography

**Font System:** Inter (Google Fonts CDN)
- **Hierarchy:**
  - Brand/Logo: 22px, weight 700
  - Page Headers: 20px, weight 600
  - Section Headers: 16px, weight 600
  - Message Sender: 14px, weight 600
  - Body Text: 15px, weight 400, line-height 1.6
  - Timestamps: 13px, weight 400
  - Buttons: 14px, weight 500
  - Labels: 12px, weight 500, uppercase tracking

## Layout System

**Spacing Primitives:** Tailwind units of 2, 3, 4, 6, 8, 12, 16, 20
- Component padding: p-4
- Section gaps: gap-4 to gap-6
- Container padding: p-6 to p-8
- Message spacing: mb-3 between different senders, mb-1 same sender
- Consistent whitespace for clarity

**Border Radius Strategy:**
- Small elements (badges, pills): rounded-md (6px)
- Medium (buttons, inputs): rounded-lg (8px)
- Large (cards, modals): rounded-xl (12px)
- Avatars: rounded-full

**Shadow System:**
- Card elevation: shadow-sm (subtle)
- Dropdowns/Modals: shadow-lg (pronounced)
- Interactive hover: shadow-md (medium lift)
- Active message: shadow-inner with blue tint

**Grid Structure:**
- Desktop: Sidebar (280px) | Conversation List (340px) | Chat Area (flex-1)
- Tablet: Two-column with slide-over panels
- Mobile: Single column stack with bottom navigation

## Component Library

### Navigation & Structure

**Top Bar (64px):**
- Background: Deep navy (#1E3A8A)
- Border-bottom: 1px solid rgba(255,255,255,0.1)
- Left: "SUPREMO TRADERS LLP" white text (weight 700), circular logo (36px)
- Center: Conversation title (white, weight 500) with member count badge
- Right: Search icon (white, hover bg white/10), notification bell with badge, profile avatar (36px) with white ring
- Box-shadow: shadow-md for depth

**Sidebar (280px):**
- Background: White with subtle shadow-sm
- Header (72px): Deep navy background, white text
- Section headers: Uppercase labels (12px, weight 500, text gray-500)
- Conversation items: rounded-lg, hover bg gray-50, active bg light-blue with left blue accent (3px)
- Create buttons: Full-width, rounded-lg, professional blue background
- Presence indicators: 10px circles (online=teal, away=amber, offline=gray)
- Dividers: 1px gray-200 between sections

**Conversation List Panel (340px):**
- Background: Soft gray (#F8FAFC)
- Search bar: rounded-lg, white background, shadow-sm, blue border on focus
- Conversation cards: White background, rounded-lg, padding p-4, border-l-3 blue accent for unread
- Avatar: 48px with blue ring for unread conversations
- Unread count: Professional blue circular badge, top-right
- Last message: Truncated, gray-600 text
- Active state: Light blue background, shadow-md, blue left-border

### Chat Interface

**Message Area:**
- Maximum width: 900px, centered
- Background: Pure white
- Date dividers: Centered text with gray-300 horizontal lines, gray-600 text

**Message Bubbles:**
- Avatar: 36px, blue ring for online users
- Own messages: Professional blue background (#2563EB), white text, right-aligned, rounded-2xl (but square on sender side)
- Other messages: Soft gray background (#F1F5F9), dark text, left-aligned, rounded-2xl (but square on sender side)
- Sender name: Weight 600, gray-900
- Timestamp: Gray-500, 13px
- Max-width: 600px
- Padding: p-4, line-height 1.6
- Shadow-sm on hover

**Message Types:**
- Text: Standard with blue links
- Files: White card with gray border, file icon (24px), shadow-sm, rounded-lg
- Images: Max 500px, rounded-lg, shadow-md, lightbox on click
- Code blocks: Gray-900 background with syntax highlighting, rounded-lg, p-4
- Reactions: Gray-100 pill badges, rounded-full, blue text, border on hover

**Message Input (80px height):**
- White background, rounded-xl, shadow-lg, border gray-200
- Textarea: p-4, auto-expand to 120px max
- Toolbar: Gray icon buttons (20px) - attachment, emoji, formatting
- Send button: Professional blue, rounded-lg, px-6, shadow-sm, hover shadow-md
- Typing indicator: Blue animated dots above input

### Modal Components

**New Conversation Modal:**
- Centered, max-width 520px, rounded-xl, shadow-2xl
- White background with gray-50 header
- Header: Deep navy text, border-bottom gray-200
- Backdrop: Blur(12px) with dark overlay (rgba(0,0,0,0.4))
- Member selection: Blue checkboxes, avatar list with presence indicators
- Selected members: Blue pill chips, rounded-full, with remove icon
- Footer: Border-top gray-200, primary button (blue), secondary (gray outline)

**Profile Dropdown:**
- Width: 280px, rounded-lg, shadow-xl
- White background, border gray-200
- User section: Gray-50 background, avatar (48px, blue ring), padding p-4
- Menu items: rounded-md hover bg gray-50, gray-700 text
- Presence selector: Colored circles with labels
- Dividers: Gray-200

### Form Elements

**Inputs:**
- Height: h-11, rounded-lg
- Border: 1px gray-300, focus blue with shadow-sm
- Background: White
- Placeholder: Gray-400

**Buttons:**
- Primary: h-11, px-6, rounded-lg, professional blue, shadow-sm, hover shadow-md
- Secondary: Same size, gray-200 border, gray-700 text, hover bg gray-50
- Icon-only: w-11 h-11, rounded-lg, gray hover
- Disabled: Opacity 40%

**Toggle Switches:**
- Track: 44px width, rounded-full, gray-200 inactive, blue active
- Thumb: 20px, white with shadow-sm

### Status & Feedback

**Presence Indicators:**
- Size: 10px, rounded-full, solid colors
- Online: Teal (#14B8A6)
- Away: Amber (#F59E0B)
- Busy: Red (#EF4444)
- Offline: Gray (#94A3B8)

**Unread Badges:**
- Professional blue background, white text
- Min 22px, rounded-full, weight 600
- Shadow-sm

**Toast Notifications:**
- Top-right, max-width 360px, rounded-lg, shadow-xl
- White background, border-l-4 (success=green, error=red, info=blue)
- Icon circle with colored background
- Slide-in animation, auto-dismiss 4 seconds

**Loading States:**
- Gray shimmer skeleton screens
- Pulse animation (gray-200 to gray-300)
- Rounded elements matching components

## Images

**Hero Image:** No large hero image - this is an internal communication tool focused on functional efficiency.

**Avatar System:**
- User avatars with colored ring when online (blue for general active state, teal for online)
- Fallback: Blue background (#DBEAFE) with navy initials
- Sizes: 32px (inline), 36px (messages), 48px (list), 56px (profile)

**File Thumbnails:**
- Document icons: Gray backgrounds with colored type indicators
- Image previews: Rounded-lg, max 500px, shadow-md

## Animations

**Subtle Professional Touches:**
- Color transitions: 200ms ease
- Shadow transitions: 200ms ease
- Scale on button press: 0.98 transform, 100ms
- Fade-in for messages: 300ms
- Slide for panels: 250ms cubic-bezier
- No pulse animations except loading states

## Accessibility

- Minimum 44px touch targets
- Focus rings: 2px blue ring, 2px offset
- ARIA labels on all icon buttons
- Keyboard navigation throughout
- WCAG AA contrast ratios minimum
- Screen reader announcements
- Color-blind friendly indicators

## Responsive Behavior

- Desktop (1024px+): Full three-column layout
- Tablet (768-1023px): Two-column, sidebar overlay with backdrop
- Mobile (<768px): Single stack, bottom navigation bar, full-screen chat view

This design creates a professional, trustworthy communication platform where SUPREMO TRADERS LLP's team experiences clarity, efficiency, and business-grade polish in daily collaboration.