NODE_MODULES := ./node_modules

.PHONY: up dev down install yarn-install build clean

stop:
	docker/compose stop

start:
	docker/compose start

up: build
	docker/compose up -d

dev: $(NODE_MODULES)
	docker/compose up -d redis
	docker/yarn dev
	$(MAKE) down

down:
	docker/compose down

lint:
ifdef fix
	docker/yarn lint --fix
else
	docker/yarn lint
endif

install: clean yarn-install

yarn-install:
	docker/yarn install

build: install
	docker/yarn build

clean:
	rm -rf $(NODE_MODULES) .nuxt

build-containers:
	docker/compose build

$(NODE_MODULES): yarn-install
