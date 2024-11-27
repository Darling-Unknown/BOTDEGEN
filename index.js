// Import the neccessary libraries
const express = require('express');


// Initialize express app
const app = express();

// Import necessary librariesn
const { Telegraf } = require('telegraf');

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Replace with your bot token
const botToken = '7673269679:AAFJtzKg4LjWewAvYPe6NjxFQENwEfC7nnk';
const bot = new TelegramBot(botToken, { polling: true });

let trackedAddresses = [];
let tokenMessageId = null;
let updateInterval;

// Function to fetch token details from Dexscreener
async function getTokenDetails(tokenAddress) {
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching token details:', error.response?.data || error.message);
    throw new Error('Failed to fetch token details from Dexscreener.');
  }
}
// Function to format token details into a large ASCII card
function createAsciiCard(tokenData) {
  const primaryPair = tokenData.pairs[0]; // Assuming the first pair is the most relevant

  // Prepare a large ASCII art card with token details
  let card = '+------------------------------------------+\n';
  card += '|             Darlington🤖               |\n';
  card += '|------------------------------------------|\n';
  card += `|  Token Name: ${primaryPair.baseToken.name || 'TOKEN NAME'}               |\n`;
  card += `|  ROI (24h): ${primaryPair.priceChange.h24 +'%'|| '+0.00%'}                 |\n`;
  card += `|  Price: $${primaryPair.priceUsd || 'N/A'}                               |\n`;
  card += `|  Market Cap: $${primaryPair.fdv || 'N/A'}                              |\n`;
  card += '|------------------------------------------|\n';
  card += '|               Support: Palmpay 😏         |\n';
  card += '|               Contact: 9035751502 👀      |\n';
  card += '+------------------------------------------+\n';

  // Add latest transactions if available
  if (primaryPair.txns?.h24?.buys && primaryPair.txns?.h24?.sells) {
    card += `\n    🔔 Latest Transactions:\n`;
    card += `    💚 Buys: ${primaryPair.txns.h24.buys}\n`;
    card += `    ❤️ Sells: ${primaryPair.txns.h24.sells}\n`;
  } else {
    card += '\n    🔔 No recent transactions found.\n';
  }

  return card;
}
  
// Command to fetch token details and display them
bot.onText(/\/addtoken (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const tokenAddress = match[1].trim();

  // Clear previous interval to avoid duplication
  if (updateInterval) clearInterval(updateInterval);

  const updateMessage = async () => {
    try {
      // Delete the previous message if it exists
      if (tokenMessageId) {
        await bot.deleteMessage(chatId, tokenMessageId).catch(() => {});
      }

      // Fetch token details
      const tokenData = await getTokenDetails(tokenAddress);

      if (!tokenData || !tokenData.pairs || tokenData.pairs.length === 0) {
        throw new Error('No data found for the provided token.');
      }

      // Generate the ASCII card
      const asciiCard = createAsciiCard(tokenData);

      // Send the ASCII card message
      const options = {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🛒 Buy Directly💸',
                url: `https://t.me/odysseus_trojanbot?start=r-scch-${tokenAddress}`,
              },
            ],
          ],
        },
      };

      const sentMessage = await bot.sendMessage(chatId, `<pre>${asciiCard}</pre>`, options);
      tokenMessageId = sentMessage.message_id;
    } catch (error) {
      console.error('Error updating token details:', error.message);
      bot.sendMessage(chatId, '❌ Failed to update token information.');
    }
  };

  // Update the message every 5 seconds
  updateInterval = setInterval(updateMessage, 20000);
  updateMessage(); // Call immediately
});

// Handle errors
bot.// Function to send errors to the admin
function sendErrorToAdmin(errorMessage) {
  bot.telegram.sendMessage(ADMIN_ID, `Error: ${errorMessage}`).catch((err) => {
    console.error('Failed to send error notification to admin:', err);
  });
}

// Handle uncaught exceptions globally
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  sendErrorToAdmin(`Uncaught Exception: ${err.message}\nStack Trace: ${err.stack}`);
});

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
  sendErrorToAdmin(`Unhandled Promise Rejection: ${reason}`);
});

// Set webhook for the bot
const webhookUrl = `https://maxbot20017-61x0b9w4.b4a.run/bot`; // Replace with your Back4App URL
bot.telegram.setWebhook(webhookUrl).then(() => {
  console.log('Webhook set successfully:', webhookUrl);
}).catch((err) => {
  console.error('Failed to set webhook:', err);
  sendErrorToAdmin(`Failed to set webhook: ${err.message}`);
});

