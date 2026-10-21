#!/usr/bin/env python3
"""Render profile copy with Pretendard for GitHub's CSS-restricted README."""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SCALE = 3
INK = '#39313F'
PURPLE = '#70428A'


def wrap(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines = []
    for paragraph in text.split('\n'):
        line = ''
        for word in paragraph.split():
            candidate = f'{line} {word}'.strip()
            if font.getlength(candidate) <= max_width:
                line = candidate
                continue
            if line:
                lines.append(line)
            line = ''
            for char in word:
                if line and font.getlength(line + char) > max_width:
                    lines.append(line)
                    line = ''
                line += char
        if line:
            lines.append(line)
    return lines


def render(output: Path, name: str, width: int, blocks: list[tuple], fonts: Path) -> None:
    padding = 8 * SCALE
    y = padding
    rows = []
    for text, size, bold, color, gap in blocks:
        face = 'Bold' if bold else 'Regular'
        font = ImageFont.truetype(str(fonts / f'Pretendard-{face}.otf'), size * SCALE)
        for line in wrap(text, font, width * SCALE - padding * 2):
            rows.append((line, font, color, y))
            y += round(size * 1.55 * SCALE)
        y += gap * SCALE
    image = Image.new('RGBA', (width * SCALE, y + padding), (255, 255, 255, 0))
    draw = ImageDraw.Draw(image)
    for line, font, color, top in rows:
        draw.text((width * SCALE / 2, top), line, font=font, fill=color, anchor='mt')
    image.save(output / f'{name}.png', optimize=True)
    print(f'{name}.png: {image.width}x{image.height}')


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--font-dir', type=Path, default=Path.home() / '.local/share/fonts')
    parser.add_argument('--output', type=Path, default=Path('dist'))
    args = parser.parse_args()
    for face in ('Regular', 'Bold'):
        if not (args.font_dir / f'Pretendard-{face}.otf').is_file():
            raise FileNotFoundError(f'Pretendard-{face}.otf')
    args.output.mkdir(parents=True, exist_ok=True)

    about = [
        ('코틀린으로 안드로이드 앱을 만드는 정지영입니다.', 18, True, INK, 14),
        ('분리배출 안내 앱 ‘여기버려’의 품목 검색과 즐겨찾기를 구현하고 Google Play 출시에 참여했습니다.', 17, False, INK, 14),
        ('개인 프로젝트 ‘FitFlow’에서는 러닝 기록과 운동 자세 코칭 기능을 만들었습니다.', 17, False, INK, 14),
        ('현재 관심사', 17, True, PURPLE, 3),
        ('Kotlin / Jetpack Compose\n데이터 흐름 / 접근성 / 테스트', 16, False, INK, 0),
    ]
    yeogi = [
        ('분리배출 안내 / 팀 프로젝트 / Google Play 출시', 16, True, PURPLE, 14),
        ('품목 검색과 상세 안내, 즐겨찾기의 데이터 처리와 상태 관리를 담당했습니다. 사용자가 실제로 입력한 표현으로도 물품을 찾도록 검색어를 보완하고, 이름 변경 시에도 즐겨찾기를 유지하도록 Room 데이터 이전을 구현했습니다.', 17, False, INK, 0),
    ]
    fitflow = [
        ('러닝 기록과 운동 자세 코칭 / 개인 프로젝트', 16, True, PURPLE, 14),
        ('러닝 경로와 운동 기록을 저장하고 CameraX와 ML Kit Pose Detection으로 스쿼트와 런지 자세를 분석하는 기능을 개발했습니다. Room 저장소와 원격 동기화의 실패 처리 및 관련 테스트도 작성했습니다.', 17, False, INK, 0),
    ]
    groups = {
        'subtitle': [('정지영 / 안드로이드 앱 개발자', 20, True, PURPLE, 0)],
        'about-copy': about,
        'yeogi-copy': yeogi,
        'fitflow-copy': fitflow,
        'tech-details': [('MVVM / 멀티 모듈 / 단위 테스트 / Compose UI 테스트', 16, False, INK, 0)],
    }
    for name, blocks in groups.items():
        desktop_width = 470 if name == 'about-copy' else 760
        mobile_width = 190 if name == 'about-copy' else 300
        render(args.output, name, desktop_width, blocks, args.font_dir)
        render(args.output, name + '-mobile', mobile_width, blocks, args.font_dir)

    labels = {
        'title-yeogi': ('여기버려', 130, 25, True),
        'title-fitflow': ('FitFlow', 130, 25, True),
        'link-search': ('검색 개선 PR', 112, 16, False),
        'link-code': ('코드 살펴보기', 112, 16, False),
        'link-adsp': ('ADsP 학습', 95, 16, False),
        'link-react-native': ('React Native 과정', 150, 16, False),
        'link-history': ('한국사 학습', 100, 16, False),
    }
    for name, (text, width, size, bold) in labels.items():
        render(args.output, name, width, [(text, size, bold, PURPLE, 0)], args.font_dir)


if __name__ == '__main__':
    main()
