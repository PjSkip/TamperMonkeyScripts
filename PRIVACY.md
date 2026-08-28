# Privacy Policy — Gmail Highway Carrier411

Last updated: August 28, 2026

This policy applies to the **Gmail Highway Carrier411** Chrome extension (Chrome Web Store item `hpejmgmlnjcfjccehkdgnjgdafmfjjao`) and the matching Tampermonkey userscript in this repository.

Contact: [prostovanka@gmail.com](mailto:prostovanka@gmail.com)

## Single purpose

The extension shows Highway and Carrier411 carrier-vetting details next to MC numbers in Gmail so a freight broker can check a carrier without leaving the inbox.

## Data the extension handles

The extension runs in your browser. It does **not** operate a developer backend that receives your Gmail, Highway, or Carrier411 data.

### Gmail (personal communications and website content)

On `mail.google.com` (and legacy `inbox.google.com`), the extension reads the **open email** only: subject, visible body text, and sender/from addresses. It does this to:

- find MC numbers (for example `MC 123456`)
- compare the sender email with Highway carrier contact emails (the Email match badge)
- draw badges and the results bar on that thread

It does not read your whole mailbox, send email contents to the developer, or upload messages to a server we control.

### Highway and Carrier411 (website content)

The extension requests carrier records from `highway.com` and `carrier411.com` **using your existing signed-in Chrome session**. You must already be logged in, and those site tabs need to stay open. Lookups use the MC (and related identifiers) found in the email. The responses are used only to paint badges (pass/fail, units, safety, insurance, FreightGuard, and similar fields you turn on in Settings).

Highway and Carrier411 are independent services. Their own privacy policies apply to your accounts with them. This extension is not made by, and is not affiliated with, Highway, Carrier411, or Google.

### Clipboard

If you click Copy on a carrier name, MC, or DOT, the extension writes that text to the clipboard. It does not read the clipboard.

### Local storage

Using Chrome `storage`, the extension saves:

- your Settings (which fields are on, field order, bar vs badges layout)
- a **same-day local cache** of lookup results so the same MC is not fetched again while you work

This data stays on your computer. Uninstalling the extension, or clearing site/extension data in Chrome, removes it. It is not synced to a server we operate.

### Personally identifiable information

The only personal identifiers the extension handles are **email addresses already present in the open Gmail message** (typically the From address, and emails in that same message). Those addresses are used only for the Email match badge against Highway contact emails. They are not collected into a developer database.

## What we do not do

- We do not sell or transfer user data to third parties for advertising, analytics products, or credit/lending decisions.
- We do not use user data for purposes unrelated to showing carrier-vetting badges in Gmail.
- We do not collect passwords. Highway and Carrier411 cookies stay in your browser session with those sites.
- We do not inject remote JavaScript. All extension code ships in the Chrome Web Store package.

## Sharing

The only network requests the extension makes (other than loading itself from Chrome) are to Highway and Carrier411 so it can display your already-authorized carrier data. No other third parties receive Gmail or carrier data from this extension.

## Changes

If data practices change, this file will be updated and the date at the top will change.
