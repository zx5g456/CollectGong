# 二开推荐阅读 https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/scene/build/speed.html
FROM alpine:3.13

RUN apk add ca-certificates

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tencent.com/g' /etc/apk/repositories \
&& apk add --update --no-cache nodejs npm

WORKDIR /app

COPY server/package*.json /app/

RUN npm config set registry https://mirrors.cloud.tencent.com/npm/
RUN npm install

COPY server /app

CMD ["npm", "start"]
