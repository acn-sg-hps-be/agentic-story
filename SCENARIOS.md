# Scenario Reference — HDB Demo

Two agentic workflows built on Claude + MCP, integrated with Autodesk Forma and
the Singapore government SGBuildex API. This document covers each scenario
end-to-end for use in storytelling, live presentation, transcript notes, and
dummy data generation.

---

## Demo 1 — Email → Ticket + ISO 19650

### Overview

An HDB project manager receives a constant stream of emails from consultants,
contractors, and project authorities. Each email may carry action items that
need to be tracked as Autodesk Issues, attachments that must be archived under
ISO 19650-compliant names, and decisions that need to be traceable. Today all of
this is done manually — reading, renaming, filing, and replying. The agentic
workflow replaces that manual loop: emails are automatically triaged into
governed Autodesk Issues, attachments are filed to the ISO 19650 standard using
the project's SGBuildex taxonomy, and the email thread is preserved in
SharePoint as a formal decision record queryable by Microsoft Copilot.

---

### Persona

| Field | Detail |
|---|---|
| **Role** | HDB Project Manager |
| **Pain point** | Receives dozens of emails a week from different consultants. Manually decides which need a ticket, renames and re-files attachments, and tries to remember who agreed to what. |
| **Quote** | "I get dozens of emails a week from different consultants — tracking which ones need a ticket and making sure attachments are filed correctly takes half my day." |
| **Avatar style** | Office worker |

---

### Input

| Field | Detail |
|---|---|
| **Label** | Incoming Emails |
| **Format** | Emails with varied free-text bodies and mixed attachment types — PDF, CAD drawings, scanned transmittals |
| **Key characteristics** | Different senders, different levels of detail, generic attachment names (e.g. `final_v3.pdf`, `drawing_rev2.dwg`), implicit action items buried in the body |

#### Dummy data suggestions

- **Email 1** — From a structural consultant. Subject: "RE: Pile cap design — comments". Body references a design decision made in a meeting. Attachment: `SC_PileCap_Rev3_Final.pdf` (a scanned marked-up drawing).
- **Email 2** — From the M&E contractor. Subject: "Updated shop drawings for approval". Body is brief. Attachment: `MEP_ShopDrawing_Level4_v2.pdf`.
- **Email 3** — From HDB's own QA team. Subject: "Non-conformance — waterproofing spec". Body describes a site observation. Attachment: `NCR_WP_2024_007.pdf`.

---

### Station-by-station walkthrough

#### CAPTURE — Email Review Agent

**What it does:** Reads the incoming email, validates the sender against the
project directory, and confirms the email belongs to an active HDB project.
Flags emails that cannot be matched to a project for human review.

**What the object becomes:** A verified envelope — confirmed sender, confirmed
project, no structural change yet.

**Talking point:** "Before anything is processed, the agent checks: is this
email from a known project stakeholder, and does it belong to an active project?
No more mis-filed emails from the wrong project."

---

#### UNDERSTAND — Three agents in sequence

**1. Content Extraction Agent**

Reads all attachments regardless of format — native PDF, scanned PDF, CAD
transmittal, Word document. Extracts the raw text and any embedded metadata so
the downstream agents have structured content to work with. Handles OCR for
scanned pages.

*Output:* Extracted text and metadata from every attachment, ready for
classification.

*Talking point:* "Whether the attachment is a native PDF or a scanned document
from 1998, the agent reads it. No more 'I can't open this file' or manual
retyping."

**2. SGBuildex Agent**

Calls the SGBuildex API — Singapore's built environment data exchange — to
retrieve the ISO 19650 document naming convention and folder taxonomy specific
to this HDB project. This includes the required metadata columns, the naming
template (Originator–Discipline–Location–Type–…), and the folder path structure.

*Output:* The project's applicable ISO 19650 taxonomy — naming template, folder
path, required metadata fields.

*Talking point:* "The agent doesn't guess the naming convention — it queries the
official Singapore standard from SGBuildex. The taxonomy is always current and
always project-specific."

**3. Classification Agent**

Using the extracted content and the ISO 19650 taxonomy retrieved from SGBuildex,
classifies each attachment by document type, engineering discipline, and project
location. Tags the travelling object with this classification.

