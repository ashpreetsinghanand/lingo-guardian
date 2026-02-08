#!/bin/bash

# =============================================================================
# 🎬 LINGO-GUARDIAN DEMO RECORDING SCRIPT
# =============================================================================
# This script provides a step-by-step demo flow for recording a video
# showcasing Lingo-Guardian's capabilities.
#
# USAGE: Run this script and follow the prompts. Press ENTER to continue
#        between steps so you can record each step at your own pace.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                                                               ║${NC}"
echo -e "${PURPLE}║   🎬 LINGO-GUARDIAN DEMO RECORDING SCRIPT                     ║${NC}"
echo -e "${PURPLE}║   The Automated i18n Firewall for React                       ║${NC}"
echo -e "${PURPLE}║                                                               ║${NC}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 0: Explain what we're doing
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 DEMO OVERVIEW${NC}"
echo ""
echo "This demo will show:"
echo "  1. Installing lingo-guardian from npm"
echo "  2. Setting up lingo.dev for translations"
echo "  3. Running the i18n audit on a real landing page"
echo "  4. Viewing the visual dashboard"
echo ""
echo -e "${GREEN}Press ENTER to start recording...${NC}"
read -r

# =============================================================================
# STEP 1: INSTALL FROM NPM
# =============================================================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 1: Install Lingo-Guardian from npm${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Running: ${GREEN}npx lingo-guardian@latest --version${NC}"
echo ""
echo -e "${GREEN}Press ENTER to run...${NC}"
read -r
npx lingo-guardian@latest --version

echo ""
echo -e "${GREEN}✓ Lingo-Guardian installed successfully!${NC}"
echo ""
echo -e "${GREEN}Press ENTER to continue...${NC}"
read -r

# =============================================================================
# STEP 2: SHOW THE LANDING PAGE
# =============================================================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 2: Show the Demo Landing Page${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Our demo app is a CloudFlow SaaS landing page with:"
echo "  • 80+ translatable text elements"
echo "  • Navigation, Hero, Features, Pricing, Testimonials, Footer"
echo "  • Support for 7 languages: de, ar, ja, es, fr, zh, hi"
echo ""
echo -e "Open in browser: ${BLUE}http://localhost:3001${NC}"
echo ""
echo -e "${GREEN}Press ENTER after showing the page in browser...${NC}"
read -r

# =============================================================================
# STEP 3: RUN THE AUDIT
# =============================================================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 3: Run the i18n Audit${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Running: ${GREEN}npx lingo-guardian lint http://localhost:3001 -p .${NC}"
echo ""
echo "This will:"
echo "  1. Detect i18n.json configuration"
echo "  2. Generate translations with Lingo.dev"
echo "  3. Scan for CSS overflows in each locale"
echo "  4. Show source file locations for each issue"
echo ""
echo -e "${GREEN}Press ENTER to run the audit...${NC}"
read -r
npx lingo-guardian@latest lint http://localhost:3001 -p .

echo ""
echo -e "${GREEN}Press ENTER to continue...${NC}"
read -r

# =============================================================================
# STEP 4: DASHBOARD VIEW
# =============================================================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 4: Visual Dashboard${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Running: ${GREEN}npx lingo-guardian dashboard http://localhost:3001${NC}"
echo ""
echo "This opens a 4-pane dashboard showing:"
echo "  • English (source)"
echo "  • German (expansion testing)"  
echo "  • Arabic (RTL testing)"
echo "  • Japanese (font testing)"
echo ""
echo -e "${GREEN}Press ENTER to launch dashboard...${NC}"
read -r
npx lingo-guardian@latest dashboard http://localhost:3001 &

echo ""
echo -e "${BLUE}Dashboard running at: http://localhost:3005${NC}"
echo ""
echo -e "${GREEN}Press ENTER when done showing dashboard...${NC}"
read -r

# Kill the dashboard
pkill -f "lingo-guardian dashboard" 2>/dev/null || true

# =============================================================================
# FINALE
# =============================================================================
echo ""
echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                                                               ║${NC}"
echo -e "${PURPLE}║   ✅ DEMO COMPLETE!                                           ║${NC}"
echo -e "${PURPLE}║                                                               ║${NC}"
echo -e "${PURPLE}║   🛡️  Lingo-Guardian                                          ║${NC}"
echo -e "${PURPLE}║   The Automated i18n Firewall for React                       ║${NC}"
echo -e "${PURPLE}║                                                               ║${NC}"
echo -e "${PURPLE}║   📦 npm install lingo-guardian                               ║${NC}"
echo -e "${PURPLE}║   🔗 https://github.com/ashpreetsinghanand/lingo-guardian     ║${NC}"
echo -e "${PURPLE}║   ⚡ Powered by Lingo.dev                                      ║${NC}"
echo -e "${PURPLE}║                                                               ║${NC}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
