#!/usr/bin/env python3
"""Run the shared stock tool without loading a sibling Windows wheel bundle."""

from pathlib import Path
import os
import runpy
import sys


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: portable-stock-runner.py <tool_runner.py> [args...]")

    tool_runner = Path(sys.argv[1]).resolve()
    windows_vendor = tool_runner.parent.parent / "deep-analysis" / "site-packages"
    original_is_dir = Path.is_dir
    windows_vendor_path = os.path.normcase(os.path.abspath(windows_vendor))
    has_windows_wheels = sys.platform != "win32" and next(windows_vendor.rglob("*.pyd"), None) is not None

    def portable_is_dir(path: Path) -> bool:
        if has_windows_wheels and os.path.normcase(os.path.abspath(path)) == windows_vendor_path:
            return False
        return original_is_dir(path)

    Path.is_dir = portable_is_dir
    try:
        sys.argv = [str(tool_runner), *sys.argv[2:]]
        runpy.run_path(str(tool_runner), run_name="__main__")
    finally:
        Path.is_dir = original_is_dir


if __name__ == "__main__":
    main()
