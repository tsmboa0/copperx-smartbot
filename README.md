# CopperX Telegram Bot

A Telegram bot for managing your CopperX account, allowing you to check balances, send funds, and perform various wallet operations directly from Telegram.

## Table of Contents

- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Bot](#running-the-bot)
- [API Integration](#api-integration)
  - [Authentication](#authentication)
  - [Wallet Operations](#wallet-operations)
  - [Transfer Operations](#transfer-operations)
- [Command Reference](#command-reference)
  - [General Commands](#general-commands)
  - [Authentication Commands](#authentication-commands)
  - [Wallet Commands](#wallet-commands)
  - [Transfer Commands](#transfer-commands)
- [Troubleshooting Guide](#troubleshooting-guide)
  - [Common Issues](#common-issues)
  - [Debugging](#debugging)
  - [Support](#support)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database
- Telegram Bot Token (obtain from [@BotFather](https://t.me/BotFather))
- CopperX API access credentials

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/copperx-telegram-bot.git
   cd copperx-telegram-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Configuration

1. Create a `.env` file in the root directory with the following variables:

   ```
   BOT_TOKEN=your_telegram_bot_token
   COPPERX_API_BASE_URL=https://income-api.copperx.io
   ENCRYPTION_KEY=your_encryption_key_for_storing_tokens

   # Database configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=copperx_bot

   # Environment
   NODE_ENV=development
   ```

2. The database will be automatically initialized when the bot starts for the first time (when `synchronize: true` in development mode).

### Running the Bot

1. Build the TypeScript code:

   ```bash
   npm run build
   # or
   yarn build
   ```

2. Start the bot:

   ```bash
   npm start
   # or
   yarn start
   ```

3. For development with hot-reloading:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## API Integration

The bot integrates with the CopperX API to perform various operations.

### Authentication

- The bot uses JWT authentication to interact with the CopperX API
- User authentication flow:
  1. User provides email
  2. OTP is sent to the email
  3. User enters OTP to complete authentication
  4. JWT token is stored securely in the database for subsequent API calls

```typescript
// Example of authentication headers
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
};
```

### Wallet Operations

The bot interacts with the following wallet endpoints:

- `GET /api/wallets` - Retrieve user wallets
- `GET /api/wallets/balances` - Get wallet balances
- `POST /api/wallets/default` - Set default wallet
- `GET /api/wallets/deposit-address` - Get deposit instructions
- `GET /api/transactions` - Get transaction history

### Transfer Operations

The bot supports various transfer operations:

- Email transfers: `POST /api/transfers/send`
- Wallet transfers: `POST /api/transfers/wallet-withdraw`
- Bank withdrawals: `POST /api/transfers/offramp`
- Transfer history: `GET /api/transfers`

## Command Reference

### General Commands

| Command  | Description                              |
| -------- | ---------------------------------------- |
| `/start` | Start the bot and see available commands |
| `/menu`  | Show the main menu                       |

### Authentication Commands

| Command    | Description                        |
| ---------- | ---------------------------------- |
| `/login`   | Login to your CopperX account      |
| `/profile` | View your CopperX profile details  |
| `/kyc`     | Check your KYC verification status |
| `/logout`  | Logout from your CopperX account   |

### Wallet Commands

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `/wallets`      | View all your connected wallets          |
| `/balance`      | Check wallet balances across networks    |
| `/setdefault`   | Set your default wallet for transactions |
| `/deposit`      | Get deposit instructions for your wallet |
| `/transactions` | View your transaction history            |

### Transfer Commands

| Command        | Description                    |
| -------------- | ------------------------------ |
| `/send_email`  | Send funds to an email address |
| `/send_wallet` | Send funds to external wallet  |
| `/withdraw`    | Withdraw funds to bank account |
| `/transfers`   | View recent transfers          |

## Troubleshooting Guide

### Common Issues

1. **Bot not responding**

   - Check if the bot is running
   - Verify your Telegram bot token is correct
   - Ensure the bot has been started by the user with `/start`

2. **Authentication failures**

   - Verify API credentials in `.env` file
   - Check if the user's session has expired (they may need to login again)
   - Ensure the CopperX API is accessible

3. **Database connection issues**

   - Verify database credentials in `.env`
   - Check if PostgreSQL service is running
   - Ensure database schema is properly initialized

4. **Transfer failures**
   - Check if the user has sufficient balance
   - Verify recipient details are correct
   - Ensure the user has completed KYC if required for the operation

### Debugging

1. Check the console logs for error messages
2. Enable debug mode by setting `DEBUG=true` in your `.env` file
3. Inspect API responses for error details:

```typescript
try {
  // API call
} catch (error) {
  console.error("API Error:", error.response?.data || error.message);
}
```

### Support

If you encounter issues not covered in this guide:

1. Open an issue on the GitHub repository
2. Contact the CopperX support team at support@copperx.io
3. Join our developer community on Telegram: t.me/copperx_dev

---

## Security Considerations

- User tokens are encrypted in the database using the `ENCRYPTION_KEY` environment variable
- The bot automatically logs out users when their tokens expire
- Sensitive operations require re-authentication
- All API communications use HTTPS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

For more information about the CopperX API, visit the [official documentation](https://docs.copperx.io).
