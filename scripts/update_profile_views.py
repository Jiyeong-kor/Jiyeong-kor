"""한국 날짜별 프로필 조회 배지를 갱신합니다."""

from datetime import datetime
from html import escape
from pathlib import Path
from urllib.parse import quote, urlencode
from zoneinfo import ZoneInfo


KST = ZoneInfo("Asia/Seoul")
START = "    <!-- profile-views-today:start -->"
END = "    <!-- profile-views-today:end -->"
README = Path(__file__).resolve().parents[1] / "README.md"


def update_badge(readme: str, now: datetime) -> str:
    if now.tzinfo is None:
        raise ValueError("시간대가 지정된 날짜와 시간이 필요합니다.")
    if readme.count(START) != 1 or readme.count(END) != 1:
        raise ValueError("오늘 조회수 배지의 시작과 끝 표시가 각각 하나씩 필요합니다.")

    before, remainder = readme.split(START, 1)
    current, after = remainder.split(END, 1)
    day = now.astimezone(KST).date()
    query = urlencode(
        {
            "username": f"Jiyeong-kor-daily-{day:%Y%m%d}",
            "label": "Profile views today",
            "color": "cc9ce3",
            "style": "for-the-badge",
        },
        quote_via=quote,
    )
    url = escape(f"https://komarev.com/ghpvc/?{query}", quote=True)
    replacement = (
        f'\n    <img src="{url}" alt="오늘 프로필 조회수" '
        f'title="한국 시간 {day.isoformat()}의 프로필 조회수" />\n'
    )
    if current == replacement:
        return readme
    return before + START + replacement + END + after


if __name__ == "__main__":
    original = README.read_text(encoding="utf-8")
    updated = update_badge(original, datetime.now(KST))
    if updated != original:
        README.write_text(updated, encoding="utf-8")
        print("오늘 날짜의 프로필 조회 배지로 갱신했습니다.")
    else:
        print("이미 오늘 날짜의 배지입니다. 변경하지 않습니다.")
