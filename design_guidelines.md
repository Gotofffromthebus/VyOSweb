# Design Guidelines: VyOS Intent-Based Network Controller

## Design Approach: Enterprise Technical Interface

**Selected System:** Carbon Design System with Material Design interactive elements  
**Rationale:** Network operations tools require data-heavy displays, clear information hierarchy, and professional reliability. Carbon excels at enterprise dashboards while Material provides excellent interactive feedback for AI-assisted features.

**Core Principles:**
- Clarity over decoration in technical workflows
- Efficient information density without clutter  
- Professional trust through consistent patterns
- Dark mode optimized for extended use

---

## Color Palette

**Dark Mode (Primary):**
- Background Base: 220 15% 8%
- Surface Elevated: 220 12% 12%
- Surface Interactive: 220 10% 16%
- Border Subtle: 220 10% 20%
- Border Interactive: 220 30% 35%

**Brand & Semantic Colors:**
- Primary (AI/Intent Actions): 210 95% 58%
- Success (Valid Config): 142 70% 45%
- Warning (Validation Issues): 38 92% 50%
- Error (Config Errors): 0 72% 55%
- Accent (Network Topology): 280 75% 60%

**Text Hierarchy:**
- Primary Text: 220 10% 95%
- Secondary Text: 220 8% 70%
- Muted Text: 220 6% 50%
- Code/Monospace: 180 100% 90%

---

## Typography

**Font Stack:**
- Interface: Inter (Google Fonts) - Primary UI text
- Monospace: JetBrains Mono (Google Fonts) - Configurations, commands, code
- Headings: Inter with adjusted weights

**Type Scale:**
- Section Headers: text-2xl font-semibold (24px)
- Panel Titles: text-lg font-medium (18px)
- Body Text: text-sm (14px)
- Code/Config: text-sm font-mono (14px)
- Labels: text-xs font-medium uppercase tracking-wide (12px)
- Metadata: text-xs text-muted (12px)

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 for consistency
- Component padding: p-4, p-6
- Section gaps: gap-6, gap-8  
- Card spacing: p-6
- List items: py-2, py-3

**Grid Structure:**
- Main canvas: Split layout with resizable panels
- Sidebar: 280px fixed width for navigation/tools
- Content area: Flexible with max-w-7xl containers
- Topology editor: Full-width canvas area

---

## Component Library

**A. Navigation & Chrome:**
- Top Bar: Fixed header with app title, AI copilot toggle, user menu
- Left Sidebar: Collapsible navigation with sections (Topology, Configurations, Templates, History)
- Breadcrumbs: Show current location in configuration hierarchy
- Command Palette: Cmd+K accessible quick actions (Material Design styled)

**B. Core Components:**

*AI Intent Interface:*
- Floating chat-style input at bottom of main area
- Natural language prompt with AI suggestions dropdown
- Generated config preview panel with "Apply" action
- Intent history sidebar showing previous requests

*Configuration Editor:*
- Monaco-style code editor with VyOS syntax highlighting
- Line numbers and error indicators in gutter
- Diff viewer with side-by-side or inline modes
- Validation panel showing errors/warnings inline

*Network Topology Visualizer:*
- Canvas with zoom/pan controls (top-right corner)
- Draggable node components (routers, switches, connections)
- Connection lines with protocol labels
- Mini-map navigator (bottom-right)
- Property inspector panel (right sidebar when node selected)

*Template Library:*
- Grid of template cards (2-3 columns)
- Each card: Icon, title, description, "Use Template" button
- Categories: Firewall Rules, VPN Setup, Routing Policies, QoS
- Search and filter bar at top

*Command Suggestions:*
- Inline autocomplete dropdown (Material Design elevation)
- Command syntax hints below input
- Recently used commands quick access

**C. Data Display:**
- Configuration Tables: Zebra striping with hover states
- Status Indicators: Colored dots (green/yellow/red) with labels
- Progress Bars: For deployment/validation status
- Toast Notifications: Top-right for actions (success/error/info)

**D. Forms & Inputs:**
- Labeled inputs with helper text below
- Validation states with inline error messages
- Toggle switches for boolean configs
- Dropdown selects with search for long lists
- Multi-select chips for array values

---

## Interaction Patterns

**Panel Management:**
- Resizable split panes with drag handles
- Collapsible sidebars with smooth transitions (300ms ease-out)
- Tab navigation for multi-view areas
- Maximizable panels for focus mode

**AI Copilot Flow:**
1. User enters natural language intent
2. AI processes with loading indicator
3. Generated config appears in preview
4. Validation runs automatically
5. User reviews diff before applying

**Topology Editing:**
- Click canvas to add nodes from palette
- Drag between nodes to create connections
- Double-click nodes to edit properties
- Right-click for context menu
- Undo/redo with Cmd+Z/Cmd+Shift+Z

---

## Visual Enhancements

**Syntax Highlighting (VyOS Configs):**
- Keywords: 210 80% 65%
- Strings: 142 60% 55%
- Numbers: 38 85% 60%
- Comments: 220 20% 50%

**Icons:** Heroicons via CDN
- Outline style for navigation and secondary actions
- Solid style for primary buttons and active states

**Elevation & Depth:**
- Level 0: Base background (flat)
- Level 1: Cards/panels (border + slight bg lift)
- Level 2: Dropdowns/modals (shadow-lg)
- Level 3: Tooltips (shadow-xl)

**Animations:** Minimal, purposeful only
- Panel transitions: 300ms ease-out
- Hover states: 150ms ease-in-out
- Loading spinners for async operations
- No scroll-triggered or decorative animations

---

## Images

**Network Topology Iconography:**
- Router nodes: Router icon with colored accent based on status
- Switch nodes: Network switch icon  
- Connection lines: Animated dots showing data flow direction
- Background: Subtle grid pattern (barely visible, 5% opacity)

**Template Preview Thumbnails:**
- Abstract network diagrams illustrating each template's purpose
- Consistent icon style across all templates
- Use SVG illustrations, not photos

**Empty States:**
- Centered illustrations with helpful text
- "No configurations yet" - show terminal illustration
- "No topology defined" - show network diagram placeholder

No hero images needed - this is a utility application focused on workflow efficiency.