// Handle incoming webhook requests
// Match the webhook path '/bot'
// Handle incoming webhook requests and make sure the bot is processing updates
app.use(bot.webhookCallback('/bot')); // Make sure the path '/bot'
// Start the Express server
const PORT = 3000; // Back4App typically uses port 3000 for containers
app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});

// Start the bot with webhook handling
function startBot() {
  try {
    console.log('Starting bot with webhook...');
    bot.telegram.getWebhookInfo().then((info) => {
      if (info.url !== webhookUrl) {
        console.log('Updating webhook URL...');
        bot.telegram.setWebhook(webhookUrl).catch((err) => {
          console.error('Failed to update webhook:', err);
          sendErrorToAdmin(`Failed to update webhook: ${err.message}`);
        });
      }
      console.log('Webhook is active. Bot is ready!');
    }).catch((err) => {
      console.error('Failed to fetch webhook info:', err);
      sendErrorToAdmin(`Failed to fetch webhook info: ${err.message}`);
    });
  } catch (err) {
    console.error('Failed to start bot:', err);
    sendErrorToAdmin(`Failed to start bot: ${err.message}`);
  }
}

// Function to restart the bot if it crashes
function restartBot() {
  console.log('Bot is restarting...');
  try {
    bot.stop(); // Stop the bot gracefully

    // Wait for a short delay and restart
    setTimeout(() => {
      startBot(); // Restart the bot by calling the startBot function again
    }, 5000); // 5 seconds delay before restarting
  } catch (err) {
    console.error('Error during bot restart:', err);
    sendErrorToAdmin(`Error dur
ing bot restart: ${err.message}`);
  }
}
// Function to send errors to the admin
function sendErrorToAdmin(errorMessage) {
  bot.telegram.sendMessage(ADMIN_ID, `Error: ${errorMessage}`).catch((err) => {
    console.error('Failed to send error notification to admin:', err);
  });
}

// Handle uncaught exceptions globally
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  sendErrorToAdmin(`Uncaught Exception: ${err.message}\nStack Trace: ${err.stack}`);
});

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
  sendErrorToAdmin(`Unhandled Promise Rejection: ${reason}`);
});

// Set webhook for the bot
const webhookUrl = `https://maxbot20017-61x0b9w4.b4a.run/bot`; // Replace with your Back4App URL
bot.telegram.setWebhook(webhookUrl).then(() => {
  console.log('Webhook set successfully:', webhookUrl);
}).catch((err) => {
  console.error('Failed to set webhook:', err);
  sendErrorToAdmin(`Failed to set webhook: ${err.message}`);
});

// Handle incoming webhook requests
// Match the webhook path '/bot'
// Handle incoming webhook requests and make sure the bot is processing updates
app.use(bot.webhookCallback('/bot')); // Make sure the path '/bot'
// Start the Express server
const PORT = 3000; // Back4App typically uses port 3000 for containers
app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});

// Start the bot with webhook handling
function startBot() {
  try {
    console.log('Starting bot with webhook...');
    bot.telegram.getWebhookInfo().then((info) => {
      if (info.url !== webhookUrl) {
        console.log('Updating webhook URL...');
        bot.telegram.setWebhook(webhookUrl).catch((err) => {
          console.error('Failed to update webhook:', err);
          sendErrorToAdmin(`Failed to update webhook: ${err.message}`);
        });
      }
      console.log('Webhook is active. Bot is ready!');
    }).catch((err) => {
      console.error('Failed to fetch webhook info:', err);
      sendErrorToAdmin(`Failed to fetch webhook info: ${err.message}`);
    });
  } catch (err) {
    console.error('Failed to start bot:', err);
    sendErrorToAdmin(`Failed to start bot: ${err.message}`);
  }
}

// Function to restart the bot if it crashes
function restartBot() {
  console.log('Bot is restarting...');
  try {
    bot.stop(); // Stop the bot gracefully

    // Wait for a short delay and restart
    setTimeout(() => {
      startBot(); // Restart the bot by calling the startBot function again
    }, 5000); // 5 seconds delay before restarting
  } catch (err) {
    console.error('Error during bot restart:', err);
    sendErrorToAdmin(`Error dur
ing bot restart: ${err.message}`);
  }
}

// Start the bot initially
startBot();