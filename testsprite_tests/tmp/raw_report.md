
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** aerojet-academy
- **Date:** 2026-03-01
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Register a new student account and see post-registration payment-proof instructions
- **Test Code:** [TC001_Register_a_new_student_account_and_see_post_registration_payment_proof_instructions.py](./TC001_Register_a_new_student_account_and_see_post_registration_payment_proof_instructions.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Registration page did not render: page contains 0 interactive elements and an empty DOM after navigating to http://localhost:3000/register
- Expected 'Register' heading or registration form controls were not found on the page
- Unable to perform registration actions because no input fields or buttons are present
- SPA appears not to be mounted or the server returned an empty response, resulting in missing UI
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/17321c7e-4a4f-4785-81c6-c3db39309089
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 First-login wizard: select EXAM_ONLY and reach Student dashboard
- **Test Code:** [TC003_First_login_wizard_select_EXAM_ONLY_and_reach_Student_dashboard.py](./TC003_First_login_wizard_select_EXAM_ONLY_and_reach_Student_dashboard.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- /login page did not render: no email or password input fields and no 'Sign in' button were found after clicking Login and waiting.
- SPA route /login returned an empty DOM (0 interactive elements) despite the Login link being clickable.
- Unable to proceed to pathway selection because the login UI required to authenticate is not present.
- Multiple wait attempts (3s, 3s, 5s) did not reveal the expected interactive elements, indicating a rendering or routing failure.
- The missing interactive elements prevented verification of the 'Choose your study pathway' flow and irreversible warning behavior.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/0d805865-5b1d-4725-8eae-f8464bdcab42
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 First-login wizard: confirm selection shows success and redirects to /student
- **Test Code:** [TC004_First_login_wizard_confirm_selection_shows_success_and_redirects_to_student.py](./TC004_First_login_wizard_confirm_selection_shows_success_and_redirects_to_student.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Next.js development overlay shows error 'Module not found: Can't resolve 'dns'', preventing the application from rendering.
- Login action completed but the application did not render the main UI (blank/app overlay), so pathway selection and confirmation could not be performed.
- Student dashboard was not reached; URL does not contain '/student' and no success notification was observed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/311c8b90-faef-40a1-a31f-f8d2240074ee
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 First-login wizard: cannot proceed without selecting a pathway
- **Test Code:** [TC005_First_login_wizard_cannot_proceed_without_selecting_a_pathway.py](./TC005_First_login_wizard_cannot_proceed_without_selecting_a_pathway.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Application build error overlay displayed with message: "Module not found: Can't resolve 'dns'".
- Login and post-login UI cannot be reached because the build error prevents the application from rendering.
- Wizard UI (pathway selection and confirm controls) is not present and therefore cannot be tested.
- Required interactive elements for verifying enforcement of exactly one pathway are not available due to the build error.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/1c300ccf-067c-46f7-98db-66012772320e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 First-login wizard: attempt to visit public courses is blocked until pathway is chosen
- **Test Code:** [TC006_First_login_wizard_attempt_to_visit_public_courses_is_blocked_until_pathway_is_chosen.py](./TC006_First_login_wizard_attempt_to_visit_public_courses_is_blocked_until_pathway_is_chosen.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Next.js dev overlay shows build error: "Module not found: Can't resolve 'dns'", preventing the application from rendering.
- Login page UI did not render: username/email and password input fields and the 'Sign in' button are not present or accessible due to the build error overlay.
- Unable to navigate to /courses to verify the PATHWAY_REQUIRED message or a 403 response because the application is not running correctly (build error blocks access to routes).
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/efc50279-80b6-4300-b89c-435aa02f242b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Locked pathway: change attempt is blocked and shows admin override instructions
- **Test Code:** [TC008_Locked_pathway_change_attempt_is_blocked_and_shows_admin_override_instructions.py](./TC008_Locked_pathway_change_attempt_is_blocked_and_shows_admin_override_instructions.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login page did not render: page has 0 interactive elements on /login, so the UI cannot be interacted with.
- Sign-in form not found on /login, preventing authentication from being performed.
- Dashboard could not be reached; cannot verify pathway lock behavior because the authenticated user flow cannot start.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/96ee6146-fa45-4d7a-becb-69ed1abb6b57
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Modular student sees individual EASA Modules in the public course catalog
- **Test Code:** [TC011_Modular_student_sees_individual_EASA_Modules_in_the_public_course_catalog.py](./TC011_Modular_student_sees_individual_EASA_Modules_in_the_public_course_catalog.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Application build failed with error 'Module not found: Can't resolve \'dns\'' displayed on the page.
- Login page UI not rendered; email/username and password input fields and 'Sign in' button are not available.
- Courses catalog (/courses) cannot be reached because the application failed to build and render the site.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/52da1f3b-db87-4bf5-bfea-c74d6752d962
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Modular student can open a module detail and see tuition and exam options
- **Test Code:** [TC012_Modular_student_can_open_a_module_detail_and_see_tuition_and_exam_options.py](./TC012_Modular_student_can_open_a_module_detail_and_see_tuition_and_exam_options.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Build overlay displayed with error "Module not found: Can't resolve 'dns'", preventing the application UI from rendering.
- Login page does not contain a usable login form or input fields; only the Next.js dev/error overlay is interactive.
- Unable to perform authentication or navigate to the student dashboard (/student), so the 'Courses' and 'Module 1' flows cannot be verified.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/766b7aff-257d-41ea-a3b6-c43486d1e032
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Full-Time student does not see individual EASA modules in the course catalog
- **Test Code:** [TC013_Full_Time_student_does_not_see_individual_EASA_modules_in_the_course_catalog.py](./TC013_Full_Time_student_does_not_see_individual_EASA_modules_in_the_course_catalog.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login page at /login contains no interactive elements (email, password, or 'Sign in' button) and thus cannot be completed
- SPA did not render content on the page; page appears blank after navigation to /login
- Email/username input field not found on the page
- Password input field not found on the page
- 'Sign in' button not found on the page
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/d36f2fc9-7a7a-4a18-8698-e93f09088e05
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Full-Time student is blocked when attempting to access an individual module purchase
- **Test Code:** [TC014_Full_Time_student_is_blocked_when_attempting_to_access_an_individual_module_purchase.py](./TC014_Full_Time_student_is_blocked_when_attempting_to_access_an_individual_module_purchase.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Next.js dev overlay displays a build error: "Module not found: Can't resolve 'dns'" (build error visible in screenshot/DOM).
- Application did not render interactive UI (login/dashboard) and shows the build error overlay instead, preventing test interactions.
- Cannot perform login, navigate to Courses, open Module 1, or verify 'Not available for your pathway' / 'PATHWAY_NOT_ELIGIBLE' because the application failed to build.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/f442803b-ce63-40e7-8ca4-493578523b95
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Exam-Only student sees Exam-Only versions of modules in the catalog
- **Test Code:** [TC015_Exam_Only_student_sees_Exam_Only_versions_of_modules_in_the_catalog.py](./TC015_Exam_Only_student_sees_Exam_Only_versions_of_modules_in_the_catalog.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Application build failed: Next.js dev overlay shows "Module not found: Can't resolve 'dns'", preventing the app from rendering.
- After login actions, the page DOM is empty (0 interactive elements) and the build error overlay is displayed instead of the dashboard.
- Navigation to the student dashboard (/student) could not be verified because the application failed to render after sign-in.
- The Courses catalog and visibility of 'Exam-Only' cannot be verified due to the application build failure.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/c0413b1f-8554-432a-8bfe-ae47b8edf7bb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Exam-Only student can open a module but is restricted to exam booking only
- **Test Code:** [TC016_Exam_Only_student_can_open_a_module_but_is_restricted_to_exam_booking_only.py](./TC016_Exam_Only_student_can_open_a_module_but_is_restricted_to_exam_booking_only.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login page did not render: Next.js build error 'Module not found: Can\'t resolve \'dns\'' is displayed in the dev overlay.
- Required UI elements (login form, navigation, course list) are not present, so the test steps cannot be executed.
- Verification of 'Book Exam' visibility and absence of 'Tuition' cannot be performed because the application UI is unavailable.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/d32cb2b4-9c39-4747-a841-7eaaeff9cc2e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Exam-Only student is denied access when attempting to open study materials
- **Test Code:** [TC017_Exam_Only_student_is_denied_access_when_attempting_to_open_study_materials.py](./TC017_Exam_Only_student_is_denied_access_when_attempting_to_open_study_materials.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Build error overlay 'Module not found: Can't resolve 'dns'' is present on the /login page, preventing the application from rendering the login form or navigation elements.
- Login and course pages could not be accessed because the application failed to build; the interactive elements required for the test are not available.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/6d3a77bb-6ef2-4d6f-ba62-66656601b918
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Student submits a wallet top-up request and sees it marked as Pending
- **Test Code:** [TC018_Student_submits_a_wallet_top_up_request_and_sees_it_marked_as_Pending.py](./TC018_Student_submits_a_wallet_top_up_request_and_sees_it_marked_as_Pending.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Application failed to load: Next.js overlay displays "Module not found: Can't resolve 'dns'".
- Login and dashboard pages are not reachable because the app shows a build error overlay instead of the application UI.
- No interactive elements for dashboard actions (Wallet, Top Up Wallet) are available due to the build error overlay.
- Unable to verify 'Top Up Wallet' functionality because the application did not render after sign-in.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/ac8de2b3-34d4-4717-8b34-8757224477ab
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020 Student sees Pending top-up after submitting valid amount (without relying on file upload)
- **Test Code:** [TC020_Student_sees_Pending_top_up_after_submitting_valid_amount_without_relying_on_file_upload.py](./TC020_Student_sees_Pending_top_up_after_submitting_valid_amount_without_relying_on_file_upload.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Application build overlay displayed with error: "Module not found: Can't resolve 'dns'" preventing access to the app UI.
- Login/post-login UI cannot be reached because the Next.js dev overlay blocks rendering.
- Interactive elements required for the top-up flow (Wallet, Top Up, amount input) are not present due to the build error.
- The automated test could not verify a Pending top-up state because the top-up flow is inaccessible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1ab7552b-e83e-44b4-80b9-21b072693dc8/46544925-923e-47b0-b8b9-eb4d4b696ed6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---