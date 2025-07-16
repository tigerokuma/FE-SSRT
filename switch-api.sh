#!/bin/bash

# API Configuration Switcher
# Usage: ./switch-api.sh [local|remote]

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 [local|remote]"
    echo ""
    echo "Current configuration:"
    if [ -n "$NEXT_PUBLIC_API_BASE_URL" ]; then
        echo "  NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL"
    else
        echo "  Using default: http://34.94.83.163:3000 (remote)"
    fi
    exit 1
fi

case "$1" in
    local)
        echo "Switching to LOCAL API (localhost:3000)..."
        export NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
        echo "✓ API endpoint set to: $NEXT_PUBLIC_API_BASE_URL"
        echo ""
        echo "To make this persistent, add this to your shell profile:"
        echo "  export NEXT_PUBLIC_API_BASE_URL=http://localhost:3000"
        ;;
    remote)
        echo "Switching to REMOTE API (34.94.83.163:3000)..."
        export NEXT_PUBLIC_API_BASE_URL=http://34.94.83.163:3000
        echo "✓ API endpoint set to: $NEXT_PUBLIC_API_BASE_URL"
        echo ""
        echo "To make this persistent, add this to your shell profile:"
        echo "  export NEXT_PUBLIC_API_BASE_URL=http://34.94.83.163:3000"
        ;;
    *)
        echo "Error: Invalid option '$1'"
        echo "Usage: $0 [local|remote]"
        exit 1
        ;;
esac

echo ""
echo "Restart your Next.js development server for changes to take effect:"
echo "  npm run dev" 