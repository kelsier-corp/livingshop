#!/usr/bin/env bash
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
case "$branch" in
  main|develop)
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"deny\",\"permissionDecisionReason\":\"Blocked: current branch is '$branch'. Create a feature branch first (git checkout -b feature/<slug> from develop) before editing - see CLAUDE.md's Branching section.\"}}"
    ;;
esac
