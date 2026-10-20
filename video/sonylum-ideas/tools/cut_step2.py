import numpy as np, sys
from PIL import Image, ImageDraw, ImageFilter
from rembg import remove, new_session
S=sys.argv[1]; src=Image.open(sys.argv[2]).convert("RGB")
# glasses: clear the right-lens interior where pixels are neutral (background seen through glass)
g=np.array(Image.open(S+"/cut/glasses.png")).astype(float)
h,w=g.shape[:2]; yy,xx=np.mgrid[:h,:w]
rgb=g[...,:3]; mx=rgb.max(-1); mn=rgb.min(-1); sat=(mx-mn)/(mx+1)
for cx,cy,r in [(470,128,100),(180,180,98)]:
    inside=((xx-cx)**2+(yy-cy)**2)<r*r
    kill=inside&(sat<0.32)
    g[...,3]=np.where(kill,0,g[...,3])
a=Image.fromarray(g[...,3].astype(np.uint8)).filter(ImageFilter.MedianFilter(3))
g[...,3]=np.array(a)
Image.fromarray(g.astype(np.uint8)).save(S+"/cut/glasses.png")
# coffee: circular saucer mask, supersampled
box=(1062,52,1484,474); c=src.crop(box).convert("RGBA")
m=Image.new("L",(c.width*4,c.height*4),0); d=ImageDraw.Draw(m)
cx,cy,r=(1272-box[0])*4,(262-box[1])*4,204*4
d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=255); m=m.resize(c.size,Image.LANCZOS)
c.putalpha(m); c.crop(c.getbbox()).save(S+"/cut/coffee.png")
# torn paper: harden semi-transparent alpha
t=np.array(Image.open(S+"/cut/torn.png")).astype(float)
t[...,3]=np.clip((t[...,3]-50)/110,0,1)*255
Image.fromarray(t.astype(np.uint8)).save(S+"/cut/torn.png")
# clip: bigger box
s=new_session("isnet-general-use")
r=remove(src.crop((205,755,430,985)),session=s); r.crop(r.getbbox()).save(S+"/cut/clip.png")
