from __future__ import annotations

from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent
DOCS = ROOT / "docs"
SKIP = {"README.md"}


def main() -> int:
    DOCS.mkdir(exist_ok=True)

    for path in DOCS.glob("*.md"):
        path.unlink()

    for source in ROOT.glob("*.md"):
        if source.name in SKIP:
            continue
        shutil.copy2(source, DOCS / source.name)

    gitkeep = DOCS / ".gitkeep"
    if not gitkeep.exists():
        gitkeep.write_text("", encoding="utf-8")

    print("sync-complete")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
