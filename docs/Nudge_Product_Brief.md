# Job Search App: Product Brief and Idea Log

*Status as of November 2026. A side project grown out of a personal job search tracker.*

**Working name: Nudge.** The name, layout, and visual design are all still open and are the main things to work on next. Everything below about branding and design describes what's been tried so far, not final decisions. The product ideas and features are the core of this brief.

## The idea in one line

**A calm job app: your whole career, in one place, without the noise.**

Tools like Jobright and LinkedIn show too much at once. This app shows people only what matters today and hides the rest, so the job search feels less stressful.

**Taglines tried so far (open to change)**
- "Your whole career, one calm place." (landing headline)
- "The job app that doesn't shout." (closing call to action)
- "Never miss a follow-up." (earlier headline, still useful for the reminders feature)

## Who it's for (to validate)

Starting assumption: college seniors and new grads applying to entry-level jobs, who feel overwhelmed by cluttered job tools and lose track of applications and follow-ups. Northeastern students are the easiest first audience.

**Not yet validated.** The next step is talking to 10 to 15 job seekers before building more.

## Positioning

- Competitors already track applications (Teal, Huntr, Simplify) or list jobs (Jobright, LinkedIn).
- Nudge's edge is **simplicity and calm, not more features.** Every screen should show one thing clearly before showing three things at once.
- Design rule: soft color used with a purpose. A rejection is information, not an emergency.

## Features

### Version 1 (must have)
- **Accounts:** sign up, log in, and an empty starting state for new users.
- **Application tracker:** company, role, location, status, dates, notes, and the job posting link.
- **Paste a link to fill in:** a "Fill in" button reads the company, role, and location from the link itself. This works for Workday, and company only for Greenhouse, Lever, and Ashby. LinkedIn and Indeed links have no details in the address.
- **Automatic follow-up reminders:** an Applied job with 7 days of no activity moves to "Needs a nudge."
- **Today screen:** a short "Needs you today" list (follow-ups, interview prep, offers to decide on, next steps with contacts), three quick stats, and a career goal snapshot.
- **Quick status changes:** hover over or tap a status label to change it or delete the application, with a two-click delete confirmation.
- **Archive:** for applications that went quiet. "Rejected" is only for actual rejections.

### Version 2 (next)
- **People:** recruiters, referrals, and alumni linked to the companies and jobs they help with.
- **Network web view:** a spider-web visual with "You" at the center, contacts in the inner ring, and companies in the outer ring. Green lines mean you know someone there, and dashed lines mean no contact yet. One-line insight example: "You know someone at 5 of the 10 companies you're tracking."
- **Career section:** current company and role, where you want to be next, and a goals checklist. It keeps Nudge useful after someone is hired.
- **Ask Nudge (AI assistant):** tailor a resume to a posting, research a company, prep for interviews, and plan how to get ahead at work. It uses the user's tracker as context, never invents experience, and is honest that it can't browse the web.
- **"Where your applications went" Sankey chart** on Today: Applied, then Heard back, Still waiting, or No response, then Interviewing, Offer, or Rejected. It includes a response-rate line with reassurance when the rate is low.
- **Target companies:** a dream-company list with priorities.

### Later
- **Job listings, kept small on purpose:** "Fewer listings, better fits." Use public job feeds from company career systems like Greenhouse, Lever, and Ashby to alert users when a followed company posts a role. Show a short daily list of 5 to 10 matched roles, not an endless feed. Avoid LinkedIn and Indeed data, since neither has public access and scraping breaks their terms.
- **Email updates:** connect Gmail or Outlook with read-only access, detect job emails (confirmations, interviews, rejections, offers), and suggest status changes for one-tap approval. This requires Google and Microsoft app review, including a security assessment for Gmail. Simpler alternatives:
  - **Forward to Nudge:** users forward job emails to an address like updates@nudge.
  - **Paste an email:** the AI reads a pasted email and suggests the status change.
