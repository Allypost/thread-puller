NODE_MODULES := node_modules/

.PHONY: up dev down install build clean

up: build
	docker/compose up -d

dev:
	docker/compose up -d redis
	docker/node npm run dev

down:
	docker/compose down

install: clean
	docker/node npm ic

build: install
	docker/node npm run build

clean:
	rm -rf node_modules .nuxt

build-containers:
	docker/compose build
