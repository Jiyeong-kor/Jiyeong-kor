#!/usr/bin/env python3
"""Export SVG artwork as PNG using locally installed Pretendard fonts."""

from pathlib import Path
import subprocess
import cairosvg

ROOT = Path(__file__).resolve().parent.parent
ARTWORK = ROOT / "assets/profile/pink"
OUTPUT = ROOT / "dist"


def main() -> None:
    font = subprocess.check_output(
        ["fc-match", "-f", "%{family}\n", "Pretendard"], text=True
    ).strip()
    if "Pretendard" not in font:
        raise RuntimeError(f"Pretendard 폰트를 찾지 못했습니다: {font}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source = ARTWORK / "about.svg"
    dest = OUTPUT / "about-purple.png"
    if not source.exists():
        raise FileNotFoundError(source)
    cairosvg.svg2png(url=str(source), write_to=str(dest), scale=2)
    if dest.stat().st_size < 1000:
        raise RuntimeError(f"생성된 PNG 파일 크기가 비정상적입니다: {dest}")
    print(f"Pretendard PNG 생성: {dest} ({dest.stat().st_size} bytes)")



if __name__ == "__main__":
    main()
