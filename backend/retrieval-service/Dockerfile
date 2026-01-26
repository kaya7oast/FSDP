FROM node:20-alpine

WORKDIR /app

# Copy package.json first for caching
COPY package*.json ./

RUN npm install

# Copy all other files
COPY . .

EXPOSE 4005

# Start the correct entry file
CMD ["node", "src/app.js"]
