FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm i && npm run build
USER node
CMD ["yarn", "serve"]