FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY shared ./shared
RUN npm install --omit=dev
COPY . .
EXPOSE 5001
CMD ["node", "index.js"]
