#!/bin/bash
# ============================================================
# SOLANA DEVNET SETUP SCRIPT
# For Ubuntu 24.04 VPS
# Run as root: bash setup_solana.sh
# ============================================================

set -e  # Exit on error

echo "========================================"
echo "🚀 SOLANA DEVNET ENVIRONMENT SETUP"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================
# STEP 1: System Update
# ============================================================
echo -e "${YELLOW}[1/7] Updating system...${NC}"
apt update && apt upgrade -y
apt install -y build-essential pkg-config libssl-dev libudev-dev curl git

# ============================================================
# STEP 2: Install Rust
# ============================================================
echo -e "${YELLOW}[2/7] Installing Rust...${NC}"
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustc --version
echo -e "${GREEN}✓ Rust installed${NC}"

# ============================================================
# STEP 3: Install Solana CLI
# ============================================================
echo -e "${YELLOW}[3/7] Installing Solana CLI...${NC}"
sh -c "$(curl -sSfL https://release.solana.com/v1.18.18/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
solana --version
echo -e "${GREEN}✓ Solana CLI installed${NC}"

# ============================================================
# STEP 4: Configure Solana for Devnet
# ============================================================
echo -e "${YELLOW}[4/7] Configuring Solana for Devnet...${NC}"
solana config set --url devnet
echo -e "${GREEN}✓ Configured for Devnet${NC}"

# ============================================================
# STEP 5: Create Wallet
# ============================================================
echo -e "${YELLOW}[5/7] Creating Devnet Wallet...${NC}"
mkdir -p ~/.config/solana
solana-keygen new --outfile ~/.config/solana/devnet.json --no-bip39-passphrase --force
solana config set --keypair ~/.config/solana/devnet.json
WALLET=$(solana address)
echo -e "${GREEN}✓ Wallet created: $WALLET${NC}"

# ============================================================
# STEP 6: Airdrop SOL
# ============================================================
echo -e "${YELLOW}[6/7] Requesting Devnet SOL...${NC}"
sleep 2
solana airdrop 2 || echo "Rate limited, try manual airdrop later"
solana balance
echo -e "${GREEN}✓ SOL airdrop requested${NC}"

# ============================================================
# STEP 7: Install Anchor
# ============================================================
echo -e "${YELLOW}[7/7] Installing Anchor CLI...${NC}"
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
anchor --version
echo -e "${GREEN}✓ Anchor installed${NC}"

# ============================================================
# STEP 8: Install SPL Token CLI
# ============================================================
echo -e "${YELLOW}[BONUS] Installing SPL Token CLI...${NC}"
cargo install spl-token-cli
echo -e "${GREEN}✓ SPL Token CLI installed${NC}"

# ============================================================
# DONE!
# ============================================================
echo ""
echo "========================================"
echo -e "${GREEN}🎉 SETUP COMPLETE!${NC}"
echo "========================================"
echo ""
echo "Your wallet address: $(solana address)"
echo "Your SOL balance:    $(solana balance)"
echo ""
echo "Next steps:"
echo "1. Run: source ~/.bashrc"
echo "2. Create token: spl-token create-token"
echo "3. Clone your project and deploy!"
echo ""
echo "========================================"