- **Mobile app.**
- **Logo uploads** for companies, since loading logos automatically from other sites isn't possible in the prototype.

## Design explorations so far (all open)

The name, layout, and look are not settled. Here's what's been tried, and what was learned from each, to inform the next round of design work.

**Direction to keep:** the design should take stress out of the job search. Soft color used with purpose, plenty of space, and nothing that shouts. A rejection is information, not an emergency.

**Name**
- "Nudge" was chosen because the app's most distinctive behavior was nudging people to follow up. Now that the vision is broader (a whole-career app), it may be worth exploring names that say "calm" or "career" rather than "reminder."
- Other names considered early on: Callback, Next Round, Ghosted.

**Visual styles tried**
1. **A sharp, financial-dashboard look** (navy, squared corners, condensed type). Rejected: too cold and corporate.
2. **A Slack-like layout** with a purple sidebar and #channels. Rejected: too close a copy of Slack. The goal was Slack's friendly design feel, not its layout.
3. **Friendly and clean:** bright yellow (#FFC83D) and navy (#191B2A), rounded pill buttons, and soft corners. This is the current prototype.
4. **A calm sage-green palette** with muted statuses. Tried, but the yellow and navy version was preferred.

**Pieces that worked well and are worth keeping in some form**
- Pale tinted status labels with darker text, instead of solid color blocks, which feel quieter
- A ring chart summarizing applications by status
- A short "Needs you today" list instead of showing everything at once
- A landing page that shows how the app works with small UI previews, not just feature descriptions
- Rounded, friendly type. The prototype currently uses Nunito Sans.

**Explored and dropped**
- A Duolingo-style mascot character, a yellow "n"-shaped creature with moods. It was dropped in favor of a cleaner, simpler look.

**Current prototype layout, for reference only**
- Top navigation with Today, Job search, People, Career, and Ask Nudge
- Archive as an icon at the far right of the Job search tabs

## The prototype (Nudge_prototype.html)

A working sketch to react to, not a final design. A single-file web page with all the screens: landing, sign up, log in, and the app.

- **Demo account:** "Jordan Avery," email demo@nudge.app, password nudgedemo, or the "See the demo" and "Log in as Jordan" buttons. It has 12 applications across all statuses, 7 contacts, 5 target companies, a career plan, and 5 goals. All companies and people are made up.
- **Any other login** opens an empty account.
- **Limits:** accounts are mockups, and nothing saves after a reload. The AI assistant only works when the page is opened on claude.ai. It uses the viewer's own Claude account and asks permission first. The page can't load data or images from other websites.
- **Known issues to fix:**
  - The Sankey chart's labels get too small on phones. Switch to a vertical or stacked layout on small screens.
  - The network web gets crowded past roughly 10 to 15 people and companies. It needs zoom, filtering, or grouping.
  - Company names from links run together, like "Oceanspray," so the user has to check them.

## Roadmap to a real product

1. **Define the user and problem** in one testable sentence.
2. **Interview 10 to 15 job seekers.** Ask what they use now, what frustrates them, and what they'd pay for. Don't pitch Nudge.
3. **Study the competition honestly,** including Teal, Huntr, Simplify, Jobright, and LinkedIn.
4. **Lock the Version 1 feature list.** The test: would someone use it weekly without the extras?
5. **Test the prototype with 5 people.** Watch where they get confused.
6. **Choose a build path:** no-code (Bubble or Softr) for speed, or a coded app for flexibility, likely with a technical cofounder. Budget for hosting, a domain, and AI usage.
7. **Launch a small beta** with Northeastern students. Measure weekly return visits, and add a privacy policy and terms before going public.

## Open questions

- What should the app be called?
- What layout and visual style best deliver "calm"?

- Is "calm and simple" a pain point other job seekers share?
- Free, freemium, or paid?
- Students only, or all early-career job seekers?
- How should the network web handle large networks?
- How should the AI assistant be priced once it runs on Nudge's own account?
