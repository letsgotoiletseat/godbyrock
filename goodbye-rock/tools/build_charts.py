import librosa, numpy as np, json
O=json.load(open('work/onsets.json'))
res={}
for n,d in O.items():
    y,sr=librosa.load('work/%s.wav'%n,sr=22050)
    rms=librosa.feature.rms(y=y,hop_length=512)[0]; rt=lambda t: rms[min(len(rms)-1,int(t*sr/512))]
    med=np.median(rms)
    bpm=d['bpm']; spb=60/bpm; g=spb/4; t0=d['t0']; dur=d['dur']
    on=d['on']  # t,q,s,cen,rms
    cens=np.array([o[3] for o in on]) if on else np.array([1])
    qs=np.quantile(cens,[.25,.5,.75])
    def lane_of(c): return int(np.searchsorted(qs,c))
    byq={o[1]:o for o in on}
    qmax=int((dur-1.5-t0)/g)
    charts=[]
    for diff in range(3):
        step=[4,2,1][diff]; target=[1.3,2.4,5.4][diff]
        cand={}
        for o in on:
            q=o[1]
            if q%step==0: cand[q]=o[2]
            elif diff==1 and o[2]>.35: cand[q-(q%step)]=max(cand.get(q-(q%step),0),o[2]*.8)
        # 흐름 채우기: 박 위에 소리가 있으면 보충
        fill=[4,2,2][diff]
        for q in range(int(np.ceil((1.2-t0)/g)),qmax):
            if q%fill: continue
            t=t0+q*g
            if rt(t)>med*.7 and not any(abs(q-k)<fill for k in cand):
                cand[q]=.05
        if diff==2:   # 만신: 소리가 큰 구간은 16분 연타로 채움
            for q in range(int(np.ceil((1.2-t0)/g)),qmax):
                if q in cand: continue
                t=t0+q*g
                if rt(t)>med*1.15 and (q%2==0 or rt(t)>med*1.5): cand[q]=.04
        qsorted=sorted(cand)
        # 밀도 맞추기: 약한 것부터 제거
        nmax=int(target*(dur-3))
        if len(qsorted)>nmax:
            keep=sorted(qsorted,key=lambda q:-cand[q])[:nmax]; qsorted=sorted(keep)
        # 최소 간격
        mg=[4,2,1][diff]; sel=[]
        for q in qsorted:
            if sel and q-sel[-1]<mg: 
                if cand[q]>cand[sel[-1]]: sel[-1]=q
                continue
            sel.append(q)
        notes=[]; busy=[-1]*4; prev=None; cnt=[0,0,0,0]; lane=1; pc=None
        for i,q in enumerate(sel):
            t=round(t0+q*g,3); nxt=sel[i+1] if i+1<len(sel) else q+64
            gapb=(nxt-q)/4
            o=byq.get(q); c=o[3] if o else None
            # 음높이 흐름: 올라가면 오른쪽, 내려가면 왼쪽. 끝에서는 튕기고, 덜 쓰인 레인 쪽을 선호
            if c is not None and pc is not None and abs(c-pc)>pc*.04: d=1 if c>pc else -1
            else: d=1 if (i%4<2) else -1
            if c is not None: pc=c
            step=2 if (c is not None and pc and abs(c-(pc or c))>pc*.25) else 1
            cand_l=lane+d*step
            if cand_l<0 or cand_l>3: cand_l=lane-d*step
            cand_l=max(0,min(3,cand_l))
            m=min(cnt)
            if cnt[cand_l]-m>3:
                cand_l=min(range(4),key=lambda k:(cnt[k],abs(k-lane)))
            if prev is not None and cand_l==prev[1] and (q-prev[0])<8: cand_l=(cand_l+2)%4
            tries=0
            while busy[cand_l]>t-0.05 and tries<4: cand_l=(cand_l+1)%4; tries+=1
            lane=cand_l
            ln=0.0; kind='n'
            if gapb>=[3,2,1.5][diff] and rt(t)>med*.8 and i%[2,1,1][diff]==0:
                ln=round((nxt-q-[4,4,2][diff])*g,3)
                if ln<spb*.9: ln=0.0
                else: kind='l'
            if kind=='n' and diff>=1 and q%32==16 and (i%3==0): kind='g'
            if kind=='n' and diff==0 and q%64==32: kind='g'
            notes.append([t,lane,ln,kind]); busy[lane]=t+ln; prev=(q,lane); cnt[lane]+=1
            if diff==2 and kind=='n' and (cand[q]>.5 or q%16==0):
                l2=(lane+2)%4
                if busy[l2]<t-0.05: notes.append([t,l2,0.0,'n']); cnt[l2]+=1
        charts.append(notes)
    res[n]={'bpm':bpm,'dur':dur,'charts':charts}
    print(n,bpm,[[sum(1 for x in c if x[1]==k) for k in range(4)] for c in charts],[len(c) for c in charts],[round(len(c)/dur,2) for c in charts],[sum(1 for x in c if x[3]=='l') for c in charts],[sum(1 for x in c if x[3]=='g') for c in charts])
json.dump(res,open('work/charts.json','w'),separators=(',',':'))