*Output:* A tagged item — document type, discipline, location.

*Talking point:* "Classification isn't a lookup table someone maintains manually.
The agent reads the content and maps it to the standard. A structural drawing is
classified as structural. A waterproofing NCR is classified as quality."

---

#### STRUCTURE — Two agents

**1. Ticketing Agent**

Creates a typed Autodesk Issue from the email content, linked to the relevant
project element and assignee. Issue type, discipline, description, and due date
are populated from the email body and classification output.

*Output:* An Autodesk Issue on the platform — typed, linked, assigned.

*Talking point:* "The agent reads the email and raises the right kind of issue in
Autodesk. No copy-pasting. No forgetting to assign it. It's there the moment the
email lands."

**2. Document Archival Agent**

Files each attachment into the correct folder using the ISO 19650-compliant file
name built from the SGBuildex taxonomy. Populates all required metadata columns.
The generic `final_v3.pdf` becomes `HDB-STR-L4-DR-0042-Rev3.pdf` in the right
folder, with discipline, originator, revision, and status fields populated.

*Output:* Attachments archived under compliant names, in the correct folder,
with full metadata.

*Talking point:* "The attachment that arrived as 'final_v3.pdf' is now
'HDB-STR-L4-DR-0042-Rev3.pdf', in the right folder, with every metadata column
filled. The document controller's afternoon is freed up."

---

#### GOVERN — Decision Record Agent

Archives the full email thread into a SharePoint document library as a formal
ISO 19650 decision record. Captures who sent what, when, and what was agreed or
instructed. The record is indexed so that Microsoft Copilot can answer questions
like "what was decided about the pile cap design in March?" and trace answers
back to the original email.

*Output:* An ISO 19650 decision record in SharePoint — email thread, linked
documents, decision context, queryable by Copilot.

*Talking point:* "ISO 19650 requires decisions to be traceable. This agent takes
the email thread — which is where most real decisions happen — and turns it into
a formal, searchable decision record. Six months later, when someone asks 'who
approved that change?', Copilot can answer in seconds."

---

### Value Delivered

| Label | What it means |
|---|---|
| **Automated Ticketing** | Every email that requires action becomes an Autodesk Issue automatically — no manual triage, no missed items |
| **Compliant Archiving** | Every attachment is renamed and filed to the ISO 19650 standard, using the project's SGBuildex taxonomy — zero manual renaming |
| **Decision Traceability** | Every email thread is preserved as a formal decision record in SharePoint, queryable by Copilot — full audit trail without any extra effort |

---

### Demo script notes (step by step)

1. **Actor intro** — Show the persona card. Describe the pain: dozens of emails,
   half a day lost to manual work. Let the audience feel the problem before the
   solution.
2. **Input appears** — Show the incoming emails visual. Emphasise the variety:
   different senders, different formats, generic names. "This is what lands in
   the inbox every morning."
3. **CAPTURE** — "The first thing the agent does is check: does this email belong
   to a live project?" Pause briefly. "It does."
4. **UNDERSTAND** — Three agents working in sequence. Emphasise the SGBuildex
   API call: "It's not guessing the standard — it's querying it." Then
   classification: "Now we know exactly what type of document this is."
5. **STRUCTURE** — Two outputs happening simultaneously. "A ticket is raised in
   Autodesk. The attachment is renamed and filed — automatically."
6. **GOVERN** — "And the email thread itself? It doesn't disappear into someone's
   inbox. It becomes a decision record." This is the moment to mention Copilot.
7. **Value cards** — Read each label. Pause on Decision Traceability — this is
   the one HDB will react to most strongly.

---

### Dummy data checklist

- [ ] 3 sample emails (different senders, subjects, attachment names as above)
- [ ] 3 sample attachments (can be real-looking PDFs or labelled placeholders)
- [ ] A sample Autodesk Issue screenshot showing auto-populated fields
- [ ] A sample ISO 19650-compliant file name (e.g. `HDB-STR-L4-DR-0042-Rev3.pdf`)
- [ ] A sample SharePoint view showing the decision record with email thread
- [ ] A sample Copilot query result ("Who approved the pile cap change?")

