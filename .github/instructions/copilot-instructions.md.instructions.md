---

description: Project-wide instructions for the hrampokrova website
applyTo: "**"
-------------

# hrampokrova project instructions

## Project context

This repository contains the official website of the Pokrova Church in Cherkasy, Ukraine.

Production website:

* https://hrampokrova.pp.ua/

GitHub repository:

* Khram-Pokrovy-Cherkasy/hrampokrova

The website is primarily a static HTML/CSS/JavaScript website hosted through GitHub Pages.

The primary content language is Ukrainian.

Main technical areas:

* HTML
* CSS
* JavaScript
* SEO
* Schema.org / JSON-LD structured data
* Open Graph / social metadata
* canonical URLs
* sitemap.xml
* robots.txt
* accessibility
* image metadata and alt text
* Git/GitHub

## General rules

1. Before modifying anything, inspect the existing implementation and understand the surrounding code.
2. Do not make assumptions about facts concerning the church, parish, clergy, address, contacts, services, dates, events, or other real-world information.
3. Never invent factual information.
4. Preserve the existing Ukrainian language and terminology unless explicitly asked to change it.
5. Prefer small, targeted changes over large rewrites.
6. Do not rewrite or reformat unrelated parts of files.
7. Preserve existing functionality unless the requested task explicitly requires changing it.
8. When uncertain, explain the uncertainty and ask before making a consequential change.
9. Verify proposed changes against the actual files in the repository rather than relying on previous AI responses or assumptions.

## SEO rules

When working on SEO:

1. Inspect the complete relevant `<head>` before making changes.
2. Preserve valid existing metadata.
3. Check:

   * `<title>`
   * meta description
   * canonical URL
   * robots directives
   * Open Graph metadata
   * Twitter/X metadata
   * language declaration
   * viewport
   * favicon and manifest references
4. Do not add duplicate meta tags.
5. Do not create conflicting canonical URLs.
6. Do not change production URLs without explicit approval.
7. Do not add `noindex` or `nofollow` to an indexable page without explicit justification.
8. When changing sitemap.xml or robots.txt, consider the complete site structure and GitHub Pages deployment.
9. Prefer technically correct current SEO practices over outdated SEO folklore.

## Schema.org / JSON-LD rules

Schema.org is an important part of this project.

Before modifying structured data:

1. Inspect all existing JSON-LD blocks on the relevant page.
2. Determine which Schema.org types are already being used.
3. Check for duplicate or conflicting entities.
4. Preserve valid structured data unless there is a reason to change it.
5. Use only factual information present in the project or explicitly provided by the user.
6. Do not invent reviews, ratings, opening hours, events, coordinates, contact details, social profiles, images, or other structured-data properties.
7. Keep URLs consistent with the production domain.
8. Use valid JSON-LD syntax.
9. When possible, validate the resulting JSON-LD after editing.
10. Consider Google's structured-data requirements separately from generic Schema.org validity.

When working with events, services, opening hours, reviews, ratings, or other potentially time-sensitive data, verify the current source content before changing the markup.

## HTML rules

1. Preserve valid semantic HTML.
2. Keep Ukrainian text unchanged unless the task explicitly concerns content editing.
3. Maintain accessibility:

   * meaningful `alt` text
   * appropriate heading hierarchy
   * descriptive link text
   * semantic elements where appropriate
4. Do not add redundant ARIA attributes when native HTML semantics are sufficient.
5. Preserve existing responsive behavior.
6. Avoid unnecessary inline styles or scripts.
7. Do not introduce external dependencies without explicit approval.

## Images

When modifying image references:

1. Verify that the referenced file actually exists.
2. Do not invent filenames.
3. Preserve meaningful Ukrainian `alt` text.
4. Do not use keyword stuffing in alt attributes.
5. Consider loading behavior (`lazy`, `eager`) according to the image's role.
6. Do not replace existing images unless explicitly requested.

## Git rules

Git operations must be conservative.

Allowed without additional confirmation:

* `git status`
* `git diff`
* `git log`
* `git show`
* read-only Git inspection

Do NOT perform these actions without explicit user approval:

* `git commit`
* `git push`
* `git reset`
* `git rebase`
* `git merge`
* deleting branches
* changing remotes
* rewriting history
* force pushing

Never use `git push --force` unless the user explicitly requests it and the consequences have been explained.

Before suggesting a commit:

1. Inspect `git diff`.
2. Check `git status`.
3. Summarize exactly what changed.
4. Identify unrelated changes, if any.

Never modify Git configuration, remotes, authentication, SSH configuration, or GitHub account settings unless explicitly asked.

## GitHub Pages / production rules

The production domain is:

https://hrampokrova.pp.ua/

Treat the following as production-critical:

* `CNAME`
* canonical URLs
* sitemap.xml
* robots.txt
* public HTML pages
* image paths
* GitHub Pages configuration

Do not change the production domain, CNAME, repository remote, or deployment configuration without explicit approval.

## Validation workflow

After making changes, prefer this sequence:

1. Inspect the modified file.
2. Run `git diff`.
3. Validate syntax where applicable.
4. For HTML/SEO changes, inspect the resulting `<head>` and relevant markup.
5. For JSON-LD changes, validate JSON syntax and structured-data structure.
6. For sitemap/robots changes, verify URLs and directives.
7. If a local server is available, test the affected page locally.
8. Do not commit or push automatically.

## Agent behavior

When asked to analyze or audit:

* Start in read-only mode.
* Do not modify files unless modification is explicitly requested.
* Report findings with severity and evidence.
* Distinguish confirmed problems from recommendations.
* Do not treat another AI's audit as authoritative; verify findings against the current repository.

When asked to implement a change:

* First identify the files that need modification.
* Make the smallest appropriate change.
* Do not modify unrelated files.
* Show or summarize the resulting changes.
* Run appropriate validation.
* Leave Git commit/push to the user unless explicitly instructed otherwise.

## Safety rule

The agent is an assistant, not the final authority over production changes.

For potentially destructive, irreversible, security-sensitive, deployment-related, or externally visible operations, stop and ask for confirmation before proceeding.
