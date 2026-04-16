#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="$ROOT/dist/output"
OUTPUT_RESOURCE="$ROOT/dist/output_resource"
OUTPUT_STATIC="$ROOT/dist/output_static"

# 映射平台环境变量到 preset 期望的变量名
export CLIENT_BASE_PATH="${MCLAW_APP_ID:+/app/$MCLAW_APP_ID}"
export ASSETS_CDN_PATH="${MCLAW_CDN_DOMAIN:-/}"
export NODE_ENV="${NODE_ENV:-production}"

# 清理
rm -rf "$ROOT/dist"

# 1. Vite 构建前端 → dist/client/
npx vite build --outDir "$ROOT/dist/client" --emptyOutDir

# 2. tsc 构建服务端 → dist/server/
npx tsc -p tsconfig.server.json
npx tsc-alias -p tsconfig.server.json

# 3. 组装 dist/output/
mkdir -p "$OUTPUT"

# HTML → dist/output/（部署平台托管静态文件）
find "$ROOT/dist/client" -maxdepth 1 -name '*.html' -exec mv {} "$OUTPUT/" \;

# 生成 routes.json
echo '{ "version": 1, "type": "apex", "fallback": "index.html" }' > "$OUTPUT/routes.json"

# 服务端产物（tsc 输出保留 server/、shared/ 子目录）
cp -r "$ROOT/dist/server/"* "$OUTPUT/"

# 声明 CJS（服务端 tsc 输出为 commonjs，需要覆盖根 package.json 的 "type": "module"）
# deploy 时 prune 步骤会用精简版覆盖此文件
echo '{ "private": true }' > "$OUTPUT/package.json"

# 4. assets/ → dist/output_resource/（JS/CSS/字体，上传到 CDN）
if [ -d "$ROOT/dist/client/assets" ]; then
  mkdir -p "$OUTPUT_RESOURCE"
  cp -r "$ROOT/dist/client/assets" "$OUTPUT_RESOURCE/"
fi

# 5. 私有静态资源 → dist/output_static/
if [ -d "$ROOT/shared/static" ]; then
  mkdir -p "$OUTPUT_STATIC"
  rsync -a --exclude='*.ts' --exclude='*.tsx' --exclude='*.js' --exclude='*.jsx' "$ROOT/shared/static/" "$OUTPUT_STATIC/"
fi

# 清理中间产物
rm -rf "$ROOT/dist/client" "$ROOT/dist/server"

echo "Build complete"
echo "  HTML + Server → dist/output/"
[ -d "$OUTPUT_RESOURCE" ] && echo "  Resource      → dist/output_resource/" || true
[ -d "$OUTPUT_STATIC" ] && echo "  Static        → dist/output_static/" || true
