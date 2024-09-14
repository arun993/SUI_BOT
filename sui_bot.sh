#!/bin/bash

REPO_URL="https://github.com/arun993/SUI_BOT.git"
REPO_DIR="SUI_BOT"
NODE_VERSION="18.x"
PACKAGES="@mysten/wallet-standard axios dotenv"
ENV_MSG="Now you can start script using 'node autoDrainBot.js' before that edit .env file"

# Clone the repository and navigate to the directory
clone_repo() {
    if ! git clone "$REPO_URL"; then
        printf "Error: Failed to clone repository.\n" >&2
        return 1
    fi
    cd "$REPO_DIR" || { printf "Error: Failed to change directory.\n" >&2; return 1; }
}

# Update system and install Node.js
install_node() {
    sudo apt update || { printf "Error: Failed to update apt.\n" >&2; return 1; }
    
    if ! curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}" | sudo -E bash -; then
        printf "Error: Failed to setup Node.js.\n" >&2
        return 1
    fi
    
    sudo apt install -y nodejs || { printf "Error: Failed to install Node.js.\n" >&2; return 1; }
}

# Initialize npm and install necessary packages
setup_npm() {
    npm init -y || { printf "Error: npm initialization failed.\n" >&2; return 1; }
    
    if ! npm install $PACKAGES; then
        printf "Error: Failed to install npm packages.\n" >&2
        return 1
    fi
}

# Print the final message in blue
print_final_message() {
    printf "\e[34m%s\e[0m\n" "$ENV_MSG"
}

# Main function
main() {
    clone_repo || return 1
    install_node || return 1
    setup_npm || return 1
    print_final_message
}

main
