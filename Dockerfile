FROM node:24-slim

RUN apt update \
 && apt install -y --no-install-recommends \
      chromium

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

ADD . .

RUN npm install

CMD ["node", "index.js"]
