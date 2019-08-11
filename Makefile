NODE_MODULES := ./node_modules

.PHONY: up dev down install npm-install build clean

up: build
	docker/compose up -d

dev: $(NODE_MODULES)
	docker/compose up -d redis
	docker/node npm run dev

down:
	docker/compose down

install: clean npm-install

npm-install:
	docker/node npm ic

build: install
	docker/node npm run build

clean:
	rm -rf $(NODE_MODULES) .nuxt

build-containers:
	docker/compose build

$(NODE_MODULES):
	$(MAKE) npm-install
