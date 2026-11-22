"""work/charts.json 의 채보를 src/music.js 의 G.MUSIC 에 덮어씁니다 (곡 목록은 그대로)."""
import json, re, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = json.load(open(os.path.join(root, 'work', 'charts.json')))
p = os.path.join(root, 'src', 'music.js'); s = open(p, encoding='utf8').read()
m = re.search(r'G.MUSIC = (\{.*\});\n', s); M = json.loads(m.group(1))
for k in M:
    if k in C: M[k]['charts'] = C[k]['charts']
s = s[:m.start(1)] + json.dumps(M, separators=(',', ':')) + s[m.end(1):]
open(p, 'w', encoding='utf8').write(s); print('채보 적용 완료:', ', '.join(M))
