# ShareMyAd — Design Overview

**For**: Frontend Designer Handoff
**Date**: March 2026
**Status**: Active Development

---

## Overview

ShareMyAd is a creative management platform built for advertising agencies and in-house marketing teams who need a centralized place to upload, organize, review, and approve ad creatives across clients. Think of it as Google Drive meets Figma's review experience, purpose-built for ad operations. An agency creates workspaces for each of their clients, uploads creative assets (banner ads, social ads, video, HTML5, email headers), organizes them into folders and versioned sets, then shares them via secure links for client review and approval — all without requiring the client to create an account.

The platform pairs with a companion tool called **SiteRevision**, which handles the detailed creative feedback loop. Where ShareMyAd manages the library, organization, and sharing of assets, SiteRevision provides the click-to-annotate, threaded-comment, task-tracking workflow for revisions. Together they form a complete creative production pipeline: upload and organize in ShareMyAd, review and annotate in SiteRevision, then return to ShareMyAd for final sign-off. The signature sign-off feature allows clients to draw or upload a stored signature and formally approve a creative set, creating an auditable approval record.

The design philosophy follows progressive disclosure (Hick's Law): the default experience is extremely simple — drag, drop, share. Advanced features like bulk renaming, compression, validation rules, and workspace administration reveal themselves as users need them. The visual language is clean, light, and minimal (Inter font, soft grays, generous whitespace) so the creative assets themselves are always the visual focus.

---

## User Types

| Role | Description | Access |
|------|-------------|--------|
| **Agency Admin** | Manages the agency account, billing, team members, and client workspaces | Full access to all workspaces, settings, team management |
| **Agency Member** | Designer, account manager, or ad ops person at the agency | Access to assigned workspaces, upload, organize, share |
| **Client Reviewer** | Client-side stakeholder who reviews and approves creatives | View shared links, leave comments, request changes, sign off |
| **Guest Viewer** | Anyone with a share link (no account required) | View-only access to a specific shared set, optional download |

---

## Workspace Model

```
Agency Account (e.g., "Acme Creative Agency")
├── Workspace: Nike (client)
│   ├── Brand Assets (logos, fonts, guidelines)
│   ├── Folders
│   │   ├── Q2 Campaign
│   │   │   ├── Display Ads (design set — 3 versions)
│   │   │   ├── Social Ads (design set — 2 versions)
│   │   │   └── Video (design set — 1 version)
│   │   └── Holiday Campaign
│   └── Share Links
├── Workspace: Coca-Cola (client)
│   ├── Brand Assets
│   ├── Folders
│   └── Share Links
└── Agency Settings (team, billing, integrations)
```

Each workspace is a self-contained client environment. Brand assets uploaded to a workspace are available across all folders within it. Folder structure is user-defined and infinitely nestable. Design sets within folders can have multiple versions (v1, v2, v3) representing creative iterations.

---

## Core Flows

### Flow 1: First Upload (New User)

```
Landing Page → Drag & Drop Zone → Processing → Preview Grid → Generate Share Link → Copy Link
```

**Goal**: Upload to share link in under 60 seconds.

1. User lands on the app — sees a full-screen drop zone (no sign-up required for first upload)
2. Drops a ZIP or folder of ad creatives
3. System extracts, validates against IAB/platform standards, generates thumbnails
4. User sees a preview grid with validation badges (green = standard, yellow = non-standard, red = too large)
5. One click generates a shareable link, auto-copied to clipboard
6. Optional: enter email to send the link directly

**Design Notes**:
- The drop zone IS the landing page. No hero section, no features list. Just the upload area.
- Processing happens in the background while the user optionally enters project details
- The share link is the primary CTA — make it unmissable

---

### Flow 2: Workspace Management (Returning Agency User)

```
Login → Workspace Selector → Folder Browser → Upload / Organize / Share
```

**Goal**: Fast navigation to any client's assets.

1. User logs in → sees workspace selector (list of client workspaces)
2. Selects a workspace → lands on the workspace dashboard (current UI)
3. Dashboard shows:
   - **Action bar**: Create, Upload, Create Folder, Share Link, Get Signatures
   - **Folder chips**: Quick navigation across folder structure
   - **Suggested from activity**: Recently touched design sets
   - **Your files**: Grid or table view of design sets with filter/sort
4. User can drill into folders, open design sets to see versions, upload new assets

**Design Notes**:
- Icon rail (left) provides top-level nav: Home, Folders, Shared, Trash
- Clicking "Folders" expands the folder tree panel
- Grid view shows the stacked card pattern (the hero component — versions peek behind the front card)
- Table view shows file-manager style with Name, Shared By, Size, Date, Status columns
- Toggle between grid and table via the view switcher

---

### Flow 3: Sharing for Review

```
Select Design Set → Configure Share → Generate Link → Send to Client
```

**Goal**: Create a professional, branded share page in two clicks.

1. User selects a design set (or entire folder)
2. Clicks "Share" → share configuration modal:
   - **Link settings**: Custom slug, expiration (never/7d/30d/custom), max views, password protection
   - **Permissions**: View only, view + download, view + comment
   - **Branding**: Client logo, custom message, agency footer
3. Generates a public URL: `share.sharemyad.com/[slug]`
4. Options to copy link, send via email (with custom subject/body), or share via Slack

**Share Page (what the client sees)**:
- Clean, branded page showing the creative set
- Gallery view of all assets with dimensions, format labels
- Download button (if enabled)
- "Request Changes" button → opens SiteRevision annotation flow
- "Approve" button → signature sign-off flow

**Design Notes**:
- Share pages must feel premium and professional — this is client-facing
- No ShareMyAd navigation/chrome on share pages, just the content + minimal footer
- The share page adapts to content: single asset = hero view, multiple = gallery grid
- Password-protected links show a simple branded password gate

---

### Flow 4: Review & Revision Cycle

```
Client Opens Share Link → Reviews → Requests Changes → Agency Revises → Client Approves
```

**Goal**: Structured feedback that eliminates email back-and-forth.

1. Client opens the share link → sees the creative set gallery
2. Client can:
   - **Approve**: Click "Approve" → signature sign-off (draw or use stored signature)
   - **Request Changes**: Click "Request Changes" → redirects to SiteRevision for annotation
3. In SiteRevision, client clicks directly on the creative to place annotation pins
4. Each pin becomes a task (with screenshot, coordinates, description)
5. Agency sees tasks in their dashboard, makes revisions, uploads new version
6. Client receives notification → reviews new version → approves or requests more changes

**Design Notes**:
- The approve/changes decision should be a prominent binary choice, not buried in a menu
- Status flows: Pending → Changes Requested → Revised → Approved
- Version history is always visible (v1, v2, v3 timeline)
- SiteRevision integration is seamless — client doesn't need to know it's a separate tool

---

### Flow 5: Signature Sign-Off

```
Client Clicks Approve → Draw/Select Signature → Confirm → Approval Recorded
```

**Goal**: Formal, auditable client approval.

1. Client clicks "Approve" on a creative set
2. Signature modal appears:
   - **Draw**: Canvas area to draw signature with stylus or mouse
   - **Type**: Type name → rendered in a signature font
   - **Upload**: Upload a saved signature image
   - **Stored**: Select from previously saved signatures
3. Client adds optional approval note ("Approved for Q2 launch")
4. Signs → confirmation screen with timestamp, signer name, approval details
5. Agency sees the approval in the design set's version history with the signature attached
6. PDF receipt is generated (optional download)

**Design Notes**:
- Signature canvas should feel premium (smooth drawing, pen pressure if available)
- Show a clear "What you're approving" summary before the signature step
- Approval is per design set version — approving v3 doesn't affect v1/v2 status
- Locked state: once approved, the version is visually locked (checkmark badge, green border)

---

### Flow 6: Brand Assets Library

```
Workspace → Brand Assets → Upload / Browse / Use
```

**Goal**: Centralized brand collateral for each client.

1. Each workspace has a "Brand Assets" section (separate from campaign folders)
2. Contains:
   - **Logos**: Various formats (SVG, PNG, EPS) with usage labels (primary, secondary, icon)
   - **Colors**: Brand palette with hex/RGB values, copy-on-click
   - **Fonts**: Uploaded font files with preview text
   - **Guidelines**: PDF brand guides, style sheets
   - **Templates**: Reusable creative templates
3. Brand assets are searchable and taggable
4. Assets can be referenced/attached to creative sets for context

**Design Notes**:
- Visual grid layout for logos and colors, list layout for documents
- Color swatches should be large, clickable, with immediate copy feedback
- Font preview should show the actual font rendered at multiple sizes

---

### Flow 7: Bulk Upload & Organization

```
Upload ZIP/Folder → Auto-Detect Structure → Review & Organize → Confirm
```

**Goal**: Handle large creative deliveries efficiently.

1. User uploads a ZIP or drag-drops a folder (up to 500MB)
2. System extracts and auto-detects:
   - Folder structure → preserved as folder hierarchy
   - A/B/C variants → grouped as creative set versions
   - File types → categorized (Display, Social, Video, Email, CTV)
   - Dimensions → validated against IAB standards
3. Preview screen shows the detected structure with validation results
4. User can reorganize (drag to different folders, rename, delete) before confirming
5. Confirm → assets are stored, thumbnails generated, ready to share

**Design Notes**:
- Processing progress should show file-by-file extraction with a visual progress bar
- Validation results use the traffic light system: green checkmark, yellow warning, red error
- The reorganization step is optional — smart defaults should be correct 80% of the time
- For very large uploads, show estimated time and allow background processing

---

## Key UI Components

### Stacked Card (Design Set)
The signature component. Shows the latest version as the front card with older versions peeking behind as offset shadows. Hover reveals version count badge. Click opens the version detail view. Each card shows:
- Creative preview (gradient mockup or actual thumbnail)
- Design set name + category badge (Display, Social, Video, etc.)
- Format dimensions
- Version count + latest status badge (Approved / Changes / Pending)
- Created date

### Icon Rail
Slim left navigation (72px). Four sections: Home, Folders, Shared, Trash. Click Folders to expand the folder tree panel. Settings gear at bottom. Active state uses brand blue highlight.

### Folder Panel
Expandable panel (220px) that slides out from the icon rail. Shows recursive folder tree with expand/collapse arrows, folder icons, selected state. Storage meter at bottom showing usage.

### Action Bar
Horizontal row of quick-action cards: Create (filled primary), Upload or Drop, Create Folder, Share Link, Get Signatures. Each card has an icon and label, hover lifts with shadow.

### Content Toolbar
Controls row above the file grid/table. Left side: "Your files" title, Recent/Starred tab switcher, collaborator avatar stack. Right side: item count, Filter button, list/grid view toggle.

### File Table
Full table view with columns: checkbox, Name (with icon + category badge), Shared By (avatar + name), File Size, Last Modified, Status (dot + label), Action (kebab menu). Hover highlights row, click opens detail view.

### Share Modal
Configuration modal for generating share links. Sections: link settings (slug, expiration, max views, password), permissions (view/download/comment), branding (logo, message), delivery (copy link, email, Slack).

### Signature Modal
Multi-step: summary of what's being approved → signature input (draw/type/upload/stored) → confirmation with timestamp. Canvas supports mouse and touch/stylus.

### Filter Pills
Compact pill buttons for category (All Types, Display, Social, Video, Email, CTV) and status (Any Status, Approved, Changes, Pending). Single row with a thin vertical divider separating category from status pills.

---

## Design System Reference

**Font**: Inter (Google Fonts)
**Theme**: Light only (no dark mode)

| Token | Value |
|-------|-------|
| Background Default | `#ffffff` |
| Background Muted | `#f6f7f9` |
| Foreground Default | `#0a0d11` |
| Foreground Muted | `#606e80` |
| Border Default | `#e1e5ea` |
| Brand Green | `#70fc8e` |
| Brand Blue | `#3765f6` |
| Status Success | `#22c55e` |
| Status Warning | `#f59e0b` |
| Status Error | `#ef4444` |
| Button Radius | `24px` |
| Card Radius | `12px` |
| Base Spacing | `4px` (multiplied: 8, 12, 16, 20, 24, 32, 40, 48) |

**Typography Scale**: Display (56), H1 (40), H2 (32), H3 (24), H4 (20), H5 (16), Body (14), Body Sm (13), Caption (12), Overline (11), Micro (10)

**Weight Scale**: Regular (400), Medium (500), Semibold (600), Bold (700)

---

## Page Inventory

| Page | Auth Required | Description |
|------|--------------|-------------|
| Landing / Upload | No | Full-screen drop zone for anonymous first upload |
| Login / Register | No | Simple auth forms (email + password, Google OAuth) |
| Workspace Selector | Yes | List of client workspaces for the agency |
| Workspace Dashboard | Yes | Main workspace view — action bar, folders, files, cards |
| Design Set Detail | Yes | Version timeline, asset gallery, share/approve actions |
| Brand Assets | Yes | Per-workspace brand collateral library |
| Share Page (public) | No | Client-facing view of shared creative set |
| Review / Annotate | No | SiteRevision integration for feedback |
| Signature Sign-Off | No | Approval flow with signature capture |
| Workspace Settings | Yes | Workspace name, members, branding, integrations |
| Agency Settings | Yes | Billing, team management, global preferences |
| Trash | Yes | Soft-deleted items with restore/permanent delete |

---

## State Diagram: Creative Lifecycle

```
                    ┌──────────────┐
                    │   Uploaded    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Validated    │ (auto: IAB standards check)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Pending     │ (organized, ready for review)
                    └──────┬───────┘
                           │
                  ┌────────▼────────┐
         ┌───────┤  Shared / Sent   ├───────┐
         │       └─────────────────┘       │
         │                                  │
  ┌──────▼───────┐                  ┌──────▼───────┐
  │   Approved    │◄────────────────│   Changes     │
  │  (signed off) │   (new version) │  Requested    │
  └──────┬───────┘                  └──────┬───────┘
         │                                  │
         │                          ┌──────▼───────┐
         │                          │   Revised     │
         │                          │ (new version) │
         │                          └──────┬───────┘
         │                                  │
         │                    (re-shared for review)
         │                                  │
         │                          ┌──────▼───────┐
         │                          │   Approved    │
         │                          │  (signed off) │
         │                          └──────────────┘
  ┌──────▼───────┐
  │   Archived    │
  └──────────────┘
```

---

## Technical Integration Points

### ShareMyAd ↔ SiteRevision

| Trigger | Action |
|---------|--------|
| Client clicks "Request Changes" on share page | Opens SiteRevision with the creative set loaded for annotation |
| Task created in SiteRevision | Status updates to "Changes Requested" in ShareMyAd |
| Agency uploads new version in ShareMyAd | Notification sent to client, SiteRevision tasks linked to new version |
| Client approves in ShareMyAd | SiteRevision tasks auto-closed, approval recorded |

### Validation Engine
External standards (IAB, Google Ads, Meta, TikTok) stored in a JSON config file with source URLs and version tracking. Validation runs client-side on upload for instant feedback, server-side for authoritative results.

### Storage Architecture
Cloudflare R2 for all asset storage (zero egress fees). Presigned URLs for direct browser-to-R2 uploads. Workers handle validation, thumbnail generation, and ZIP extraction.

---

## Open Questions for Design

1. **Workspace switcher**: Dropdown in the top nav, or a dedicated full-page selector?
2. **Share page branding**: How much customization? Just logo + colors, or full custom CSS?
3. **Notification center**: In-app only, or email + Slack integration from day one?
4. **Mobile experience**: Responsive web, or upload-only on mobile with review on desktop?
5. **Signature storage**: Where does the stored signature live — per user (across workspaces) or per workspace?
6. **Version comparison**: Side-by-side diff of v1 vs v2, or just a timeline list?
