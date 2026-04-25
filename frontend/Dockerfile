# Use official Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose Vite's default port
EXPOSE 3000

# Run the dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
