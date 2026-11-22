import re,io
import os
d=os.path.dirname(os.path.abspath(__file__))+'/'
r=lambda f:open(d+f,encoding='utf8').read()
js='\n'.join(r(f) for f in ['core.js','data.js','music.js','audio.js','art.js','stage.js','vn.js','app.js'])

html=f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>굿바이락</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Permanent+Marker&display=swap" rel="stylesheet">
<style>
{r('style.css')}</style>
</head>
<body>
{r('body.html')}
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function(){{
{js}
}})();
</script>
</body>
</html>
'''
open(os.path.join(d,'..','index.html'),'w',encoding='utf8').write(html)
print('index.html 생성 완료')
print(len(html))
