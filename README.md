[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/2OhxTc65)
# Project 3: Community Website - Determined

Collaboratively, each team will build the same website for the **Determined** project in a friendly competition to ensure the best outcome.

## Objective

Collaboratively create a website for the **Determined** project. The design of the website and contents have been created by our community partners and can be found in [this presentation](https://www.canva.com/design/DAGVo3IPoCw/uAjYA68088zE2myqO3DRbA/view?utm_content=DAGVo3IPoCw&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hb676cd3008) (also, see attached PDF handout). 
Your task is to implement the website that has been presented, with design enhancements only when neccessary. 
If some information is unavailable, it is also fine to use placeholder values/information (e.g., points) -- you do not need to do research on the subject to ensure accurate information, you just have to ensure full functionality.

## Overview

- **Project Duration:** March 17 -  May 5 
- **Teams:** Pre-determined by the instructor.
- **Deliverables:** Website that satisifies the needs of the community partner, functions correctly, is accessible and responsive.
- **Repository:** Implementation and reports will be done in `project3` repository. Website implementation must be done in branches.

## Project Learning Outcomes

- Apply design and development principles from the course to develop the website.
- Enhance user experience (UX), accessibility, and visual appeal.
- Ensure functionality, responsiveness, and maintainability.
- Practice collaborative workflows using Git and GitHub.

### Connection to Course and Distribution Learning Outcomes

The project learning outcomes apply to all course and distribution learning outcomes reproduced below.

- **Course Learning Outcomes:**
  - Apply HTML, CSS, Markdown, and basic Javascript to develop well-structured, responsive World Wide Web Consortium (W3C) standards-compliant web sites.
  - Evaluate and implement web accessibility measures consistent with the Web Content Accessibility Guidelines (WCAG) version 2 specification.
  - Design front-end user experiences using accepted web design patterns, methods, and information structures.
  - Identify and use strategies of successful visual rhetoric for the web.

- **Distribution Learning Outcomes:**
  - **IP: International & Intercultural Perspectives (IP):**
    - Demonstrate an understanding of cultural complexity and difference.
  - **SP: Scientific Process & Knowledge (SP):**
    - Demonstrate an understanding of the nature, approaches, and domain of scientific inquiry.

## Requirements gathered by class
- **Purpose**: Create a "substance use empathy" game inspired by text-based or scenario-driven formats (e.g., Oregon Trail, Spent).
- **Audience**: Primarily high school and college students, plus general community workshop participants.
- **Key Pages**: Home/landing, About, Resources, Settings, Character creation/selection, Game scenario pages.
- **Features**:
  - Use/Resist point tracking for decisions.
  - Possible toolbox (coping strategies) and phone (hotline/support) for help in tough scenarios.
  - Random/unpredictable events tied to character attributes.
- **Accessibility**: Dyslexic-friendly fonts, adjustable text size, colorblind color schemes, text-to-speech support.
- **Tone & Style**: Serious but empathetic, with a jarring or "uncomfortable" color scheme (often neon green/purple/black) to reflect the gravity of substance abuse.
- **Cultural & Language Considerations**: English only for now, but open to future translation. Avoid stereotypes in character scenarios.
- **Updates & Hosting**: Infrequent updates (at most once a year). Domain not purchased yet. Assistance needed for hosting.
- **Additional Notes**: The website should serve as a teaching tool and encourage empathy, offering real-life resources for help and information.    

## Project Milestones

Project milestones will be conducted in two sprints with the specific tasks undertaken in each sprint primarily determined by each team. 
Roughly half of the website tasks should be finished by the end of sprint 1 and final draft of the website must be finished by April 28th. 
It is each team's responsibility to manage the tasks to ensure the project completion.

### Sprint 1
### DUE: April 9, 2025 by 10am

- **Key Dates:**
  - March 24th, 10am: Review of the website requirements
  - April 9th, 10am: Submit final Sprint 1 Work

### Sprint 2
### DUE: May 5, 2025 by 9am

- **Key Dates:**
  - April 14th, 2:30pm: Review of the website progress
  - April 28th, 2:30pm: Presentation of the final website draft (website should be complete minus some minor enhancements) 
  - May 5th, by 9am: Submit the final version of the website with all feedback addressed

### Development Process:
- Create a project board 
- Create and manage issues in your project 3 repo
- Link issues to your project board
- Use branching strategy with pull requests
- Minimum of 2 team member reviews per PR

## Assessment Criteria

This project is assessed on a pass/fail basis as discussed in the syllabus. To receive credit for this assignment, you must pass each sprint. While the completion of overall project requirements are assessed on a whole team basis, each team member will also be assessed based on their visible contributions (commits, PRs, presentations) and also peer evaluation. You must meet the following criteria:

- **Team Evaluation**
  - Fully implemented website that is technically correct
  - Implementation of all required features
  - Proper responsive design implementation
  - WCAG compliance for accessibility
  - Cross-browser compatibility
  - Successful deployment of the website
  - Comprehensive report for each sprint
  - Functioning GitHub project board with linked issues
**Note: team whose website is selected by the community partners will automatically pass "team evaluation" event if some of the items above are not complete.**  

- **Individual Evaluation**
  - Active participation in team meetings and discussions
  - Regular contributions to individual project branch(es) (must show up on GitHub and be comparable to the rest of the team)
  - Regular creation and approval of pull requests (PRs) with at least two reviews (at least one PR per person per sprint)
  - Meaningful participation in the review sessions
- Completion of assigned tasks (GitHub issues) in individual branches

## Journey Content Update — September 29, 2026

This update imports the journey content supplied in `determinedjournies.zip`, integrates it with the existing game, and repairs invalid scene navigation that would otherwise leave players on blank or non-terminating screens.

The detailed journey authoring and development instructions remain in [`assets/js/GAME_GUIDE.md`](assets/js/GAME_GUIDE.md).

### Journey files

All journey files are stored in `assets/js/journeys/`. The game discovers numbered files automatically, so no hard-coded journey cards were required.

| File | Journey title | Change | Scenes |
| --- | --- | --- | ---: |
| `journey_1.json` | Jason's Journey | Replaced with the supplied expanded version | 17 |
| `journey_2.json` | Around Every Corner | Replaced with the supplied expanded version | 27 |
| `journey_3.json` | Diane | Replaced and repaired malformed ending data | 10 |
| `journey_4.json` | Student Left Blank | Replaced with the supplied expanded version | 19 |
| `journey_5.json` | Morning After | Replaced with the supplied expanded version | 38 |
| `journey_6.json` | Student Left Blank | Added as a new journey | 34 |
| `journey_7.json` | Leo's Journey | Added as a new journey | 41 |

Journeys 1–5 update the website's previous content. Journeys 6–7 are new additions. Titles, descriptions, narratives, resource text, and intentional placeholders were kept as supplied unless a technical correction was required to make a route work.

### Game engine changes

`assets/js/game.js` now handles journey endings more defensively:

- A destination scene with `"end": "relapse"` immediately opens the relapse outcome, even if the player's resistance remains above zero.
- A destination scene with `"end": "success"` is accepted as an alias for the documented `"win"` value. This supports supplied journeys without rewriting their intended outcome.
- A missing destination scene now displays a visible error and restart option instead of silently leaving the game on a blank screen.
- The existing zero-resistance relapse behavior remains unchanged.

### Scene-route repairs

The archive contained valid JSON but several `next_scene_id` values pointed to scenes that did not exist. The following technical corrections were made.

#### Journey 1

- Corrected `scene_07` to `scene_007`.
- Connected the three choices in `scene_004b` to the supplied ending scenes `scene_0010d`, `scene_0010e`, and `scene_0010f`.
- Connected the relapse route in `scene_005c` to `scene_relapse`.

#### Journey 2

- Corrected `011e` to `scene_011e`.
- Replaced two missing `scene_success` references with the supplied `scene_win` ending.

#### Journey 3

- Connected the incomplete positive sober-home route to `scene_005a`.
- Connected the missing `scene_004b` route to `scene_003d`, which continues the authored relapse/recovery branch.
- Moved the incorrectly nested relapse scene to the top level of the journey structure.
- Added valid `scene_win` and `scene_relapse` ending scenes so both final choices resolve correctly.

#### Journey 4

- Redirected missing `scene_003d`–`scene_003i` references to the supplied `scene_003a`–`scene_003c` branches.
- Redirected missing `scene_004c`–`scene_004i` references to the appropriate supplied positive, neutral, or relapse endings in `scene_005c`–`scene_005f`.

#### Journey 7

- Corrected the missing `scene_0024a` and `scene_24b` routes to the authored `scene_0014a` and `scene_0014b` branches.
- Corrected the later `scene_0024a` reference to `scene_0017a`.

Journeys 5 and 6 did not require scene-reference repairs.

### Validation performed

The completed update was checked with the following validations:

- Every journey and the master toolkit parse as valid JSON.
- Every journey contains metadata, numeric initial resistance/use values, and a `scene_001` entry point.
- Every scene contains a title, narration, and choices array.
- Every choice contains a label and points to an existing scene.
- Every reachable non-ending scene has a route to a win, success, or relapse ending.
- `assets/js/game.js` passes the Node.js JavaScript syntax check.
- `git diff --check` reports no whitespace errors.
- `pages/game.html` and journey endpoints 1–7 return HTTP 200 through a local web server, and every served journey response parses as JSON.

### Supplied content notes

Some journey content still intentionally reflects the source archive and may need a later editorial pass:

- Some titles, descriptions, resource labels, and URLs contain values such as `Student Left Blank`, `BLANK`, Lorem Ipsum, local-development URLs, or placeholder resource paths.
- The update does not invent citations, external resources, or missing student-authored narrative content.
- The original `determinedjournies.zip` archive remains in the project root for reference.

For future additions, follow the naming and schema documented in [`assets/js/GAME_GUIDE.md`](assets/js/GAME_GUIDE.md): place each file at `assets/js/journeys/journey_X.json`, keep `metadata` first, begin with `scene_001`, and ensure every `next_scene_id` names an existing scene.



