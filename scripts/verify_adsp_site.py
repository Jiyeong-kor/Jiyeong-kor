#!/usr/bin/env python3
"""GitHub Pages의 ADsP 배포 자산을 검증합니다."""

from __future__ import annotations

import base64
import gzip
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
PAYLOAD_DIR = DOCS / "adsp" / "payload"


def fail(message: str) -> None:
    print(f"[실패] {message}", file=sys.stderr)
    raise SystemExit(1)


def load_app_html() -> str:
    parts = sorted(PAYLOAD_DIR.glob("part-*.gz.b64"))
    if not parts:
        fail("배포 payload 파일이 없습니다.")

    encoded = "".join(part.read_text(encoding="utf-8") for part in parts)
    encoded = re.sub(r"\s+", "", encoded)

    try:
        compressed = base64.b64decode(encoded, validate=True)
        return gzip.decompress(compressed).decode("utf-8")
    except Exception as error:
        fail(f"payload 결합 또는 압축 해제에 실패했습니다: {error}")


def verify_structure() -> None:
    required = [
        DOCS / "index.html",
        DOCS / "sw.js",
        DOCS / "adsp" / "manifest.webmanifest",
        ROOT / "apps" / "adsp-study" / "README.md",
    ]
    missing = [str(path.relative_to(ROOT)) for path in required if not path.exists()]
    if missing:
        fail("필수 파일이 없습니다: " + ", ".join(missing))

    forbidden_old_paths = [
        DOCS / "parts",
        DOCS / "responsive.css",
        DOCS / "manifest.webmanifest",
    ]
    remaining = [str(path.relative_to(ROOT)) for path in forbidden_old_paths if path.exists()]
    if remaining:
        fail("이전 배포 파일이 남아 있습니다: " + ", ".join(remaining))


def verify_no_result_files() -> None:
    result_files = [
        path for path in ROOT.rglob("*.json")
        if "학습결과" in path.name or "learning-result" in path.name.lower()
    ]
    if result_files:
        fail(
            "개인 결과 JSON을 저장소에 커밋할 수 없습니다: "
            + ", ".join(str(path.relative_to(ROOT)) for path in result_files)
        )


def verify_app(html: str) -> None:
    required_fragments = [
        "2026.07.26-v4-responsive-adaptive",
        "통계 추론 연결 고리 다시 고정",
        "@media (min-width: 1024px)",
        ".theory > *",
        "max-width: none",
        "const QUESTIONS = ",
        "const MODULES = ",
    ]
    for fragment in required_fragments:
        if fragment not in html:
            fail(f"학습 HTML에서 필수 항목을 찾지 못했습니다: {fragment}")

    forbidden_fragments = [
        "현재 자신감",
        "state.confidence",
        "confidence: state.",
        "ADsP_학습결과_2026-",
        '"sourceResultFile":"ADsP_',
    ]
    for fragment in forbidden_fragments:
        if fragment in html:
            fail(f"학습 HTML에 제거 대상 정보가 남아 있습니다: {fragment}")

    questions_match = re.search(r"const QUESTIONS = (.*?);\n", html, re.S)
    modules_match = re.search(r"const MODULES = (.*?);\n", html, re.S)
    if not questions_match or not modules_match:
        fail("문항 또는 모듈 데이터를 읽지 못했습니다.")

    questions = json.loads(questions_match.group(1))
    modules = json.loads(modules_match.group(1))
    module_ids = {module["id"] for module in modules}

    if len(questions) != 73:
        fail(f"예상 문항 수는 73개이지만 {len(questions)}개입니다.")
    if [module["id"] for module in modules] != [
        "STATFIX", "S3E", "S3F", "S3G", "S3H", "S3I", "S3J", "S3K", "S3L"
    ]:
        fail("모듈 순서가 예상과 다릅니다.")
    if any(question["moduleId"] not in module_ids for question in questions):
        fail("존재하지 않는 모듈을 참조하는 문항이 있습니다.")


def main() -> None:
    verify_structure()
    verify_no_result_files()
    html = load_app_html()
    verify_app(html)

    digest = hashlib.sha256(html.encode("utf-8")).hexdigest()
    print("[성공] ADsP 배포 자산 검증 완료")
    print(f"[정보] HTML SHA-256: {digest}")
    print(f"[정보] payload 조각 수: {len(list(PAYLOAD_DIR.glob('part-*.gz.b64')))}")


if __name__ == "__main__":
    main()
