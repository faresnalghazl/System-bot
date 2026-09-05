# 🛡️ Discord Administration & Ticket Bot (V2)

A comprehensive, production-grade Discord administration, moderation, and interactive ticket bot built with Node.js and Discord.js v14. It offers complete server management tools, interactive slash commands, automated logging, and a modern ticket panel with transcription export.

---

## ✨ Features

### 🎫 Interactive Ticket System
- Category Select Menu: Dynamic ticket opening based on inquiry type (Support, Complaints, Inquiries).
- Control Buttons: Direct action buttons inside opened tickets:
  - 🔒 Close Ticket: Safely close and initiate transcript generation.
  - 📥 Claim Ticket: Assigns the ticket to the claiming staff member and notifies the user.
  - 📄 Transcript Generation: Exports full conversation history into a downloadable file.

### 🔨 Advanced Moderation Tools (Slash Commands)
- /ban & /kick: Ban or kick members with specified reasons and automatic moderation logs.
- /timeout: Temporarily mute members with custom durations (in minutes).
- /clear: Bulk delete up to 100 messages at once.
- /slowmode: Configure channel message rate limits.
- /lock & /unlock: Lock down or reopen channels dynamically by adjusting @everyone permissions.
- /warn & /warnings: Issue warnings and view member disciplinary history.

### 📢 Server & Utility Systems
- /announce: Send professional, styled announcement embeds with optional @everyone ping.
- /userinfo & /serverinfo: Detailed cards showing roles, IDs, join dates, and server metrics.
- 📜 Centralized Logging Channel: Automatic audit log tracking for all mod actions and ticket activities.
- 🎭 Auto-Role System: Automatically assigns designated roles to newly joined members.

---

## 🛠️ Tech Stack & Dependencies

- Runtime: Node.js (v16.11.0+)
- Library: Discord.js v14
- Configuration: dotenv

---

## 📁 Project Structure

st-bot/
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rule file (excludes .env & node_modules)
├── deploy-commands.js    # Slash command registration script (REST API)
├── index.js              # Core application entry point & event handlers
├── package.json          # Dependencies & package scripts
└── README.txt            # Documentation

---

## 📦 Installation & Setup

### 1. Install Dependencies
Ensure you have Node.js installed, then execute:

npm install

Or install dependencies manually:
npm install discord.js dotenv

### 2. Configure Environment Variables
Create a .env file in the root directory:

DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id
GUILD_ID=your_discord_server_id
LOG_CHANNEL_ID=your_logs_channel_id
AUTO_ROLE_ID=your_welcome_role_id
TICKET_CATEGORY_ID=your_ticket_category_id
SUPPORT_ROLE_ID=your_staff_support_role_id

### 3. Deploy Slash Commands
Register the application slash commands to your guild:

node deploy-commands.js

### 4. Run the Bot
Start the application:

node index.js

---

## 🎮 Command Reference

| Command | Permission | Description |
| :--- | :--- | :--- |
| /ticket-setup | Administrator | Sends the interactive ticket creation panel |
| /ban <user> [reason] | Ban Members | Bans a member from the server |
| /kick <user> [reason] | Kick Members | Kicks a member from the server |
| /timeout <user> <duration> [reason] | Moderate Members | Mutes a member for a specified number of minutes |
| /clear <amount> | Manage Messages | Deletes between 1 to 100 messages |
| /slowmode <seconds> | Manage Channels | Sets channel slowmode interval (0 to disable) |
| /lock | Manage Channels | Locks the current channel for @everyone |
| /unlock | Manage Channels | Unlocks the current channel for @everyone |
| /warn <user> <reason> | Moderate Members | Issues a warning to a member |
| /warnings <user> | Moderate Members | Displays all recorded warnings for a member |
| /announce <title> <message> [ping] | Manage Messages | Sends an administrative embedded announcement |
| /userinfo [user] | Everyone | Displays account and profile details |
| /serverinfo | Everyone | Displays server statistics and configuration info |

---

## 🔒 Security Best Practices

- Never upload .env: Make sure .env is listed inside .gitignore before publishing to GitHub.
- Keep your bot's Privileged Gateway Intents (Server Members, Message Content, Guilds) enabled in the Discord Developer Portal.

---

## 📄 License

This project is licensed under the MIT License.
