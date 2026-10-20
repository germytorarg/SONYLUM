# Recorte de objetos

Los PNG de `public/objects/` salen de la foto cenital de referencia
(anteojos, taza, papel arrugado, hoja rasgada, clip, lapicera, eucalipto).

1. `python3 -I tools/cut_step1.py <foto.png> <salida> isnet-general-use`
   — rembg por recuadro de cada objeto.
2. `python3 -I tools/cut_step2.py <salida> <foto.png>`
   — retoques: lente derecha transparente, taza+plato por máscara circular,
   alfa de la hoja endurecido, clip con más margen.
3. La hoja rasgada se rehizo con relleno de alfa por columnas y
   `prepare_assets.flatten_torn_paper()` (luz aplanada, fibra conservada).

Requiere `pip install rembg scipy pillow`.
