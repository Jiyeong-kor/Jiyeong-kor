#!/usr/bin/env python3
"""GitHub Pages의 ADsP payload·학습 규칙·문항 분포를 검증합니다."""

from __future__ import annotations

import base64
import gzip
import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
LOADER = DOCS / "index.html"
PAYLOAD_DIR = DOCS / "adsp" / "payload"
RULES = ROOT / "apps" / "adsp-study" / "LEARNING_CONTENT_RULES.md"

EXPECTED_VERSION = "2026.07.27-v5-foundation-first"
EXPECTED_MODULES = [
    "FOUND",
    "TEST",
    "REG",
    "MULTI",
    "TS",
    "EVAL",
    "CLASS",
    "CLUSTER",
    "ASSOC",
    "MIXED",
]
EXPECTED_PARTS = [
    "part-01.gz.b64",
    "part-02.gz.b64",
    "part-03.gz.b64",
    "part-04a.gz.b64",
    "part-04b.gz.b64",
    "part-05a.gz.b64",
    "part-05b.gz.b64",
    "part-06a.gz.b64",
    "part-06b.gz.b64",
    "part-07a.gz.b64",
    "part-07b.gz.b64",
    "part-08a.gz.b64",
    "part-08b.gz.b64",
    "part-09a.gz.b64",
    "part-09b.gz.b64",
    "part-10a.gz.b64",
    "part-10b.gz.b64",
    "part-11a.gz.b64",
    "part-11b.gz.b64",
]
EXPECTED_HTML_SHA256 = "94e6baaaad543018c09c99a992a5beddc334280b60061d9f7430c66a579bad91"


def fail(message: str) -> None:
    print(f"[실패] {message}", file=sys.stderr)
    raise SystemExit(1)


def extract_loader_parts() -> list[str]:
    text = LOADER.read_text(encoding="utf-8")
    match = re.search(r"const PARTS = (\[.*?\]);", text, re.S)
    if not match:
        fail("docs/index.html에서 PARTS 배열을 찾지 못했습니다.")
    try:
        urls = json.loads(match.group(1))
    except json.JSONDecodeError as error:
        fail(f"PARTS 배열을 해석하지 못했습니다: {error}")
    return [url.split("/")[-1].split("?")[0] for url in urls]


def load_payload_html() -> str:
    names = extract_loader_parts()
    if names != EXPECTED_PARTS:
        fail(f"payload 순서가 예상과 다릅니다: {names}")

    actual = sorted(path.name for path in PAYLOAD_DIR.glob("part-*.gz.b64"))
    if sorted(EXPECTED_PARTS) != actual:
        missing = sorted(set(EXPECTED_PARTS) - set(actual))
        extra = sorted(set(actual) - set(EXPECTED_PARTS))
        fail(f"payload 파일 구성이 다릅니다. missing={missing}, extra={extra}")

    encoded = re.sub(
        r"\s+",
        "",
        "".join((PAYLOAD_DIR / name).read_text(encoding="utf-8") for name in names),
    )
    try:
        compressed = base64.b64decode(encoded, validate=True)
        return gzip.decompress(compressed).decode("utf-8")
    except Exception as error:
        fail(f"payload 결합 또는 압축 해제에 실패했습니다: {error}")


def extract_json_constant(html: str, name: str, next_name: str) -> object:
    match = re.search(
        rf"const {re.escape(name)} = (.*?);\n\s*const {re.escape(next_name)}",
        html,
        re.S,
    )
    if not match:
        fail(f"{name} 데이터를 읽지 못했습니다.")
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError as error:
        fail(f"{name} JSON을 해석하지 못했습니다: {error}")


