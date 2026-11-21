#!/usr/bin/env python3
"""Validate the production team configuration: agent files, frontmatter, skills, workspace."""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EXPECTED = ["director", "researcher", "scriptwriter", "storyboard", "animator", "environment-designer",
            "audio-engineer", "video-editor", "quality-control", "youtube-specialist"]
KNOWN_FIELDS = {"name", "description", "tools", "disallowedTools", "model", "permissionMode", "maxTurns", "skills",
                "mcpServers", "hooks", "memory", "background", "effort", "isolation", "color", "initialPrompt",
                "omitClaudeMd", "autoCompactWindow", "experimental"}
KNOWN_TOOLS = {"Agent", "Read", "Write", "Edit", "Glob", "Grep", "Bash", "WebSearch", "WebFetch", "NotebookEdit", "Skill"}
COLORS = {"red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"}
DIRS = ["research", "scripts", "storyboards", "characters", "environments", "animations", "audio", "video",
        "thumbnails", "exports", "reports"]


def frontmatter(path):
    txt = open(path).read()
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", txt, re.S)
    if not m:
        return None, txt
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line and not line.startswith(" "):
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip()
    return fm, m.group(2)


def main():
    errors, warn = [], []
    for name in EXPECTED:
        p = os.path.join(ROOT, ".claude/agents", f"{name}.md")
        if not os.path.exists(p):
            errors.append(f"missing agent file {p}"); continue
        fm, body = frontmatter(p)
        if fm is None:
            errors.append(f"{name}: no YAML frontmatter"); continue
        if fm.get("name") != name:
            errors.append(f"{name}: name field is '{fm.get('name')}'")
        if len(fm.get("description", "")) < 40:
            errors.append(f"{name}: description too short")
        for k in fm:
            if k not in KNOWN_FIELDS:
                errors.append(f"{name}: unknown frontmatter field '{k}' (would be silently ignored)")
        for t in [x.strip() for x in fm.get("tools", "").split(",") if x.strip()]:
            if t not in KNOWN_TOOLS:
                warn.append(f"{name}: tool '{t}' not in known list")
        if fm.get("color") and fm["color"] not in COLORS:
            errors.append(f"{name}: bad color {fm['color']}")
        if fm.get("memory") and fm["memory"] not in {"user", "project", "local"}:
            errors.append(f"{name}: bad memory {fm['memory']}")
        if len(body.strip()) < 400:
            errors.append(f"{name}: instructions too short")
        print(f"  ok  agent {name:<21} tools: {fm.get('tools', '(inherit all)')}")
    extra = sorted(set(f[:-3] for f in os.listdir(os.path.join(ROOT, ".claude/agents")) if f.endswith(".md")) - set(EXPECTED))
    if extra:
        warn.append(f"extra agent files: {extra}")
    sk = os.path.join(ROOT, ".claude/skills")
    for d in sorted(os.listdir(sk)) if os.path.isdir(sk) else []:
        p = os.path.join(sk, d, "SKILL.md")
        if not os.path.exists(p):
            errors.append(f"skill {d}: missing SKILL.md"); continue
        fm, _ = frontmatter(p)
        if not fm or not fm.get("description"):
            errors.append(f"skill {d}: missing description")
        else:
            print(f"  ok  skill /{d}")
    for d in DIRS:
        if not os.path.isdir(os.path.join(ROOT, "production", d)):
            errors.append(f"missing production/{d}/")
    for f in ["CLAUDE.md", "production/WORKFLOW.md", "production/tools/status.py", "production/templates/handoff.md",
              "production/templates/qc-checklist.md", "production/characters/style-reference.jpg"]:
        if not os.path.exists(os.path.join(ROOT, f)):
            errors.append(f"missing {f}")
    for w in warn:
        print("  warn", w)
    for e in errors:
        print("  FAIL", e)
    print(f"\n{len(EXPECTED)} agents expected; {len(errors)} errors, {len(warn)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
