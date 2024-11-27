const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
 // Make sure to set your environment variable
// Replace with your bot token
const botToken = (process.env['BOT_API']);
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
bot.on('polling_error', (error) => console.error('Polling Error:', error.message));
