Maintain the CHANGELOG.md in the project root. Follow these steps exactly:

## Step 1 — Read the current state

Run `git log --format="%ad %H %s" --date=short` to get all commits with their date, hash, and subject.

Check whether CHANGELOG.md exists by attempting to read it.

## Step 2 — Determine what is missing

If CHANGELOG.md does not exist, every commit from the git log needs to be included.

If CHANGELOG.md exists, find the most recent date heading already present (format `## YYYY-MM-DD`). Only include commits whose date is strictly newer than that heading OR commits on that same date whose subject line does not already appear as a bullet under that heading. Do not duplicate entries.

## Step 3 — Build the new entries

Group the missing commits by date (YYYY-MM-DD). Within each date group, list each commit as a bullet using its subject line verbatim:

```
## YYYY-MM-DD
- <commit subject>
- <commit subject>
```

Order dates descending (newest first). Within a date, preserve git log order (most recent first).

Strip any merge commits (subjects starting with "Merge branch" or "Merge pull request") — do not include them.

## Step 4 — Write CHANGELOG.md

If CHANGELOG.md does not exist, write the full file:

```markdown
# Changelog

## YYYY-MM-DD
- ...

## YYYY-MM-DD
- ...
```

If CHANGELOG.md already exists, insert the new date sections immediately after the `# Changelog` heading line (before any existing `##` sections). If the most recent existing heading matches today's date, merge the new bullets into that section rather than creating a duplicate heading.

Preserve everything else in the file exactly as-is.

## Step 5 — Confirm

After writing, report:
- How many new entries were added
- The date range covered
- Whether the file was created or updated
