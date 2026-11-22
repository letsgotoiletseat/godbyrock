# 굿바이락 (Goodbye Rock)

2040년 전뇌 한국, 전국무당협회 묘수팀이 굿으로 영령을 달래는 **사이버펑크 무당 리듬 어드벤처**.
브라우저에서 바로 실행되는 PC(16:9) 리듬게임입니다.

## 실행 방법

음원을 `fetch`로 불러오기 때문에 `index.html`을 더블클릭(file://)하면 음악이 나오지 않습니다. 로컬 서버로 여세요.

```bash
# 저장소 폴더에서
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

### GitHub Pages로 배포
1. 이 폴더를 저장소에 올립니다.
2. 저장소 **Settings → Pages → Build and deployment**에서 `Deploy from a branch`, 브랜치 `main` / 폴더 `/ (root)`를 고릅니다.
3. 잠시 뒤 `https://<아이디>.github.io/<저장소이름>/`에서 플레이할 수 있습니다.

## 조작
| 키 | 동작 |
|---|---|
| D F J K | 레인 1~4 (설정에서 변경 가능) |
| ↑ ↓ / 드래그 / 휠 | 곡 선택 |
| ← → | 난이도(수습·정식·만신) |
| Q E | 앨범 팩 넘기기 |
| Enter | 결정 · 시작 |
| Esc | 뒤로 · 잠시 멈춤 |

## 판정
| 판정 | 알파 모드 | 오차 | 점수 |
|---|---|---|---|
| 얼쑤! | 줴줴이야 | ±45ms | 1000 |
| 좋다! | 야르 | ±90ms | 700 |
| 그렇지 | 엄 | ±135ms | 300 |
| 아이고 | 야랄 | 그 밖 | 0 |

콤보에 따라 최대 2배, 30콤보부터 신명 폭발(×1.2). 롱노트는 누를 때·뗄 때 두 번 판정합니다.

## 이스터에그
설정 → 화면 → **알파 모드**를 켜면 판정·안내 문구가 바뀌고, 자유 굿에 숨겨진 곡 「아 줴줴이야」(노래: 슝좍1)가 나타납니다. 알파 모드를 끄면 다시 숨겨집니다.

## 폴더 구조
```
index.html          빌드된 게임 (이 파일 하나 + art/ + music/ 로 실행)
art/                타이틀 일러스트, 캐릭터 스탠딩
music/              공유마당 무료 음원 + 이스터에그 곡 jjj.mp3
src/                소스 — 수정 후 build.py 로 index.html 을 다시 만듭니다
  core.js           저장, 레벨, 월페이퍼 조각
  data.js           캐릭터, 스토리, 앨범 팩, 월페이퍼 목록
  music.js          음원 곡 목록 + 채보 데이터
  audio.js          음원 재생, 미리듣기, 메뉴 BGM, 효과음
  stage.js          3D 굿판(three.js), 판정, HUD
  vn.js             대화·조사·추론 (스토리, 현재 잠금)
  app.js            화면 흐름 (부팅 → 타이틀 → 메뉴 → 곡 선택 → 결과 …)
  style.css, body.html
tools/              자동 채보 도구 (Python)
```

## 수정하고 다시 빌드하기
```bash
python3 src/build.py      # src/ 를 합쳐 index.html 생성
```

## 곡 추가 · 채보 다시 만들기
필요: `pip install librosa numpy scipy`, `ffmpeg`

1. 원본을 `work/g01.wav` … 형식(모노 22050Hz)으로 변환하고, 재생용 mp3는 `music/g01.mp3`로 둡니다.
   ```bash
   ffmpeg -i 원본.mp4 -vn -ac 1 -ar 22050 work/g12.wav
   ffmpeg -i 원본.mp4 -vn -af loudnorm=I=-15:TP=-1.5:LRA=11 -ac 2 -ar 44100 -b:a 112k music/g12.mp3
   ```
2. `tools/analyze_onsets.py`의 곡 번호 범위를 맞춘 뒤 실행 → `work/onsets.json`
3. `python3 tools/build_charts.py` → `work/charts.json` (수습/정식/만신 3단계, 롱노트·도깨비불 포함)
4. 새 곡은 `src/music.js`의 `G.MUSIC`/`G.SONGS`에 항목을 추가하고, 기존 곡은 `python3 tools/apply_charts.py`로 채보만 덮어씁니다.
5. `python3 src/build.py`

## 설정값
- 스토리 모드 잠금: `src/data.js` 맨 아래 `G.STORY_LOCK = true` (false 로 바꾸면 열림)
- 월페이퍼 추가: `src/data.js`의 `G.WALLS`에 `{id, name, src, fit}` 추가 (한 장당 조각 4개, 레벨 업마다 1개)
- 캐릭터 일러스트: `src/app.js`의 `ILL = {seon:'art/seon.png'}`에 추가하면 초상화 자리에 표시

## 크레딧
자세한 내용은 [CREDITS.md](CREDITS.md)를 보세요.
