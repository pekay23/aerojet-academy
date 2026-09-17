# Skill Update

Update an existing skill or create a new one based on a bug, fix, or lesson learned.

## Usage

```bash
/skill-update <skill-name> "<lesson or fix description>"
```

## Workflow

1. **Identify the skill**
   - If the skill exists, read its `SKILL.md` first.
   - If it does not exist, decide whether to create it or extend an existing one.

2. **Classify the lesson**
   - **Anti-pattern / bug fix** → add a `MUST NOT` or `NEVER` rule under the relevant section.
   - **Preferred pattern** → add a `MUST` or `SHOULD` rule.
   - **Workflow / process** → add a new section with numbered steps.

3. **Draft the rule**
   - Keep it one sentence.
   - Include the exact file path or pattern if relevant.
   - Explain *why* in one short sentence after the rule if it is not obvious.

4. **Apply the edit**
   - Use the `edit` tool to modify the skill file.
   - Do not rewrite the whole file; make the smallest possible change.

5. **Verify**
   - Re-read the modified section to ensure it reads naturally.
   - Confirm no existing rules contradict the new one.

## Example

**Input:** `/skill-update baseline-ui "relative + fixed breaks positioning in Tailwind v4"`

**Action:** Add to `Layout` section:
```markdown
- NEVER combine `relative` with `fixed` on the same element. In Tailwind CSS v4, `relative` sets `position: relative` which overrides `position: fixed`, causing the element to scroll with the page instead of staying pinned. If you need a fixed element that also serves as a positioning context for absolutely-positioned children, use `fixed` alone and wrap the children in a separate `relative` container.
```
