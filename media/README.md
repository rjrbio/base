# Media

Carpeta para los assets visuales y de audio del sitio. Estos archivos son **fuentes** que el frontend-developer/architect referencia desde la implementación. La estructura inicial es una propuesta; el architect puede reubicarla según el stack final.

## Estructura

```
media/
├── README.md                       (este archivo)
├── audio/                          Pistas de audio
└── projects/                       Assets por proyecto
    ├── lore-master-assistant/
    ├── rule-the-mando/
    └── kintsugi-the-fall/
```

## Qué meter en cada carpeta

### `projects/<slug>/`

Por cada proyecto:

| Archivo                              | Descripción                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `hero.<ext>`                         | Imagen/GIF principal del title reveal (opcional).                            |
| `screen-01.<ext>` … `screen-N.<ext>` | Capturas en orden narrativo.                                                 |
| `clip-01.<ext>` … `clip-N.<ext>`     | GIFs/vídeos cortos de funcionamiento (preferir MP4/WebM sobre GIF si pesan). |
| `logo.<ext>`                         | Logo si lo hay (SVG preferido).                                              |
| `palette.md`                         | Paleta sugerida (hex + nombre, opcional).                                    |

Recomendaciones:

- Resolución mínima desktop: 1920×1080.
- Imágenes: WebP o AVIF preferidos; PNG/JPG aceptados. Se optimizan en el build del frontend.
- Vídeos cortos: MP4 (H.264) o WebM, sin audio, ≤6s, ≤2 MB.
- Sin metadatos sensibles (EXIF de cámara/ubicación).

### `audio/`

| Archivo            | Descripción                                     |
| ------------------ | ----------------------------------------------- |
| `ambient.<ext>`    | Pista de fondo en loop, volumen percibido bajo. |
| `hover.<ext>`      | Microsonido para hovers (~100–300 ms).          |
| `transition.<ext>` | Swoosh de cambio de sección (opcional).         |

Recomendaciones:

- Formatos: MP3 + OGG (fallback) o solo MP3.
- Loops sin discontinuidad audible.
- Master a -18 LUFS aprox.
- Duración del ambient: 60–120 s con loop limpio.
- Tamaño total del audio: ≤500 KB combinado (lazy-loaded de todos modos).

## Pendiente

- [ ] Capturas de Lore Master Assistant.
- [ ] Capturas de Rule The Mando.
- [ ] Arte/capturas/clips de Kintsugi: The Fall (sección protagónica — más material).
- [ ] Pista ambient + microsonidos.
