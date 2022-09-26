FROM node:10.23.3 as build

ARG VERSION
ARG BUILD_TIME
ARG COMMIT_ID
ARG BRANCH
ARG PR
ARG TAG

COPY zadig-portal zadig-portal

# install yarn
RUN npm config --global set registry https://registry.npm.taobao.org
RUN npm install yarn

RUN sed -i 's/${VERSION}/'"$VERSION"'/g' zadig-portal/config/prod.env.js
RUN sed -i 's/${BUILD_TIME}/'"$BUILD_TIME"'/g' zadig-portal/config/prod.env.js
RUN sed -i 's/${COMMIT_ID}/'"$COMMIT_ID"'/g' zadig-portal/config/prod.env.js
RUN sed -i 's/${BRANCH}/'"$BRANCH"'/g' zadig-portal/config/prod.env.js
RUN sed -i 's/${PR}/'"$PR"'/g' zadig-portal/config/prod.env.js
RUN sed -i 's/${TAG}/'"$TAG"'/g' zadig-portal/config/prod.env.js

RUN --mount=type=cache,id=nodebuild,target=/nodecache \
    cd zadig-portal && yarn install --modules-folder=/nodecache && yarn run build

FROM nginx:1.16.0

WORKDIR /zadig-portal

ARG REPO_NAME="zadig-portal"
ARG BUILD_TIME
ARG COMMIT_ID
ARG BRANCH
ARG PR
ARG TAG
ARG BUILD_URL

LABEL maintainer="Zadig Maintainers" \
    description="Zadig is a cloud native, distributed, developer-oriented continuous delivery product." \
    repoName=${REPO_NAME} \
    branch=${BRANCH} \
    pr=${PR} \
    tag=${TAG} \
    commit=${COMMIT_ID} \
    buildTime=${BUILD_TIME} \
    buildURL=${BUILD_URL}



COPY --from=build dist/ /zadig-portal/
ADD zadig-portal/zadig-nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
