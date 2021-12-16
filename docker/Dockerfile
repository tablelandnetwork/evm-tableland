FROM node:16-alpine

COPY . /usr/src/
WORKDIR /usr/src/

RUN apk add --no-cache git python3 py3-pip make g++

RUN npm install
RUN npx hardhat compile
RUN npm run build

COPY $PWD/docker/entrypoint.sh /usr/local/bin
ENTRYPOINT ["/bin/sh", "/usr/local/bin/entrypoint.sh"]