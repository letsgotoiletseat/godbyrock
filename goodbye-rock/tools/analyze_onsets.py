import librosa, numpy as np, json, sys
out={}
for k in range(1,12):
    n='g%02d'%k
    y,sr=librosa.load('work/'+n+'.wav',sr=22050)
    dur=len(y)/sr
    tempo,beats=librosa.beat.beat_track(y=y,sr=sr,units='time')
    tempo=float(np.atleast_1d(tempo)[0])
    while tempo<85: tempo*=2
    while tempo>175: tempo/=2
    env=librosa.onset.onset_strength(y=y,sr=sr)
    on=librosa.onset.onset_detect(onset_envelope=env,sr=sr,units='frames',backtrack=False)
    ot=librosa.frames_to_time(on,sr=sr); os_=env[on]/env.max()
    # 음높이 → 레인
    S=np.abs(librosa.stft(y,n_fft=2048,hop_length=512))
    cen=librosa.feature.spectral_centroid(S=S,sr=sr)[0]
    rms=librosa.feature.rms(S=S)[0]
    spb=60/tempo; g=spb/4
    t0=float(beats[0]) if len(beats) else 0.0
    t0=t0-np.floor(t0/spb)*spb
    out[n]={'bpm':round(tempo,1),'dur':round(dur,2),'t0':round(t0,3),'on':[]}
    for t,s,f in zip(ot,os_,on):
        q=round((t-t0)/g); tq=t0+q*g
        if abs(tq-t)>g*.45 or tq<1.0 or tq>dur-1.0: continue
        out[n]['on'].append([round(tq,3),int(q),round(float(s),3),round(float(cen[min(f,len(cen)-1)]),0),round(float(rms[min(f,len(rms)-1)]),4)])
    print(n,round(tempo,1),round(dur,1),len(out[n]['on']),file=sys.stderr)
json.dump(out,open('work/onsets.json','w'))