---
---

## Demo 2 — WhatsApp → Safety Observation

### Overview

A RE/RTO Engineer on an HDB construction site uses a WhatsApp group to
coordinate with the site team. Hazards are flagged informally in the chat —
photos taken on phones, quick text notes, back-and-forth discussion. Today,
someone has to manually read the thread, identify the hazard, fill in an
Autodesk Forms safety observation, attach the photo, and ensure the statistics
update in the management Power BI dashboard. The agentic workflow handles all of
this from a screenshot: Claude reads the thread and photos, queries SGBuildex for
the official hazard taxonomy, classifies the hazard, auto-populates the Autodesk
Forms record (via MCP), attaches the photo, and triggers the Power BI refresh —
all from a single screenshot dropped into Claude Chat.

---

### Persona

| Field | Detail |
|---|---|
| **Role** | RE/RTO Engineer |
| **Pain point** | Site hazards are captured informally in WhatsApp. Converting them into formal safety records is manual, slow, and easy to forget — especially at the end of a long site day. |
| **Quote** | "The team flags hazards in our site chat group — I screenshot the thread and turn it into a proper safety record before anything gets missed." |
| **Avatar style** | Inspector / site |

---

### Input

| Field | Detail |
|---|---|
| **Label** | WhatsApp Screenshots |
| **Format** | One or more screenshots from a WhatsApp group chat — containing a mix of text messages and embedded site photos |
| **Key characteristics** | Informal language, photos taken on a phone, no structured fields, discussion may span multiple messages before the hazard is clearly described |

**Important note for demo:** There is no WhatsApp bot or API integration here.
The engineer simply takes a screenshot of the relevant chat thread and uploads it
to Claude Chat. The MCP servers handle the Autodesk Forms side. This is
deliberately low-friction — no special app, no group admin access needed.

#### Dummy data suggestions

- **Screenshot 1** — A WhatsApp group chat showing 4–5 messages. One message
  says "hey got unsafe scaffolding at Level 6, take a look". Another replies
  with a photo of scaffolding with a missing guardrail. A third message says
  "who's responsible for this area?" Final message: "I'll log it now".
- **Photo content** — Scaffolding on a building floor, clearly showing a missing
  or displaced guardrail at height. Phone camera quality, slightly angled.
- **Hazard category** — Falls from height (one of the 7 MOM-defined major hazard
  categories in SGBuildex).

---

### Station-by-station walkthrough

#### CAPTURE — Two agents

**1. Conversation Summary Agent**

Reads the WhatsApp screenshot(s) and extracts the chat thread as structured
text. Identifies the key facts: what hazard was reported, where, by whom, and
when. Produces a concise summary of the incident context for downstream agents.

*Output:* A structured conversation summary — reported issue, location, time,
involved parties.

*Talking point:* "The agent reads the screenshot like a human would — it
understands the conversation, not just the pixels. It knows who said what and
what the hazard is, even if it was described informally across five messages."

**2. Image Analysis Agent**

Applies computer vision to the site photos embedded in the screenshot. Identifies
hazard objects (e.g. missing guardrail, exposed rebar, unsecured materials),
unsafe conditions, and relevant scene context (height, proximity to workers,
equipment present).

*Output:* Detected hazard objects and conditions identified in the photos.

*Talking point:* "The photo isn't just an attachment — the agent actually looks
at it. It can see the missing guardrail. It flags the height. It reads the scene
the way a safety inspector would."

---

#### UNDERSTAND — Two agents

**1. SGBuildex Agent**

Queries the SGBuildex API to retrieve the official hazard categories and safety
observation taxonomy for the project. In Singapore, MOM defines major hazard
categories (falls from height, struck by, etc.) and SGBuildex surfaces these
with the required fields and severity levels for the observation form.

*Output:* The applicable hazard taxonomy — category list, severity levels,
required fields.

*Talking point:* "There are seven major hazard categories under MOM's framework.
The agent doesn't guess — it retrieves the official taxonomy from SGBuildex and
matches the hazard against it."

**2. Hazard Identification Agent**

