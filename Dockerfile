# Use the Node.js official image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your bot files
COPY . .

# Expose the port Back4App will use
EXPOSE 3000

# Start the bot using index.js
CMD ["node", "index.js"]
