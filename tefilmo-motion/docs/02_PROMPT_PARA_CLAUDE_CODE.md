# PROMPT MAESTRO PARA CLAUDE CODE — TEFILMO

Sos director de arte, motion designer senior y desarrollador Remotion/React. Tenés que CONSTRUIR un video vertical de 30 segundos a 1080x1920, 30 fps, utilizando exclusivamente los PNG numerados presentes en esta carpeta y gráficos tipográficos/vectoriales programados. Primero lee 00_INVENTARIO.csv y 01_GUION_ESCENAS.md; son la fuente de verdad. No uses las láminas originales, no inventes assets externos, no cambies los nombres ni inviertas el orden de escenas.

OBJETIVO: un comercial premium emotivo para TEFILMO, con cámara virtual 2.5D, escenas conectadas mediante transformaciones visuales, buen ritmo, tipografía elegante y espacio negativo. No usar plantilla slideshow, saltos bruscos, partículas excesivas, corazones infantiles, rotaciones planas evidentes o zoom infinito.

EJECUCIÓN: crea proyecto Remotion. Importa cada PNG por nombre exacto desde el ZIP extraído; genera componentes Scene01...Scene06 y una secuencia maestra de 900 frames. Timing por escena: 0-149,150-299,300-419,420-599,600-749,750-899. Implementá enter/hold/exit con easing y spring moderado, desenfoque y composición por profundidad. Usa imágenes como cutouts 2D: NO prometas rotación 3D verdadera, ni articular personas, ni separar brazos sin capas. Para 'transformaciones' entre objetos usa máscaras SVG, motion paths, crossfades, wipes de luz y composiciones.

PARA VOZ: prepara carpeta audio/ opcional con archivo voiceover.wav si se incorpora posteriormente; coloca en pantalla exactamente los textos del guion con tiempos legibles y reserva silencios. Sin audio externo, renderiza prueba con música libre solo si disponible legalmente; si no, entrega video mudo listo para musicalizar y narrar.

CONTROL DE CALIDAD: verifica transparencia alfa; crop boxes y bordes de recortes; ningún objeto fuera de encuadre, extremidades cortadas ni texto pegado al borde. Algunos PNG provienen de recortes rectangulares de láminas generativas y PUEDEN CONTENER pedazos de otros elementos en los bordes: inspeccionar uno a uno, corregir máscara o descartar asset defectuoso, sin reemplazarlo por imágenes inventadas. Reusar estilos y personajes con cautela; consistencia aproximada, no absoluta. Fondos construidos en CSS/SVG usando capas gradientes marfil y dorado.

ENTREGABLES: código fuente, preview MP4 1080x1920, compositor editable, instrucciones README de instalación, render final MP4 H264. Reportar cualquier asset imposible de usar sin disimularlo.