Maps the hazard objects detected by Image Analysis to the correct official
category from the SGBuildex taxonomy. Assigns severity and produces a classified
hazard description ready to populate the observation form.

*Output:* A classified hazard — official category, severity, and description.

*Talking point:* "Now we have a proper classification: falls from height,
severity high, missing guardrail at Level 6. Not a free-text note — a
structured, standard-compliant classification."

---

#### STRUCTURE — Two agents

**1. Form Agent**

Creates and populates the Autodesk Forms safety observation record using the
conversation summary and classified hazard data — via the Autodesk MCP server
connected to Claude Chat. The form fields (hazard type, location, description,
severity, responsible party) are auto-populated. The engineer can review the
draft form in Claude Chat before submission, or it can be auto-submitted.

*Output:* A completed safety observation form in Autodesk, ready for review or
submission.

*Talking point:* "Claude talks directly to Autodesk Forma through an MCP server.
The form is filled out — not by the engineer typing field by field, but by the
agent reading the screenshot and mapping it to the right fields. The engineer
just reviews and confirms."

**2. Relationship Agent**

Attaches the site photo extracted from the screenshot to the observation form as
formal evidence. Establishes the metadata relationship between the photo and the
form so the record is complete and traceable.

*Output:* Photo attached to the observation form with metadata relationship.

*Talking point:* "The photo that was sent in a WhatsApp chat is now formal
evidence, attached to the official record in Autodesk. The chain of custody is
intact."

---

#### GOVERN — Dashboard Agent

Triggers the downstream data pipeline to refresh the Power BI safety dashboard.
Management sees updated site observation counts, hazard category breakdowns, and
trend lines in real time — without anyone manually exporting data or updating a
spreadsheet.

*Output:* Power BI dashboard refreshed — latest safety observation statistics
visible to management.

*Talking point:* "The moment the observation is filed, the management dashboard
updates. No end-of-week report. No manual export. The data is live."

---

### Value Delivered

| Label | What it means |
|---|---|
| **Automated Form Workflow** | A WhatsApp screenshot becomes a complete, filed Autodesk Forms safety observation — no manual form-filling, no missed records |
| **Real-Time Insight** | Management's Power BI dashboard reflects the latest site safety statistics the moment an observation is filed |

---

### Demo script notes (step by step)

1. **Actor intro** — Show the RE/RTO Engineer persona. Describe the scenario:
   hazards flagged in WhatsApp, someone has to turn it into a formal record.
   "This is how safety observations actually get reported on site."
2. **Input appears** — Show the screenshot visual. Emphasise what's in it: chat
   messages, a site photo, informal language. "This is the raw input — a
   screenshot."
3. **CAPTURE** — Two agents working together. "The Conversation Summary Agent
   reads the thread. The Image Analysis Agent looks at the photo." Pause. "It
   can see the missing guardrail."
4. **UNDERSTAND** — "Before classifying, the agent queries SGBuildex for the
   official MOM hazard taxonomy." Then: "Falls from height. Severity: high.
   That's the classification — not a guess, the official standard."
5. **STRUCTURE** — "The Form Agent talks to Autodesk Forma directly through an
   MCP server. The form is populated. The engineer reviews it in Claude Chat."
   Then: "The photo is attached as evidence."
6. **GOVERN** — "And the dashboard? It updates the moment the form is filed. No
   export. No report. Management sees it in real time."
7. **Value cards** — Two cards. Automated Form Workflow: "One screenshot, one
   complete safety record." Real-Time Insight: "Management visibility without any
   extra work."

---

### Dummy data checklist

- [ ] A WhatsApp screenshot (real or mocked) showing a hazard discussion with an
      embedded site photo — 4–6 messages, informal tone
- [ ] A site photo showing a clear safety hazard (missing guardrail, exposed
      rebar, unsecured load) — phone camera quality
- [ ] A sample Autodesk Forms record showing auto-populated fields (hazard type,
      location, severity, description, responsible party)
- [ ] A sample Power BI dashboard slide showing observation counts by category
      and a trend line — before and after the new observation appears
- [ ] Optional: a Claude Chat screenshot showing the form draft rendered in the
      chat interface before submission
