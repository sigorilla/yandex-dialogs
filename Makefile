.PHONY: all
all: npm dev

.PHONY: npm
npm:
	npm install

.PHONY: start
start:
	node src/app.js

# Run the application in development mode
.PHONY: dev
dev:
	npx supervisor \
		--non-interactive \
		--quiet \
		--no-restart-on exit \
		--watch configs,src \
		-- src/app.js

.PHONY: validate
validate:
	npx eslint .
