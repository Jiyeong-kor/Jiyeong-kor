#!/usr/bin/env python3
"""Render a 26-week GitHub activity SVG from GitHub GraphQL contribution data.

Requires a GitHub Actions GITHUB_TOKEN; no fabricated or cached activity values.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

API_URL = "https://api.github.com/graphql"
LOGIN = "Jiyeong-kor"
PINK = "#FF69B4"
DARK = "#96436F"
SOFT = "#F8BBD0"
BG = "#FFF7FB"

QUERY = """query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays { date contributionCount }
        }
      }
    }
  }
}"""


def load_calendar(token: str) -> list[dict]:
    payload = json.dumps({"query": QUERY, "variables": {"login": LOGIN}}).encode()
    req = Request(API_URL, payload, {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "Jiyeong-kor-profile-activity-generator",
    }, method="POST")
    try:
        with urlopen(req, timeout=25) as resp:
            result = json.load(resp)
    except HTTPError as exc:
        raise RuntimeError(f"GitHub GraphQL 요청 실패: HTTP {exc.code}") from exc
    if result.get("errors"):
        raise RuntimeError(f"GitHub GraphQL 오류: {result['errors']}")
    user = (result.get("data") or {}).get("user")
    if not user:
        raise RuntimeError("GitHub 계정의 기여 달력을 읽지 못했습니다.")
    weeks = user["contributionsCollection"]["contributionCalendar"]["weeks"]
    if len(weeks) < 26:
        raise RuntimeError(f"지난 26주 기여 자료가 부족합니다: {len(weeks)}주")
    return weeks[-26:]


def render_activity(weeks: list[dict]) -> str:
    values = [sum(int(d["contributionCount"]) for d in w["contributionDays"]) for w in weeks]
    if len(values) != 26 or any(v < 0 for v in values):
        raise ValueError("GitHub 기여 데이터는 26개의 음이 아닌 주간 합계여야 합니다.")
    width, height = 920, 298
    left, right, top, bottom = 69, 34, 100, 55
    area_w, area_h = width - left - right, height - top - bottom
    y_cap = max(4, max(values))
    x = lambda i: left + (area_w * i / (len(values) - 1))
    y = lambda v: top + area_h - (area_h * v / y_cap)
    coords = [(x(i), y(v)) for i, v in enumerate(values)]
    line = " ".join(("M" if i == 0 else "L") + f"{px:.1f},{py:.1f}" for i, (px, py) in enumerate(coords))
    area = line + f" L {coords[-1][0]:.1f},{top+area_h:.1f} L {coords[0][0]:.1f},{top+area_h:.1f} Z"
    grid = "".join(
        f'<line x1="{left}" y1="{y(y_cap*k/4):.1f}" x2="{width-right}" y2="{y(y_cap*k/4):.1f}" stroke="#F5D1E2" stroke-width="1"/>'
        f'<text x="{left-11}" y="{y(y_cap*k/4)+4:.1f}" text-anchor="end" fill="#A97391" font-size="12">{y_cap*k/4:g}</text>'
        for k in range(5)
    )
    dots = "".join(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="3.5" fill="{PINK}" stroke="white" stroke-width="1.4"/>' for px, py in coords)
    labels = "".join(
        f'<text x="{x(i):.1f}" y="{height-26}" text-anchor="middle" font-size="12" fill="#A97391">{escape(weeks[i]["contributionDays"][0]["date"][5:7])}/{escape(weeks[i]["contributionDays"][0]["date"][8:10])}</text>'
        for i in range(0, 26, 5) if weeks[i].get("contributionDays")
    )
    total = sum(values)
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="GitHub 주간 기여 횟수, 지난 26주 총 {total}회">
  <title>GitHub Activity · 최근 26주</title>
  <desc>GitHub GraphQL API에서 가져온 실제 날짜별 기여 횟수를 주간으로 합산했습니다. {generated} 기준</desc>
  <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop stop-color="{SOFT}" stop-opacity=".82"/><stop offset="1" stop-color="{BG}" stop-opacity=".16"/></linearGradient></defs>
  <rect x="1" y="1" width="{width-2}" height="{height-2}" rx="24" fill="{BG}" stroke="{SOFT}" stroke-width="2"/>
  <g font-family="Pretendard, Noto Sans, sans-serif">
    <text x="37" y="47" fill="{DARK}" font-size="22" font-weight="800">Contribution Activity</text>
    <text x="38" y="72" fill="#B47197" font-size="13">Actual GitHub contributions · Last 26 weeks · {total} total</text>
    {grid}
    <path d="{area}" fill="url(#area)"/>
    <path d="{line}" fill="none" stroke="{PINK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    {dots}
    {labels}
  </g>
</svg>'''


def main() -> None:
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise SystemExit("GITHUB_TOKEN이 없어 실제 기여 자료를 가져올 수 없습니다.")
    svg = render_activity(load_calendar(token))
    path = Path("dist/activity.svg")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(svg, encoding="utf-8")
    print(f"생성 완료: {path}")


if __name__ == "__main__":
    main()
