# Use official Node.js 18 image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the code
COPY . .

# Expose port
EXPOSE 4000

# Start the service
CMD ["node", "src/app.js"]