def verify_structure() -> None:
    required = [
        LOADER,
        DOCS / "sw.js",
        DOCS / "adsp" / "manifest.webmanifest",
        RULES,
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
    remaining = [
        str(path.relative_to(ROOT)) for path in forbidden_old_paths if path.exists()
    ]
    if remaining:
        fail("이전 배포 파일이 남아 있습니다: " + ", ".join(remaining))


def verify_no_private_results() -> None:
    result_files = [
        path
        for path in ROOT.rglob("*.json")
        if "학습결과" in path.name or "learning-result" in path.name.lower()
    ]
    if result_files:
        fail(
            "개인 결과 JSON을 저장소에 커밋할 수 없습니다: "
            + ", ".join(str(path.relative_to(ROOT)) for path in result_files)
        )


def verify_app(html: str) -> None:
    digest = hashlib.sha256(html.encode("utf-8")).hexdigest()
    if digest != EXPECTED_HTML_SHA256:
        fail(f"학습 HTML 해시가 다릅니다: {digest}")

    required_fragments = [
        EXPECTED_VERSION,
        "ADsP 맞춤 학습 v5",
        "Variance Inflation Factor",
        "Odds Ratio",
        "F1 Score",
        "Support Vector Machine",
        "Autocorrelation Function",
        "Partial Autocorrelation Function",
        "Self-Organizing Map",
        "Analysis of Variance",
        "@media (min-width: 1024px)",
        "grid-template-columns: repeat(3, minmax(0, 1fr))",
        "width: 100%",
    ]
    for fragment in required_fragments:
        if fragment not in html:
            fail(f"학습 HTML에서 필수 항목을 찾지 못했습니다: {fragment}")

    forbidden_fragments = [
        "현재 자신감",
        "state.confidence",
        "confidence: state.",
        'name="confidence"',
        '"confidence":',
        "ADsP_학습결과_2026-",
        '"sourceResultFile":"ADsP_',
        "오즈가 뭐야",
        "영어 약자도 설명 안해주니까",
    ]
    for fragment in forbidden_fragments:
        if fragment in html:
            fail(f"학습 HTML에 제거 대상 정보가 남아 있습니다: {fragment}")

    modules = extract_json_constant(html, "MODULES", "QUESTIONS")
    questions = extract_json_constant(html, "QUESTIONS", "ASSESSMENT")
    if not isinstance(modules, list) or not isinstance(questions, list):
        fail("모듈과 문항 데이터는 배열이어야 합니다.")

    module_ids = [module.get("id") for module in modules]
    if module_ids != EXPECTED_MODULES:
        fail(f"모듈 순서가 예상과 다릅니다: {module_ids}")
    if len(questions) != 100:
        fail(f"예상 문항 수는 100개이지만 {len(questions)}개입니다.")
    if len({question.get('id') for question in questions}) != len(questions):
        fail("중복된 문항 ID가 있습니다.")

    expected_module_set = set(EXPECTED_MODULES)
    if any(question.get("moduleId") not in expected_module_set for question in questions):
        fail("존재하지 않는 모듈을 참조하는 문항이 있습니다.")

    for question in questions:
        if len(question.get("choices", [])) != 4:
            fail(f"보기가 4개가 아닌 문항이 있습니다: {question.get('id')}")
        if question.get("answer") not in {0, 1, 2, 3}:
            fail(f"정답 위치가 잘못된 문항이 있습니다: {question.get('id')}")
        if not question.get("explanation"):
            fail(f"해설이 없는 문항이 있습니다: {question.get('id')}")

    distribution = Counter(question["answer"] for question in questions)
    expected_distribution = Counter({0: 25, 1: 25, 2: 25, 3: 25})
    if distribution != expected_distribution:
        fail(f"정답 위치가 균등하지 않습니다: {dict(distribution)}")

    answers = [question["answer"] for question in questions]
    longest_run = 1
    run = 1
    for previous, current in zip(answers, answers[1:]):
        run = run + 1 if previous == current else 1
        longest_run = max(longest_run, run)
    if longest_run > 2:
        fail(f"같은 정답 위치가 {longest_run}번 연속됩니다.")

    module_counts = Counter(question["moduleId"] for question in questions)
    if any(module_counts[module_id] == 0 for module_id in EXPECTED_MODULES):
        fail("문항이 없는 모듈이 있습니다.")


def verify_rules() -> None:
    rules = RULES.read_text(encoding="utf-8")
    required = [
        "개념을 문제보다 먼저",
        "영문 풀네임",
        "한자어의 뜻",
        "공식은 변수와 계산 과정",
        "해설은 연결 오류를 교정",
        "정답 위치를 균등",
        "자신감, 기분과 체감 난이도를 측정하지 않습니다",
        "설명되지 않은 개념을 맞히지 못한 결과는 사용자의 지식 부족으로만 판정하지 않습니다",
    ]
    for phrase in required:
        if phrase not in rules:
            fail(f"학습 콘텐츠 규칙에서 필수 원칙을 찾지 못했습니다: {phrase}")


def main() -> None:
    verify_structure()
    verify_no_private_results()
    html = load_payload_html()
    verify_app(html)
    verify_rules()

    print("[성공] ADsP 배포 자산·학습 규칙 검증 완료")
    print(f"[정보] HTML SHA-256: {EXPECTED_HTML_SHA256}")
    print(f"[정보] payload 조각 수: {len(EXPECTED_PARTS)}")
    print("[정보] 모듈 10개, 문항 100개, 정답 위치별 25개")


if __name__ == "__main__":
    main()
