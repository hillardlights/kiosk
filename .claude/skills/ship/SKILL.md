---
name: ship
description: Deploy local Hillard Lights kiosk changes to the Raspberry Pi via deploy/ship.sh. Use whenever the user asks to "ship", "deploy the kiosk", "push to the pi", "send this to the pi", or runs `/ship`. Wraps the ship script with commit-message inference, git push, remote build, and Chromium restart so the whole flow runs from one invocation.
---

# Ship kiosk changes to the Pi

You are running deploy/ship.sh on the user's behalf. The user's goal: any code change on their Windows box shows up on their kiosk in about 15 seconds with zero manual git or SSH commands. They should never have to remember the ship.sh syntax again.

## Preconditions

- Repo lives at `D:\repo\kiosk`
- Origin is `github.com/hillardlights/kiosk` (already configured)
- Pi hostname defaults to `hillard-kiosk.local`; if the user has a different hostname/user, they've set it in `D:\repo\kiosk\.env.ship` (gitignored) and ship.sh reads it automatically

## Steps

### 1. Verify state — run these in parallel

- `git -C D:\repo\kiosk status --short`
- `git -C D:\repo\kiosk log --oneline origin/main..HEAD`
- `git -C D:\repo\kiosk diff --stat`

Based on the results:

- **Nothing dirty AND nothing unpushed** → tell the user "nothing to ship" and stop. Don't run ship.sh with no work to do.
- **Only unpushed commits, working tree clean** → skip commit step; use `--no-commit` when calling ship.sh.
- **Dirty working tree** → need a commit message (see step 2).

### 2. Decide on the commit message

- If the user passed skill arguments (`/ship "adjusted the fog opacity"`), use that verbatim.
- Otherwise, read the actual diff with `git -C D:\repo\kiosk diff` and draft a concise one-line message (≤72 chars) that describes what actually changed. Prefer imperative mood ("Tighten queue spacing", not "Tightened queue spacing"). Include a **Why:** line if the change is non-obvious.
- Show the drafted message and a summary of what will be committed (from `git diff --stat`) with a single AskUserQuestion. Options: "Ship it", "Change the message", "Cancel". Default to "Ship it".

### 3. Run ship.sh — always with -r

Chromium restart is not optional. The whole point of this skill is zero manual steps.

For a fresh commit:
```
bash D:\repo\kiosk\deploy\ship.sh -r "<message>"
```

For pre-committed changes:
```
bash D:\repo\kiosk\deploy\ship.sh -r --no-commit
```

Timeout: 180 seconds (SSH + Pi build can be slow on first run of the day).

Do NOT interpolate a user-supplied commit message that contains double quotes without escaping. Prefer heredoc if the message is complex, or just ask the user to simplify.

### 4. Report success

Parse ship.sh's output for these markers to confirm each stage landed:

- `Pushing to origin` → git push worked
- `Pulling on <user>@<host>` → SSH connection established
- `Deploying built assets` → Pi rebuilt the app
- `Restarting Chromium` (only appears with -r) → kiosk will reload

Give the user a two-line report: what was deployed (commit SHA + subject) and a note that the kiosk should show the change in ~5 seconds. Do not dump the full ship.sh output unless the user asks.

### 5. Failure handling

Watch for these patterns and act:

- **`! [rejected]` / `Updates were rejected`** — local branch is behind. Run `git -C D:\repo\kiosk fetch origin` and then `git -C D:\repo\kiosk pull --rebase origin main`. If that succeeds, retry ship.sh. If there are merge conflicts, stop and ask the user to resolve them.
- **`ssh: Could not resolve hostname`** — Pi is unreachable. Ask the user to check the Pi is powered on and on the network. Suggest `ping hillard-kiosk.local` from a Windows terminal.
- **`Permission denied (publickey,password)`** — SSH auth failed. Tell the user to run `ssh-copy-id pi@hillard-kiosk.local` from Git Bash once, or (if that's not available) walk them through appending their `~/.ssh/id_ed25519.pub` to `/home/pi/.ssh/authorized_keys` on the Pi.
- **`npm run build` fails on the Pi** — the last commit broke something. Dump the last 30-40 lines of ship.sh output, identify the TypeScript / bundling error, and offer to fix it. Then re-ship.
- **`sudo: a password is required`** — the `pi` user needs passwordless sudo (usually default on Pi OS Lite, so this is unlikely). Guide the user to create `/etc/sudoers.d/010_pi-nopasswd` with `pi ALL=(ALL) NOPASSWD:ALL`.

## Never

- Never invent a commit message that misrepresents the diff. When in doubt, ask.
- Never force-push. If push is rejected, always rebase (never `--force`), and confirm with the user before rebasing if history looks complex.
- Never skip the `-r` flag. Users expect the kiosk to reload automatically.
- Never dump the entire ship.sh output on success — noisy. Only surface it on failure or when the user explicitly asks for verbose mode.
- Never commit files you didn't intend to (like a stray `.env` if one somehow got tracked). Check the file list from `git status --short` before committing.
