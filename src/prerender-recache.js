require('dotenv').config();

const path = require('path');
const fsp = require('fs-promise-native');
const rp = require('request-promise-native');
const chalk = require('chalk');
const rimraf = require('rimraf');
const sitemap = require('sitemap-urls');
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
    this.sitemapName = null;
    this.urlsParsed = [];
    this.registerShutdownListener();
    this.log.info(chalk.cyan('Initialized, call .run() to run.'))
  }

  run() {
    // Validate that all env vars are correct
    this.getEnvironmentVariables()
      .then(() => utils.makeDirectory(this['SITEMAP_FOLDER']))
      .then((directory) => {
        this.log.debug(chalk.cyan(`Made Root Directory:`), directory);
        this.sitemapFolder = directory;
      })
      .then(() => this.getFilenameFromUrl())
      .then((filename) => this.downloadToFile(this.SITEMAP_URL, filename))
      .then((xml) => this.parseSitemap(xml))
      .catch(e => {
        if (e.stack) this.log.error(e.stack);
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
  getFilenameFromUrl(url) {
    const theUrl = url || this.SITEMAP_URL;
    let filenameFromURL = utils.getFilenameFromURL(theUrl);
    if (!filenameFromURL) {
      throw new Error(`Could not get filename from URL: ${theUrl}`);
    }
    return Promise.resolve(filenameFromURL);
  }

  downloadToFile(url, filename) {
    if (!(url && filename)) {
      throw new Error('Need both url and filename parameters');
    }

    const filePath = path.join(this.sitemapFolder, filename);

    return rp.get(url)
      .then((response) => {
        this.log.debug(chalk.cyan('Writing response to:'), filePath);
        return fsp.writeFile(filePath, response)
          .then(() => response);
      })
  }

  parseSitemap(xml) {
    // Parse XML
    const urls = sitemap.extractUrls(xml);
    // this.log.debug(chalk.cyan('Extracted:'), urls);

    const promises = [];

    if (urls && urls.length > 0) {
      for(let i = 0; i < urls.length; i++){
        const url = urls[i];
        // this.log.debug(chalk.magenta('Processing:'), url);
        if (utils.isXMLFile(url)) {
          // this.log.debug(chalk.green('Is XML'));
          const promise = Promise.resolve()
            .then(() => this.getFilenameFromUrl(url))
            .then((filename) => this.downloadToFile(url, filename))
            .then((xml) => this.parseSitemap(xml));
          promises.push(promise);
        } else {
          this.urlsParsed.push(url);
        }
      }
    }

    return Promise.all(promises).then(() => 'done parsing urls');
  }

  sendRecacheRequest() {
    // {
    //   "prerenderToken": "YOUR_TOKEN",
    //   "url": "http://www.example.com/url/to/recache"
    // }
  }

  registerShutdownListener() {
    utils.registerShutdownHandler((...args) => {
      this.shutdownListener(...args)
    })
  }

  shutdownListener(message, callback) {
    this.log.debug(chalk.magenta('Gracefully Shutting Down:'), message);

    if (this.sitemapFolder) {
      this.log.debug(chalk.magenta('Deleting:'), this.sitemapFolder);
      // Synchronously Rimraf the working directory.
      const rimrafErr = rimraf.sync(this.sitemapFolder, { glob: false });
      if (rimrafErr) {
        this.log.error(chalk.red('Error: Could not rm -rf'), this.sitemapFolder, rimrafErr);
      } else {
        this.log.debug(chalk.magenta('Deleted!'));
      }
    }

    callback();
  }
}

module.exports = PrerenderRecache;
