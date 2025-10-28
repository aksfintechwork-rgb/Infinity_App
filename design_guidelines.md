# Design Guidelines: SUPREMO TRADERS LLP Team Communication Platform

## Design Approach

**Selected Approach:** Design System + Reference Hybrid
- **Primary Inspiration:** Slack, Microsoft Teams, and Linear
- **Rationale:** Internal team communication requires clarity, efficiency, and professional polish. Drawing from established enterprise chat platforms ensures familiar patterns while maintaining a modern, streamlined aesthetic.
- **Key Principles:**
  - Information hierarchy over decoration
  - Instant readability and scanability
  - Minimal cognitive load for daily use
  - Professional enterprise aesthetic

## Typography

**Font System:** Inter (via Google Fonts)
- **Primary Font:** Inter for all UI text
- **Hierarchy:**
  - Brand/Logo: 24px, weight 700
  - Page Headers: 20px, weight 600
  - Section Headers: 16px, weight 600
  - Message Sender Names: 14px, weight 600
  - Body Text (Messages): 15px, weight 400, line-height 1.5
  - Timestamps/Meta: 13px, weight 400
  - Input Placeholders: 14px, weight 400
  - Button Text: 14px, weight 500

## Layout System

**Spacing Primitives:** Use Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16
- Component padding: p-4
- Section gaps: gap-4 or gap-6
- Container padding: p-6 or p-8 for main areas
- Message spacing: mb-3 between messages
- Input areas: p-3

**Grid Structure:**
- Three-column layout for main interface: Sidebar (280px) | Conversation List (320px) | Chat Area (flex-1)
- Mobile: Single column stack with slide-out panels

## Component Library

### Navigation & Structure

**Top Bar (64px height):**
- Left: Brand "SUPREMO TRADERS LLP" with compact logo mark
- Center: Current conversation title with member count
- Right: User profile dropdown, settings icon (24px), notification bell (24px)
- Border bottom: 1px separator

**Sidebar (280px width):**
- Logo/brand area at top (64px matching top bar)
- Navigation sections with headers:
  - "Direct Messages" section
  - "Channels" section  
  - "Create New" button at bottom of each section
- User presence indicators: 8px circle next to names (online/away status)
- Padding: p-4 for section content
- Hover states for conversation items

**Conversation List Panel (320px width):**
- Search bar at top (h-10, rounded-lg)
- Scrollable conversation items with:
  - Avatar (40px circle) or channel icon
  - Conversation name (weight 600)
  - Last message preview (truncated, 1 line)
  - Timestamp (top right, 12px)
  - Unread badge (if applicable, absolute positioned)
- Item height: 72px with p-3
- Active conversation has distinct visual treatment

### Core Chat Components

**Message Bubble Structure:**
- Sender avatar: 32px circle, absolute left
- Content area: ml-12 (to accommodate avatar)
- Sender name + timestamp on same line
- Message body below with proper text wrapping
- Spacing between messages from same user: mb-2
- Spacing between different senders: mb-6
- Reactions container below message (if present)

**Message Types:**
- Text messages: Standard body text, max-width constraint for readability
- File attachments: Card with icon (32px), filename, file size, download action
- Images: Max width 400px, rounded corners (rounded-lg), clickable for full view
- System messages: Centered, smaller text, different visual treatment

**Message Input Area (min-height: 80px):**
- Textarea with rounded-lg border, p-3
- Toolbar above textarea:
  - Attachment button (24px icon)
  - Emoji button (24px icon)
  - Formatting options (bold, italic, code)
- Send button: Primary action, h-10, px-6, positioned bottom-right
- Typing indicators appear above input area

### Modal & Overlay Components

**New Conversation Modal:**
- Centered overlay (max-w-md)
- Header with title and close button
- Input field for conversation name
- Member selection area:
  - Search input
  - Checkbox list of team members with avatars
  - Selected members shown as chips/tags
- Footer with Cancel and Create buttons
- Backdrop blur effect

**User Profile Dropdown:**
- Positioned below profile trigger
- Width: 240px
- User info section: Avatar (48px), name, email
- Menu items: Settings, Preferences, Sign Out
- Border radius: rounded-xl
- Drop shadow for depth

### Form Elements

**Text Inputs:**
- Height: h-10 for single-line, auto for textarea
- Padding: px-3 py-2
- Border radius: rounded-lg
- Focus state with ring treatment

**Buttons:**
- Primary: h-10, px-6, rounded-lg, weight 500
- Secondary: Same dimensions, different visual treatment
- Icon-only: w-10 h-10, rounded-lg
- Hover/active states with subtle transform or opacity shifts

**Checkboxes/Radio:**
- Size: 20px
- Rounded corners for checkboxes (rounded)
- Circular for radio buttons
- Clear checked state

### Status & Feedback

**Typing Indicator:**
- Small animated component (three dots animation)
- Positioned above message input
- Text: "User is typing..."
- Height: 24px

**Presence Indicators:**
- 8px circle
- Positioned bottom-right of avatar with 2px border
- States: online, away, busy, offline

**Unread Badge:**
- Circular badge showing count
- Min-width: 20px, h-20px
- Font size: 12px, weight 600
- Positioned top-right of conversation items

**Toast Notifications:**
- Fixed position: top-right
- Max-width: 320px
- Auto-dismiss after 4 seconds
- Slide-in animation
- Close button included

## Images

**No Hero Images Required** - This is an internal utility application focused on communication efficiency.

**Avatar Images:**
- User avatars: 32px (messages), 40px (conversation list), 48px (profile dropdown)
- Fallback to initials in circle if no image
- All avatars use rounded-full

**File Preview Thumbnails:**
- Image attachments: Max 400px width, maintain aspect ratio
- Document icons: Use Font Awesome or Heroicons for file type representation

## Responsive Behavior

**Desktop (1024px+):** Full three-column layout
**Tablet (768px-1023px):** Two-column with toggle sidebar, conversation list slides over chat
**Mobile (<768px):** Single column stack, navigation via slide-out drawer, conversation list is primary view with full-screen chat when conversation selected

## Accessibility

- All interactive elements min 44px touch target
- Proper focus indicators on all focusable elements (ring-2)
- ARIA labels for icon-only buttons
- Keyboard navigation support (Tab, Enter, Escape)
- Screen reader announcements for new messages
- High contrast text throughout

## Component Specifications

**Sidebar Item Pattern:** h-10, px-3, rounded-lg, flex items-center gap-3, cursor-pointer
**Chat Message Container:** max-w-4xl, mx-auto, px-6
**Modal Backdrop:** fixed inset-0, backdrop blur
**Card Components:** rounded-xl with subtle border, p-4 or p-6
**Dividers:** h-px or w-px, my-4 or mx-4 for spacing

This design system creates a professional, efficient team communication platform that balances SUPREMO TRADERS LLP's enterprise needs with modern usability standards.