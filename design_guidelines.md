# Design Guidelines: Infinity Technology Team Communication Platform

## Design Approach

**Selected Approach:** Banking-inspired Professional Dashboard (ICICI-style)
- **Primary Inspiration:** Modern banking interfaces with warm, professional aesthetics
- **Rationale:** Internal business communication demands trust, efficiency, and a professional corporate feel inspired by premium banking applications.
- **Key Principles:**
  - Clean, professional banking interface with warm aesthetics
  - Solid colors with strategic subtle accents
  - Orange/coral primary palette conveying energy and professionalism
  - Warm beige/cream backgrounds for comfortable extended use
  - Clear visual hierarchy through typography and spacing
  - Minimal, purposeful design elements

## Color System

**Primary Palette:**
- **Vibrant Orange:** Primary actions, brand elements (#F26122 / HSL 18° 95% 54%)
- **Warm Beige:** Main background (#F5F0E8 / HSL 40° 40% 95%)
- **Soft Cream:** Secondary backgrounds (#F8F3ED / HSL 40° 30% 92%)
- **Warm Brown:** Text, important elements (#3A2F28 / HSL 25° 25% 15%)
- **Light Beige:** Borders, dividers (#E8DFD4 / HSL 40° 25% 85%)
- **Pure White:** Cards, elevated surfaces (#FFFFFF)

**Accent Colors:**
- **Success Green:** #10B981
- **Warning Amber:** #F59E0B
- **Error Red:** #EF4444
- **Chart Purple:** #B864E6 (for charts only)

**Application Strategy:**
- Primary buttons: Solid orange (#F26122) with white text, rounded corners
- Active states: Orange background (8% opacity on warm beige)
- Borders: Light beige with orange accent on focus
- Shadows: Subtle, warm-toned shadows for depth
- Text: Warm brown on light backgrounds, ensuring WCAG AAA
- Sidebar: Darker orange background (#C1541E) with white icons and text for proper contrast
- Charts: Solid orange and purple colors (NO gradients)

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
- Active message: shadow-inner with orange tint

**Grid Structure:**
- Desktop: Sidebar (280px) | Conversation List (340px) | Chat Area (flex-1)
- Tablet: Two-column with slide-over panels
- Mobile: Single column stack with bottom navigation

## Component Library

### Navigation & Structure

**Top Bar (64px):**
- Background: White (#FFFFFF)
- Border-bottom: 1px solid light beige (#E8DFD4)
- Left: "Infinity Technology" orange text (weight 700), circular logo (36px)
- Center: Conversation title (warm brown, weight 500) with member count badge
- Right: Search icon (warm brown, hover bg cream), notification bell with orange badge, profile avatar (36px) with orange ring
- Box-shadow: shadow-sm for subtle depth

**Sidebar (280px):**
- Background: Darker orange (#C1541E / HSL 18° 75% 38%) with white text for WCAG compliance
- Header (72px): Darker orange background, white text
- Section headers: Uppercase labels (12px, weight 500, white text with 90% opacity)
- Conversation items: rounded-lg, hover bg rgba(255,255,255,0.15), active bg rgba(255,255,255,0.2) with white accent
- Create buttons: Full-width, rounded-lg, white background with orange text
- Presence indicators: 10px circles (online=green, away=amber, offline=white/40)
- Dividers: 1px rgba(255,255,255,0.2) between sections

**Conversation List Panel (340px):**
- Background: Warm beige (#F5F0E8)
- Search bar: rounded-lg, white background, shadow-sm, orange border on focus
- Conversation cards: White background, rounded-lg, padding p-4, border-l-3 orange accent for unread
- Avatar: 48px with orange ring for unread conversations
- Unread count: Orange circular badge, top-right
- Last message: Truncated, warm brown text with 70% opacity
- Active state: Soft cream background, shadow-md, orange left-border

### Chat Interface

**Message Area:**
- Maximum width: 900px, centered
- Background: Pure white
- Date dividers: Centered text with gray-300 horizontal lines, gray-600 text

**Message Bubbles:**
- Avatar: 36px, orange ring for online users
- Own messages: Vibrant orange background (#F26122), white text, right-aligned, rounded-2xl (but square on sender side)
- Other messages: White background with light beige border, warm brown text, left-aligned, rounded-2xl (but square on sender side)
- Sender name: Weight 600, warm brown
- Timestamp: Warm brown with 60% opacity, 13px
- Max-width: 600px
- Padding: p-4, line-height 1.6
- Shadow-sm on hover

**Message Types:**
- Text: Standard with orange links
- Files: White card with light beige border, file icon (24px), shadow-sm, rounded-lg
- Images: Max 500px, rounded-lg, shadow-md, lightbox on click
- Code blocks: Warm brown background with syntax highlighting, rounded-lg, p-4
- Reactions: Soft cream pill badges, rounded-full, orange text, border on hover

**Message Input (80px height):**
- White background, rounded-xl, shadow-lg, border light beige
- Textarea: p-4, auto-expand to 120px max
- Toolbar: Warm brown icon buttons (20px) - attachment, emoji, formatting
- Send button: Vibrant orange (#F26122), rounded-lg, px-6, shadow-sm, hover shadow-md
- Typing indicator: Orange animated dots above input

### Modal Components

**New Conversation Modal:**
- Centered, max-width 520px, rounded-xl, shadow-2xl
- White background with soft cream header
- Header: Warm brown text, border-bottom light beige
- Backdrop: Blur(12px) with dark overlay (rgba(0,0,0,0.4))
- Member selection: Orange checkboxes, avatar list with presence indicators
- Selected members: Orange pill chips, rounded-full, with remove icon
- Footer: Border-top light beige, primary button (orange), secondary (beige outline)

**Profile Dropdown:**
- Width: 280px, rounded-lg, shadow-xl
- White background, border light beige
- User section: Soft cream background, avatar (48px, orange ring), padding p-4
- Menu items: rounded-md hover bg soft cream, warm brown text
- Presence selector: Colored circles with labels
- Dividers: Light beige

### Form Elements

**Inputs:**
- Height: h-11, rounded-lg
- Border: 1px light beige, focus orange with shadow-sm
- Background: White
- Placeholder: Warm brown with 50% opacity

**Buttons:**
- Primary: h-11, px-6, rounded-lg, vibrant orange (#F26122), white text, shadow-sm, hover shadow-md
- Secondary: Same size, light beige border, warm brown text, hover bg soft cream
- Icon-only: w-11 h-11, rounded-lg, hover bg soft cream
- Disabled: Opacity 40%

**Toggle Switches:**
- Track: 44px width, rounded-full, light beige inactive, orange active
- Thumb: 20px, white with shadow-sm

### Status & Feedback

**Presence Indicators:**
- Size: 10px, rounded-full, solid colors
- Online: Teal (#14B8A6)
- Away: Amber (#F59E0B)
- Busy: Red (#EF4444)
- Offline: Gray (#94A3B8)

**Unread Badges:**
- Vibrant orange background, white text
- Min 22px, rounded-full, weight 600
- Shadow-sm

**Toast Notifications:**
- Top-right, max-width 360px, rounded-lg, shadow-xl
- White background, border-l-4 (success=green, error=red, info=orange)
- Icon circle with colored background
- Slide-in animation, auto-dismiss 4 seconds

**Loading States:**
- Gray shimmer skeleton screens
- Pulse animation (gray-200 to gray-300)
- Rounded elements matching components

## Images

**Hero Image:** No large hero image - this is an internal communication tool focused on functional efficiency.

**Avatar System:**
- User avatars with colored ring when online (orange for general active state, green for online)
- Fallback: Soft cream background (#F8F3ED) with warm brown initials
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
- Focus rings: 2px orange ring, 2px offset
- ARIA labels on all icon buttons
- Keyboard navigation throughout
- WCAG AA contrast ratios minimum
- Screen reader announcements
- Color-blind friendly indicators

## Responsive Behavior

- Desktop (1024px+): Full three-column layout
- Tablet (768-1023px): Two-column, sidebar overlay with backdrop
- Mobile (<768px): Single stack, bottom navigation bar, full-screen chat view

This design creates a professional, trustworthy banking-inspired communication platform where Infinity Technology's team experiences warmth, clarity, efficiency, and business-grade polish in daily collaboration. The orange/coral and warm beige color scheme conveys energy and professionalism while maintaining excellent readability and accessibility.