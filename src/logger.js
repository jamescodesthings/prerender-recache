const Debug = require('debug');
const chalk = require('chalk');
const log = Debug('logger-service:info');

const levels = [
  'debug',
  'info',
  'warn',
  'error',
];

class Logger {
  constructor(namespace) {
    this.namespace = namespace;

    this.createLoggers();

    log(chalk.green('Created Logger for: %s'), namespace);
  }

  createLoggers() {
    if (!(this.namespace && levels && levels.length > 0)) return;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      this[`${level}Logger`] = Debug(`${this.namespace}:${level}`);
      this[level] = (...args) => {
        this[`${level}Logger`](...args);
      };
    }
  }
}


module.exports = Logger;
