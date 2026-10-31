import sys,glob
from PIL import Image,ImageDraw
fs=sorted(glob.glob(sys.argv[1]+"/*.jpg")); cols=int(sys.argv[3]); start=float(sys.argv[4]) if len(sys.argv)>4 else 0.5
ims=[Image.open(f) for f in fs]; w,h=ims[0].size; rows=(len(ims)+cols-1)//cols
S=Image.new("RGB",(w*cols,h*rows))
for i,im in enumerate(ims):
    x,y=(i%cols)*w,(i//cols)*h; S.paste(im,(x,y)); d=ImageDraw.Draw(S); d.rectangle([x,y,x+46,y+18],fill="black"); d.text((x+3,y+3),f"{start+i:.1f}s",fill="yellow")
S.save(sys.argv[2],quality=85); print(S.size)
