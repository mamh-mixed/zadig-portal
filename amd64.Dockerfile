FROM nginx:1.16.0

WORKDIR /zadig-portal

ARG repoName="zadig-portal"
ARG branch=""
ARG pr=""
ARG tag=""
ARG commit=""
ARG buildTime=""
ARG buildURL=""

LABEL maintainer="Zadig Maintainers" \
    description="Zadig is a cloud native, distributed, developer-oriented continuous delivery product." \
    repoName=${repoName} \
    branch=${branch} \
    pr=${pr} \
    tag=${tag} \
    commit=${commit} \
    buildTime=${buildTime} \
    buildURL=${buildURL}



ADD dist/ /zadig-portal/
ADD zadig-nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
