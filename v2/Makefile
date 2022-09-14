LOCAL_UID=$(shell id -u)
LOCAL_GID=$(shell id -g)
OUTPUT_BINARY=bin/thread-puller
DOCKER_COMPOSE=docker-compose --project-name 'thread-puller'
DOCKER_COMPOSE_DEV=$(DOCKER_COMPOSE) \
	-f 'docker-compose.yml' \
	-f 'docker-compose.dev.yml' \
	-f 'docker-compose.override.yml'
PACKAGE=github.com/Allypost/thread-puller
define LDFLAGS
-X '$(PACKAGE)/app/version.buildTimestamp=$(shell date -u '+%Y-%m-%dT%H:%M:%S%Z')'
-X '$(PACKAGE)/app/version.environment="production"'
endef
LDFLAGS:=$(strip $(LDFLAGS))

.PHONY: all
all: build

.PHONY: build
build:
	CGO_ENABLED=0 \
	go \
			build \
			-a \
			-tags osusergo,netgo \
			-gcflags "all=-N -l" \
			-ldflags="-s -w -extldflags \"-static\" $(LDFLAGS)" \
			-o "${OUTPUT_BINARY}" \
			main.go
	chmod +x "${OUTPUT_BINARY}"

$(OUTPUT_BINARY):
	$(MAKE) build

.PHONY: run
run: $(OUTPUT_BINARY)
	$(OUTPUT_BINARY)

.PHONY: format
format:
	gofmt -e -l -s -w .

.PHONY: fmt
fmt: format

.PHONY: clean
clean:
	rm -rf $(OUTPUT_BINARY)

.PHONY: compact
compact: build
	upx --brute "${OUTPUT_BINARY}"

.PHONY: sync-deps
sync-deps:
	CGO_ENABLED=0 go mod download

.PHONY: $pull
$pull:
	git pull --rebase

.PHONY: dev/server
dev/server: assets dev/server/install
	gin \
		--all \
		--immediate \
		--excludeDir '.idea' \
		--excludeDir '.cache' \
		--excludeDir '.docker' \
		--excludeDir '$(patsubst %/,%,$(dir ${OUTPUT_BINARY}))' \
		--bin '${OUTPUT_BINARY}' \
		run \
		main.go

.PHONY: dev/server/install
dev/server/install:
	go get github.com/codegangsta/gin

.PHONY: debug/build
debug/build: assets
	CGO_ENABLED=0 \
	go \
	build \
	-a \
	-gcflags "all=-N -l" \
	-o "${OUTPUT_BINARY}" \
	main.go

.PHONY: debug/run
debug/run:
	killall dlv; \
	dlv \
	--listen=:2345 \
	--headless=true \
	--api-version=2 \
	--accept-multiclient \
	exec \
	"${OUTPUT_BINARY}"
