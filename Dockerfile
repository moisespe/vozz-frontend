FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["sh", "-c", "npx vite build && tail -f /dev/null"]
