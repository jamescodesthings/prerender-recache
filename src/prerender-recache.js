require('dotenv').config();

const path = require('path');
const fs = require('fs');
const http = require('http');
const chalk = require('chalk');
const rimraf = require('rimraf');
const Logger = require('./logger');
const utils = require('./utils');

const envVars = [
  'SITEMAP_URL',
  'SITEMAP_FOLDER'
];

class PrerenderRecache {
  constructor() {
    this.log = new Logger('prerender-recache');
    this.log.info(chalk.cyan.underline('Prerender Sitemap Recacher'));

    this.sitemapFolder = null;
    this.registerShutdownListener();
    this.log.info('Initialized, call .run() to run.')
  }

  run() {
    // Validate that all env vars are correct
    this.getEnvironmentVariables()
      .then(() => utils.makeDirectory(this['SITEMAP_FOLDER']))
      .then((directory) => {
        this.log.debug(`Made Root Directory ${directory}`);
        this.sitemapFolder = directory;
      })
      .catch(e => {
        if(e.stack) this.log.error(e.stack);
        else this.log.error(chalk.red(e));
      });
  }

  /**
   * Gets each of the required environment variables
   */
  getEnvironmentVariables() {
    return new Promise((resolve, reject) => {
      this.log.debug(chalk.cyan('Hoisting Environment Variables'));

      let missingVariables = [];

      for (let i = 0; i < envVars.length; i++) {
        const varName = envVars[i];
        if (!varName) return reject('Blank ENV_VAR name in envVars List!');
        if (!process.env[varName]) {
          missingVariables.push(varName);
        } else {
          this[varName] = process.env[varName];
          this.log.debug(chalk.cyan(`${varName}:`), this[varName]);
        }
      }

      if (missingVariables.length > 0) {
        log.error(chalk.red('Required Environment Variable Missing:'));
        for (let i = 0; i < missingVariables.length; i++) {
          log.error(`- ${missingVariables[i]}`);
        }
        log.error('Please create a .env file using the examples.env template');
        return reject('Missing Required ENV Var');
      }

      resolve();
    })
  }

  /**
   * Downloads the root sitemap.
   */
  downloadRootSitemap() {

  }

  registerShutdownListener() {
    utils.registerShutdownHandler((...args) => {this.shutdownListener(...args)})
  }

  shutdownListener(message, callback) {
    this.log.debug(chalk.cyan('Gracefully Shutting Down:'), message);

    if (this.sitemapFolder) {
      this.log.debug(chalk.cyan('Deleting:'), this.sitemapFolder);
      // Synchronously Rimraf the working directory.
      const rimrafErr = rimraf.sync(this.sitemapFolder, { glob: false });
      if (rimrafErr) {
        this.log.error(chalk.red('Error: Could not rm -rf'), this.sitemapFolder, rimrafErr);
      } else {
        this.log.debug(chalk.green('Deleted!'));
      }
    }

    callback();
  }
}

module.exports = PrerenderRecache;
