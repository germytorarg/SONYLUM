# Arma el video largo: clips Wan a cámara + imágenes con Ken Burns sobre la narración.
import json, subprocess, os
P = os.path.dirname(os.path.abspath(__file__)) + "/.."
os.chdir(P)
NAR = "audio/narracion-completa.mp3"
FPS = 30
GRADE = "eq=contrast=1.04:saturation=0.92,noise=alls=7:allf=t,vignette=PI/5"
oncam = [  # (inicio, fin) en la narración, clip Wan, audio del clip
    (0.0, 15.25, "video/m1-wan.mp4", "audio/clips/m1.mp3"),
    (179.9, 189.6, "video/m3-wan.mp4", "audio/clips/m3.mp3"),
    (464.9, 478.5, "video/m4-wan.mp4", "audio/clips/m4.mp3"),
    (794.6, 808.4, "video/m5-wan.mp4", "audio/clips/m5.mp3"),
]
segs = json.load(open("audio/vo_segs.json"))[:31]
segs[0][0] = 15.25
dur_total = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",NAR]))
segs[-1][1] = segs[-1][1]  # tramo final hasta 794.6
plan = []
for a,b,v,au in oncam: plan.append(("cam", a, b, v, au))
for i,(a,b) in enumerate(segs): plan.append(("img", a, b, f"imagenes/broll/{i:02d}.png", None))
plan.sort(key=lambda x: x[1])
os.makedirs("render/piezas", exist_ok=True)
lista = []
def run(c): subprocess.run(c, check=True)
for k,(tipo,a,b,src,au) in enumerate(plan):
    out = f"render/piezas/{k:03d}.mp4"; lista.append(out)
    if os.path.exists(out): continue
    if tipo == "cam":
        d = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",au]))
        run(["ffmpeg","-v","error","-y","-i",src,"-i",au,"-t",f"{d}","-map","0:v","-map","1:a",
             "-vf",f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps={FPS},{GRADE},format=yuv420p",
             "-c:v","libx264","-preset","veryfast","-crf","20","-c:a","aac","-b:a","192k","-ar","48000","-ac","2",out])
    else:
        d = b - a; n = int(round(d*FPS))
        z = "1+0.12*on/%d" % n if k % 2 == 0 else "1.12-0.12*on/%d" % n
        run(["ffmpeg","-v","error","-y","-i",src,"-ss",f"{a}","-t",f"{d}","-i",NAR,
             "-filter_complex",f"[0:v]scale=3840:2160,zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1920x1080:fps={FPS},{GRADE},format=yuv420p[v]",
             "-map","[v]","-map","1:a","-t",f"{d}","-c:v","libx264","-preset","veryfast","-crf","20","-c:a","aac","-b:a","192k","-ar","48000","-ac","2",out])
    print(k, tipo, round(b-a,2), flush=True)
open("render/lista.txt","w").write("".join(f"file 'piezas/{os.path.basename(x)}'\n" for x in lista))
run(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i","render/lista.txt",
     "-c:v","copy","-c:a","aac","-b:a","192k","render/vivir-o-generar-contenido-1080p.mp4"])
print("listo")
