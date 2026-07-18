FROM node:20-alpine

WORKDIR /app

# Copy package configuration and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

EXPOSE 5173

CMD ["npm", "run dev", "--", "--host"]
