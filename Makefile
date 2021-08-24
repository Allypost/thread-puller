NODE_MODULES := ./node_modules
APP_NAME := Thread Puller
DB_CONTAINER := redis
WEB_CONTAINER := web
BUILD_OUTPUT_DIR := .nuxt.tmp
FINAL_OUTPUT_DIR := .nuxt
GOTIFY_APP_TOKEN := AZ-fRl7Zby4aID6

.PHONY: stop
stop:
	docker/compose stop

.PHONY: start
start:
	docker/compose start

.PHONY: up
up:
	docker/compose up -d

.PHONY: up-db
up-db:
	docker/compose up -d $(DB_CONTAINER)

.PHONY: prod
prod: notify-start build reboot notify-end

.PHONY: dev
dev: $(NODE_MODULES) up-db
	docker/yarn dev || exit 0
	$(MAKE) down

.PHONY: debug/api
debug/api: $(NODE_MODULES)
	nodemon \
		--ext 'js,mjs,json,ts' \
		--exec "TS_NODE_COMPILER_OPTIONS='{\"module\":\"CommonJS\",\"target\":\"ES2017\"}' node --inspect -r ts-node/register ./api"

.PHONY: down
down:
	docker/compose down

lint:
ifdef fix
	docker/yarn lint --fix
else
	docker/yarn lint
endif

.PHONY: restart
restart: stop start

.PHONY: restart-web
restart-web:
	docker/compose restart $(WEB_CONTAINER)

.PHONY: reboot
reboot: down up

.PHONY: rebuild
rebuild: build restart

.PHONY: install
install: clean yarn-install

.PHONY: notify-start
notify-start:
	@curl \
		"https://gotify.josip.igr.ec/message?token=$(GOTIFY_APP_TOKEN)" \
		-F "title=[$(APP_NAME)] Build počeo" \
		-F "message=Build za $(APP_NAME) je započeo na \`$(shell hostname)'" \
		-F "priority=5" &>/dev/null \
	|| exit 0

.PHONY: notify-end
notify-end:
	@curl \
		"https://gotify.josip.igr.ec/message?token=$(GOTIFY_APP_TOKEN)" \
		-F "title=[$(APP_NAME)] Build završio" \
		-F "message=Build za $(APP_NAME) je završio na \`$(shell hostname)'" \
		-F "priority=5" &>/dev/null \
	|| exit 0

.PHONY: notify-failed
notify-failed:
	@curl \
		"https://gotify.josip.igr.ec/message?token=$(GOTIFY_APP_TOKEN)" \
		-F "title=[$(APP_NAME)] Build pukao" \
		-F "message=Build za $(APP_NAME) je pukao na \`$(shell hostname)'" \
		-F "priority=10" &>/dev/null \
	|| exit 0

.PHONY: yarn-install
yarn-install:
	docker/yarn install

.PHONY: build
build: yarn-install
	mkdir -p "$(FINAL_OUTPUT_DIR)" && \
	docker/yarn build -c nuxt.config.build && \
	mv "$(FINAL_OUTPUT_DIR)" "$(FINAL_OUTPUT_DIR).old" && \
	mv "$(BUILD_OUTPUT_DIR)" "$(FINAL_OUTPUT_DIR)" && \
	rm -rf "$(FINAL_OUTPUT_DIR).old" \
	|| $(MAKE) notify-failed

.PHONY: clean
clean:
	rm -rf $(NODE_MODULES) .nuxt

.PHONY: build-containers
build-containers:
	docker/compose build

$(NODE_MODULES): yarn-install
