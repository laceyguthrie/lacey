#!/bin/bash
#
# Drop HEIC or JPG/JPEG files into _drop/, run ./convert-images.sh.
# Outputs an optimized .jpg + .webp pair into src/img/ for each source file.
# Originals are moved to _drop/processed/ so you have a safety copy.
#
# One-time setup:  brew install webp

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DROP_DIR="$SCRIPT_DIR/_drop"
PROCESSED_DIR="$DROP_DIR/processed"
OUT_DIR="$SCRIPT_DIR/src/img"

JPG_QUALITY=82
WEBP_QUALITY=82
MAX_DIMENSION=2000

if ! command -v cwebp >/dev/null 2>&1; then
    echo "cwebp not found. Install with: brew install webp"
    exit 1
fi

mkdir -p "$DROP_DIR" "$PROCESSED_DIR" "$OUT_DIR"

shopt -s nullglob nocaseglob
files=( "$DROP_DIR"/*.heic "$DROP_DIR"/*.jpg "$DROP_DIR"/*.jpeg )
shopt -u nullglob nocaseglob

if [ ${#files[@]} -eq 0 ]; then
    echo "No HEIC/JPG/JPEG files in $DROP_DIR — drop some in and re-run."
    exit 0
fi

echo "Converting ${#files[@]} file(s)..."
echo

for src in "${files[@]}"; do
    base=$(basename "$src")
    name="${base%.*}"
    out_jpg="$OUT_DIR/$name.jpg"
    out_webp="$OUT_DIR/$name.webp"

    echo "→ $base"
    # sips -Z always scales so the longest edge EQUALS the given value, including
    # upscaling smaller images — so only pass it when the source is actually larger
    # than MAX_DIMENSION. Otherwise just convert format at native size.
    src_w=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')
    src_h=$(sips -g pixelHeight "$src" | awk '/pixelHeight/{print $2}')
    src_long=$(( src_w > src_h ? src_w : src_h ))

    if [ "$src_long" -gt "$MAX_DIMENSION" ]; then
        sips -Z "$MAX_DIMENSION" -s format jpeg -s formatOptions "$JPG_QUALITY" "$src" --out "$out_jpg" >/dev/null
    else
        sips -s format jpeg -s formatOptions "$JPG_QUALITY" "$src" --out "$out_jpg" >/dev/null
    fi
    # Encode webp from the resized JPG so both pairs share the same dimensions.
    cwebp -quiet -q "$WEBP_QUALITY" "$out_jpg" -o "$out_webp"
    mv "$src" "$PROCESSED_DIR/$base"
    echo "  ✓ src/img/$name.jpg + src/img/$name.webp"
done

echo
echo "Done. Originals are in $PROCESSED_DIR"
