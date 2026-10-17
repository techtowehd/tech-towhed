FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p data public/uploads && touch public/uploads/.gitkeep
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server/index.js"]
