

# IRL Friend Finder – College Edition 🎮

A multi-campus social coordination platform with real-time chat, campus isolation, and a dark gaming aesthetic with neon accents.

---

## 1. Authentication & Campus Selection
- **Campus selection screen** with animated cards for SRMAP, VIT-AP, Amrita AP, and VVITU
- User enters **username only** → system auto-attaches campus domain (e.g., `john123@srmap.edu.in`)
- **Email verification** via Supabase Auth magic link
- Reject manual full emails, domain overrides, or external domains
- Campus selection stored and enforced throughout the entire app experience

## 2. User Profile System
- Profile creation after verification: Name, Department, Year, Interest Tags, Bio, Profile Photo
- **Reputation score** displayed with glowing neon badge
- Profiles visible **only within the same campus** by default
- Optional toggle: **"Allow cross-campus discoverability"**
- Profile photo upload via Supabase Storage

## 3. Campus Dashboard (Home Screen)
- Dark themed dashboard with neon accent borders and glowing cards
- **Nearby Students** – users with shared interest tags on the same campus
- **Active Sessions** – live campus sessions with join buttons
- **Trending Interests** – top tags visualized as animated bubbles/chips
- **Right Now Mode broadcasts** – live intent cards with countdown timers
- Everything strictly filtered by the user's campus

## 4. Real-Time Chat System (Core Feature)

### 4.1 One-to-One Campus Chat
- Send/accept connection requests within the same campus
- Real-time messaging using Supabase Realtime subscriptions
- Typing indicators, online/offline presence, message timestamps, read receipts
- Clean Discord-style dark chat UI with neon message bubbles

### 4.2 Group / Session-Based Chat
- Create sessions: Study group, Hobby meetup, Gym partner, etc.
- Session fields: Title, Location, Time, Interest Tag
- Each session auto-creates a group chat room
- Join/leave session, real-time group messaging
- **"I'm Here" check-in button** for physical arrival confirmation
- Campus-specific only

### 4.3 Cross-Campus Friends Chat
- **"Explore Other Campuses"** toggle in settings
- Search students from other campuses when enabled
- Cross-campus friend requests with mutual acceptance required
- Chat only after both accept – visually separated from campus chat
- Separate chat section with different neon color scheme to distinguish it

## 5. Right Now Mode (Real-Time Intent Broadcasting)
- Broadcast temporary intents: "Studying OS for 2 hours", "Need gym partner"
- Countdown timer with auto-expiration
- Real-time appearance/disappearance on dashboard
- Boosted visibility with glowing animation while active
- Campus-specific broadcasts only

## 6. Campus Heatmap
- Interactive **OpenStreetMap** (Leaflet.js) for each campus
- Display active sessions and live intent clusters
- Color-coded markers: 🔵 Study, 🟢 Hobby, 🔴 Help Needed, 🟣 Social
- Filtered strictly by selected campus
- Pulsing markers for active "Right Now" broadcasts

## 7. Badge & Reputation System
- Earn badges within campus: Study Buddy, Organizer, Helpful Senior, etc.
- Reputation grows based on session participation, connections, check-ins
- Badges displayed on profile with glowing neon effects
- Campus-local reputation – no cross-campus mixing

## 8. Database Design (Supabase)
- **campuses** – campus registry (easily add new ones)
- **profiles** – user profiles linked to campus
- **connections** – friend requests & status (same-campus + cross-campus)
- **messages** – chat messages with real-time subscriptions
- **sessions** – study/hobby sessions with location & time
- **session_members** – who joined which session
- **broadcasts** – Right Now Mode intents with expiry
- **badges** – earned badges per user
- **user_roles** – separate roles table for security
- Row-Level Security on all tables enforcing campus isolation

## 9. Visual Design
- **Dark base** with deep navy/charcoal backgrounds
- **Neon accents**: cyan, magenta, electric purple glows
- Glassmorphism cards with subtle blur and border glow
- Smooth animations on transitions, hover states, and notifications
- Discord/gaming-inspired layout with sidebar navigation
- Responsive design for mobile and desktop

## 10. Navigation Structure
- **Sidebar**: Dashboard, Chat, Sessions, Heatmap, Profile, Settings
- **Top bar**: Campus indicator, notifications bell, online status
- **Bottom nav** on mobile with glowing active indicator
- Cross-campus section as a clearly separated tab in chat

