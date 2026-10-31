#!/bin/bash
# SFX pass: moments (key texts + music-only bridges + map pin) -> dung-text-fx plan -> render -> mix
cd "$(dirname "$0")/.."
P="<HD_VIDEO_HOME>/venv/Scripts/python.exe"; S="~/.claude/skills/dung-text-fx/scripts"
"$P" -X utf8 scripts/mix.py normvoice > /dev/null
cd work/sfx
SEED=$("$P" -X utf8 -c "import sys; sys.path.insert(0, '../..'); import project; print(project.NAME)")
D=$("$P" -X utf8 -c "import json;print(json.load(open('../plan.json',encoding='utf-8'))['total'])")
"$P" -X utf8 -c "
import json, sys
m=json.load(open('moments.json',encoding='utf-8')); tr=json.load(open('transitions.json'))
sys.path.insert(0,'../..'); import project as P
# Dũng 29/10: chữ hiệu ứng (kể cả nhãn phòng) + số chạy có SFX; animation hình minh họa (bản đồ, MG mặt bằng, thước) không SFX.
pl=json.load(open('../plan.json',encoding='utf-8'))
for n,s in enumerate(x for x in pl['shots'] if x['kind']=='broll' and x['clip'] in getattr(P,'LABELS',{})):   # nhãn phòng = chữ hiệu ứng -> có SFX
    m.append({'id':f'lb{n}','t':round(s['T']+0.35,3),'text':P.LABELS[s['clip']],'say':P.LABELS[s['clip']],'L':'L8','tier':'T1'})
json.dump(sorted(m,key=lambda x:x['t']),open('moments_all.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)"
# Dũng 29/10: SFX chọn theo phân loại (ý định + bậc, sfx_plan.py / 08-sfx.md), bỏ mọi luật cấm âm, không ép 1 khuôn
"$P" -X utf8 "$S/sfx_plan.py" --moments moments_all.json --words words.json --out . --fps 50 --duration $D --seed "$SEED" --style bds | tail -1
"$P" -X utf8 -c "
import json;p=json.load(open('sfx_plan.json',encoding='utf-8'))
p['events']=[e for e in p['events'] if not (e['moment'].startswith('lb') and e['layer']!='dan')]   # nhãn phòng: chỉ âm dẫn ('Mặt tiền' không phải tiền)
import sys; sys.path.insert(0,'../..'); import project as P
T={f['path']:f for f in json.load(open(r'$S/../library/sfx-tags.json'.replace('/c/','C:/'),encoding='utf-8'))['files']}
EX=getattr(P,'SFX_EXCLUDE',[]); used={e['path'] for e in p['events']}
def bad(x): return any(k in x for k in EX)
for e in p['events']:
    if bad(e['path']):
        v=set(T.get(e['path'],{}).get('vai',[]))
        c=sorted([f for f in T.values() if v & set(f['vai']) and not bad(f['path']) and f['path'] not in used and not f.get('game') and f['dur']<=2],
                 key=lambda f:(f['sac_thai'] not in ('sang_trong','tin_cay','am_ap'),f['nang_luong']!='nhe',f['path']))
        if c: print('thay',e['moment'],e['path'],'->',c[0]['path']); e['path']=c[0]['path']; used.add(c[0]['path']); e['ly_do']='thay họ bị Dũng loại'
p['events']=[e for e in p['events'] if not bad(e['path'])]
for e in p['events']:
    if e['layer']=='dan' and e['moment'] in getattr(P,'SFX_OVERRIDE',{}): e['path']=P.SFX_OVERRIDE[e['moment']]; e['ly_do']='Dũng chọn'
p['events']=[e for e in p['events'] if not (e['moment'] in getattr(P,'SFX_OVERRIDE',{}) and e['layer']!='dan')]
for m in p['moments']: m['events']=[x for x in p['events'] if x['moment']==m.get('id')]
json.dump(p,open('sfx_plan.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
for e in p['events']: print(e['moment'],e['layer'],e['path'])"
"$P" -X utf8 "$S/sfx_render.py" sfx_plan.json --out sfx.wav --duration $D --voice ../audio/voice_n.wav | tail -1
cd ../..
"$P" -X utf8 scripts/mix.py mix > work/audio/mixlog.txt
cd work/sfx && "$P" -X utf8 "$S/sfx_audit.py" sfx_plan.json --out sfx-scorecard.json --sfx sfx.wav --voice ../audio/voice_n.wav --bgm ../audio/music_bed.wav 2>&1 | grep TỔNG
