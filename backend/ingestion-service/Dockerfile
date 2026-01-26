# Use Node 18
FROM node:18

# Set container working directory
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Expose your port
EXPOSE 4006

# Start app
CMD ["node", "src/app.js"]
