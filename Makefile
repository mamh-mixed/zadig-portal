# New Makefile for multi-architecture
# WARNING:
# This makefile used docker buildx to build multi-arch image
# Please make sure you have the right version of docker.
.PHONY: all

## This Makefile should be used with zadig workflow to inject multiple build parameters.

IMAGE_REPOSITORY = koderover.tencentcloudcr.com/koderover-public
VERSION ?= $(shell date +'%Y%m%d%H%M%S')
VERSION := $(VERSION)

prereq:
	@docker buildx create --node=multiarch-frontend --use --platform=linux/amd64,linux/arm64

all: prereq
all:
	@docker buildx build -t ${IMAGE_REPOSITORY}/zadig-portal:${VERSION} --platform linux/amd64,linux/arm64 -f Dockerfile --build-arg BRANCH=$zadig_portal_BRANCH --build-arg PR=$zadig_portal_PR --build-arg TAG=$zadig_portal_TAG --build-arg COMMIT_ID=$zadig_portal_COMMIT_ID --build-arg BUILD_TIME=$(date +%s) --build-arg BUILD_URL=$BUILD_URL --push ..
