#!/bin/bash
#
# Drop HEIC or JPG/JPEG files into _drop/, run ./convert-images.sh.
# Outputs an optimized .jpg + .webp pair into images/ for each source file.
# Originals are moved to _drop/processed/ so you have a safety copy.
#
# One-time setup:  brew install webp

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DROP_DIR="$SCRIPT_DIR/_drop"
PROCESSED_DIR="$DROP_DIR/processed"
OUT_DIR="$SCRIPT_DIR/images"

JPG_QUALITY=82
WEBP_QUALITY=82

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
    ext_lower=$(echo "${base##*.}" | tr '[:upper:]' '[:lower:]')
    out_jpg="$OUT_DIR/$name.jpg"
    out_webp="$OUT_DIR/$name.webp"

    echo "→ $base"
    sips -s format jpeg -s formatOptions "$JPG_QUALITY" "$src" --out "$out_jpg" >/dev/null
    if [ "$ext_lower" = "heic" ]; then
        # cwebp can't read HEIC, so encode the webp from the freshly written JPG.
        cwebp -quiet -q "$WEBP_QUALITY" "$out_jpg" -o "$out_webp"
    else
        cwebp -quiet -q "$WEBP_QUALITY" "$src" -o "$out_webp"
    fi
    mv "$src" "$PROCESSED_DIR/$base"
    echo "  ✓ images/$name.jpg + images/$name.webp"
done

echo
echo "Done. Originals are in $PROCESSED_DIR"
