#!/usr/bin/env bash
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$branch" ]; then
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"deny\",\"permissionDecisionReason\":\"Blocked: could not determine the current git branch, so this fails closed. Check that git is on PATH and this is a git repository before editing - see CLAUDE.md's Branching section.\"}}"
  exit 0
fi

case "$branch" in
  main|develop)
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"deny\",\"permissionDecisionReason\":\"Blocked: current branch is '$branch'. Create a feature branch first (git checkout -b feature/<issue-number>-<slug> from develop) before editing - see CLAUDE.md's Branching section.\"}}"
    ;;
esac
