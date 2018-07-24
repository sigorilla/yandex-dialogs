# Contributing

## Requirements

The project is build on [Node.js](http://nodejs.org/) application engine and uses [npm](http://npmjs.org) for tracking dependencies.
For switching quickly between Node.js version you can use a Node.js version manager such as [n](https://github.com/tj/n).

## Getting Started

1. Clone repository

  ```
  git clone git@github.com:sigorilla/yandex-dialogs-witch.git
  cd yandex-dialogs-witch
  ```

2. Install dependencies:

  ```
  npm install
  ```

3. Build and run the service in development mode:

  ```
  make
  ```

By default http-service starts listening on port `8080`. If you started the application locally it should respond on:
```
http://localhost:8080/ping
```

To change the port on which the application listens change the `PORT` environment variable:

```
PORT=8666 make dev
```

## Testing

For run all tests use the command:

```
make validate
```

## Deploying

TBD

## Project Structure

```
configs         Configuration files for different environments
docs            Project's public API documentation
src/            Project's source code
  v1            API handlers and libraries for version 1
  lib           Utilities and project-level libraries
tests           Tests
```

## Style Guides

* [TypeScript](https://github.com/ymaps/codestyle)
