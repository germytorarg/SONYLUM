#!/usr/bin/env sh
# Descarga las imágenes generadas (Figma AI, links válidos 7 días desde el 10/10/2026)
# y las deja optimizadas en assets/img. Requiere curl y ffmpeg.
set -e
cd "$(dirname "$0")/assets/img"
get() {
  curl -fsSL -o "$1.png" "https://www.figma.com/api/mcp/asset/$2.png"
  ffmpeg -y -hide_banner -loglevel error -i "$1.png" -q:v 3 "$1.jpg"
  rm "$1.png"
  echo "ok  $1.jpg"
}
get bauhaus  9ca2f785-d4b5-4703-a632-439e8d218efe
get liquido  5a4aaf47-86e7-4a2b-b55c-3a66f6ae27b5
get rodaje   5ed542d6-fb36-495e-a8b2-805f64bb8999
get prisma   16dab7e8-8e26-4d30-97cc-7cc7133a7504
get vertical db3c26f6-c4e1-4d7f-b278-2d4d4353418c
get obelisco d959dd8f-afc3-4364-a8ea-4e37a61ee2fc
get boda     3f8471f0-1439-464f-8001-c0a2ad610bc2
get gotas    78097919-d063-4ce5-a154-59e2fcc7af58
