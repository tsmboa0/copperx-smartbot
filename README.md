# 🤖 CopperX Telegram SmartBot

## 📝 Project Description

The CopperX Telegram SmartBot is an advanced, AI-powered assistant that helps CopperX users manage their accounts seamlessly. Leveraging the power of LangGraph and the CopperX API, this intelligent bot provides an intuitive experience for managing crypto wallets, making transactions, and accessing financial insights directly through Telegram.

With its hybrid architecture, this smartbot incorporates natural language response, command handling, keyboard interactions, and a Telegram mini-app to help users manage their accounts seamlessly.

## ✨ Key Features

- **🧠 AI-Powered Interactions**: Advanced natural language processing that allows users to manage their wallet through natural conversations. For example, "Can you check my KYC status?" or "Please display my recent transactions." Even new users can ask about CopperX, and the agent responds in natural language, like a friend who's got your back.

- **📡 Multi-Modal Interface**: 
  - Traditional bot commands
  - Conversational AI interactions
  - Interactive button interfaces

- **📱 A Telegram Mini App**: 
  - A CopperX Telegram mini-app for users who might need a GUI at some point, such as starting KYC verification. To access the mini-app, click on the "Open App" menu button in the chat.

- **🔒 Secure Authentication**: 
   - Multi-layer security with CopperX API
   - Rate limit protection allowing 10 requests per minute
   - Access token encryption with AES-256 and PBKDF2 for key hashing

- **💸 Comprehensive Wallet Management**:
  - Balance checks
  - Fund transfers: email and wallet address
  - Transaction history
  - Withdrawal capabilities
  - KYC status
  - Profile
  ... and more.

## 🛠 Technical Architecture

### How It Works

- All text inputs are passed to the router agent
- Router agent decides whether to pass the operation to the handlers or the agent
- If handler, the handlers perform the operation
- If agent, the agent parses the intent, sets the parameters, and calls the handlers if necessary or just sends a message to the user

### Future Implementation

- Agent Persistence: Current version doesn't persist the state or remember previous conversations. This is due to the free version of the Groq API.
- Multi-step actions: Multi-step actions are currently not implemented. For example, a user can say "Withdraw $50 to my Atlas bank account". This would require the agent to first fetch the user's balance, then retrieve bank accounts and get quotes before sending the final response to the user, eliminating multiple button clicks.

If we are selected for the bounty, we will work with the CopperX team to implement these features seamlessly.

### Core Technologies
- **Backend**: Node.js
- **AI Integration**: LangGraph
- **API**: CopperX Payout API
- **Communication**: Telegram Bot API (Grammy)

### Interaction Modes
1. **Command-Based Interactions**
   - Traditional `/` commands
2. **Natural Language Queries**
   - Conversational AI processing
3. **Interactive Buttons**
   - Quick action selection
4. **Telegram Mini App**
   - GUI interactions


## 🔧 Setup and Installation

### Prerequisites
- Node.js (v18+)
- Telegram Bot Token
- Copperx API Credentials
- GRoq API Key (for LangGraph)

### Installation Steps
```bash
# Clone the repository
git clone https://github.com/yourusername/copperx-telegram-bot.git
cd copperx-telegram-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables
```

### Development
```bash
# Run in development mode
npm run dev
```

### Production Deployment
```bash
# Build the project
npm run build

# Start production server
npm start
```

## 📂 Project Structure
```
copperx-telegram-bot/
├── src/
│   ├── agent/             # LangGraph integration
│   ├── configs/           # Configuration
│   ├── handlers/          # Bot command handlers
│   ├── middlewares/       # Rate limit implementation
│   ├── services/          # API and agent services      
    ├── entities/          # Mongoose definitions  
    ├── utils/             # Utility functions
├── index.ts               # Entry file
├── .env.example
└── README.md
```

## 🌐 Resources

- **API Documentation**: [Copperx API Docs](https://income-api.copperx.io/api/doc)
- **Community Support**: [Telegram Community](https://t.me/copperxcommunity/2991)


**Powered by LangGraph, Telegram, and Copperx 🚀**