import sys
from PIL import Image
from rembg import remove, new_session
src=sys.argv[1]; out=sys.argv[2]; model=sys.argv[3]
im=Image.open(src).convert("RGB")
boxes={"glasses":(70,60,735,370),"coffee":(1055,50,1485,475),"crumpled":(35,425,350,720),
"torn":(420,340,1105,775),"clip":(220,770,410,960),"pen":(685,705,1315,990),"eucalyptus":(1265,490,1520,960)}
s=new_session(model)
for k,b in boxes.items():
    c=im.crop(b)
    r=remove(c,session=s)
    r=r.crop(r.getbbox())
    r.save(f"{out}/{k}.png"); print(k,r.size)
