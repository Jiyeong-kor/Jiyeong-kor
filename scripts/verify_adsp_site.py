#!/usr/bin/env python3
"""GitHub Pages의 ADsP v5 배포 자산과 학습 규칙을 검증합니다."""

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
PAYLOAD_DIR = DOCS / "adsp" / "payload"
RULES = ROOT / "apps" / "adsp-study" / "LEARNING_CONTENT_RULES.md"


def fail(message: str) -> None:
    print(f"[실패] {message}", file=sys.stderr)
    raise SystemExit(1)


def load_payload_html() -> str:
    parts = sorted(PAYLOAD_DIR.glob("part-*.gz.b64"))
    expected_names = [f"part-{index:02d}.gz.b64" for index in range(1, 8)]
    names = [path.name for path in parts]
    if names != expected_names:
        fail(f"payload 구성이 예상과 다릅니다: {names}")

    encoded = re.sub(
        r"\s+", "", "".join(path.read_text(encoding="utf-8") for path in parts)
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
        DOCS / "index.html",
        DOCS / "sw.js",
        DOCS / "adsp" / "manifest.webmanifest",
        RULES,
        ROOT / "apps" / "adsp-study" / "README.md",
    ]
    missing = [str(path.relative_to(ROOT)) for path in required if not path.exists()]
    if missing:
        fail("필수 파일이 없습니다: " + ", ".join(missing))

    forbidden_old_paths = [DOCS / "parts", DOCS / "responsive.css", DOCS / "manifest.webmanifest"]
    remaining = [str(path.relative_to(ROOT)) for path in forbidden_old_paths if path.exists()]
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


def verify_loader_and_cache() -> None:
    loader = (DOCS / "index.html").read_text(encoding="utf-8")
    service_worker = (DOCS / "sw.js").read_text(encoding="utf-8")
    expected_parts = [f"part-{index:02d}.gz.b64" for index in range(1, 8)]

    loader_parts = re.findall(r"\./adsp/payload/(part-\d+\.gz\.b64)", loader)
    if loader_parts != expected_parts:
        fail(f"로더의 payload 목록이 예상과 다릅니다: {loader_parts}")

    for name in expected_parts:
        if f"./adsp/payload/{name}" not in service_worker:
            fail(f"서비스 워커 캐시에 payload가 없습니다: {name}")

    old_names = ["part-02a.gz.b64", "part-02b.gz.b64"]
    for name in old_names:
        if name in loader or name in service_worker or (PAYLOAD_DIR / name).exists():
            fail(f"v4 payload 참조가 남아 있습니다: {name}")

    if "20260727-v5-concept-rebuild" not in loader:
        fail("로더 자산 버전이 v5가 아닙니다.")
    if "adsp-v5-concept-rebuild-20260727" not in service_worker:
        fail("서비스 워커 캐시 버전이 v5가 아닙니다.")


def verify_app(html: str) -> None:
    required_fragments = [
        "2026.07.27-v5-concept-rebuild",
        "ADsP 개념 재구성 v5",
        "Variance Inflation Factor",
        "Odds Ratio",
        "F1 Score",
        "Support Vector Machine",
        "Autocorrelation Function",
        "Partial Autocorrelation Function",
        "Bootstrap Aggregating",
        "Self-Organizing Map",
        "Analysis of Variance",
        "choiceNotes",
        "choiceExplanations",
        "correctChoiceDistribution",
        "@media (min-width: 1024px)",
        "grid-template-columns: repeat(3, minmax(0, 1fr))",
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

    expected_modules = ["TST", "REG", "DIM", "TIME", "EVAL", "CLASS", "CLUSTER", "ASSOC", "MOCK"]
    module_ids = [module.get("id") for module in modules]
    if module_ids != expected_modules:
        fail(f"모듈 순서가 예상과 다릅니다: {module_ids}")
    if len(questions) != 96:
        fail(f"예상 문항 수는 96개이지만 {len(questions)}개입니다.")
    if len({question.get('id') for question in questions}) != len(questions):
        fail("중복된 문항 ID가 있습니다.")
    if any(question.get("moduleId") not in set(expected_modules) for question in questions):
        fail("존재하지 않는 모듈을 참조하는 문항이 있습니다.")

    for question in questions:
        if len(question.get("choices", [])) != 4:
            fail(f"보기가 4개가 아닌 문항이 있습니다: {question.get('id')}")
        if len(question.get("choiceNotes", [])) != 4:
            fail(f"네 보기 해설이 모두 없는 문항이 있습니다: {question.get('id')}")
        answer = question.get("answer")
        if answer not in {0, 1, 2, 3}:
            fail(f"정답 위치가 잘못된 문항이 있습니다: {question.get('id')}")

    distribution = Counter(question["answer"] for question in questions)
    expected_distribution = Counter({0: 24, 1: 24, 2: 24, 3: 24})
    if distribution != expected_distribution:
        fail(f"정답 위치가 균등하지 않습니다: {dict(distribution)}")

    longest_run = run = 1
    answers = [question["answer"] for question in questions]
    for previous, current in zip(answers, answers[1:]):
        run = run + 1 if previous == current else 1
        longest_run = max(longest_run, run)
    if longest_run > 2:
        fail(f"같은 정답 위치가 {longest_run}번 연속됩니다.")

    if html.count("choiceNotes") < len(questions):
        fail("문항별 보기 해설 데이터가 충분하지 않습니다.")


def verify_rules() -> None:
    rules = RULES.read_text(encoding="utf-8")
    required = [
        "개념을 문제보다 먼저",
        "영문 풀네임",
        "한자어의 뜻",
        "공식은 변수와 계산 과정",
        "모든 보기를 해설",
        "정답 위치를 균등",
        "자신감, 기분, 체감 난이도를 측정하지 않습니다",
    ]
    for phrase in required:
        if phrase not in rules:
            fail(f"학습 콘텐츠 규칙에서 필수 원칙을 찾지 못했습니다: {phrase}")


def main() -> None:
    verify_structure()
    verify_no_private_results()
    verify_loader_and_cache()
    html = load_payload_html()
    verify_app(html)
    verify_rules()

    digest = hashlib.sha256(html.encode("utf-8")).hexdigest()
    expected_digest = "58987718c59ec1a77eaea18d0958b310637adffde95fbe5e72675151639cf95d"
    if digest != expected_digest:
        fail(f"배포 HTML 해시가 예상과 다릅니다: {digest}")

    print("[성공] ADsP v5 배포 자산·학습 규칙 검증 완료")
    print(f"[정보] HTML SHA-256: {digest}")
    print("[정보] payload 7개, 모듈 9개, 문항 96개, 정답 위치별 24개")


if __name__ == "__main__":
    main()
