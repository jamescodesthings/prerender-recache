const chalk = require('chalk');
const mkdirp = require('mkdirp');
const path = require('path');
const Logger = require('./logger.js');

const log = new Logger('utilities');

const xmlFileRegex = /\.xml$/i;

module.exports = {
  getFilenameFromURL: function (url) {
    log.debug(chalk.cyan('Getting filename from: ') + url);

    const filenameRegex = /\/([\w\.]+)$/i;

    const match = filenameRegex.test(url);
    log.debug(chalk.cyan('Match:'), match);

    if(!match) return null;

    const result = filenameRegex.exec(url);
    if(!(result && typeof result === 'object' && result[1])) return null;

    log.debug(chalk.cyan('Result:'), result[1]);
    return result[1];
  },
  makeDirectory: function (folder) {
    if (!folder) return Promise.reject('No folder passed in to create.');
    log.info(chalk.cyan('Creating Directory:'), folder);

    return new Promise((resolve, reject) => {
      let folderPath = path.join(__dirname, folder);

      mkdirp(folderPath, function (err) {
        if (err) {
          log.error(chalk.red('Error: ', err));
          return reject(`Error Creating ${sitemapFolder}`)
        }

        log.debug(chalk.green('Created!'));
        return resolve(folderPath);
      });
    })
  },
  /**
   * Registers a shutdown handler. In a synchronous way because async shutdown is a bit of a pain
   * @param {function} handler A function that takes parameters:
   * (message: 'reason for shutdown', callback: must be called once ready to shut down)
   */
  registerShutdownHandler: function(handler) {
    // Register for graceful shutdown using nodemon
    process.once('SIGUSR2', function () {
      handler('Nodemon Restart', function () {
        process.kill(process.pid, 'SIGUSR2');
      });
    });
    // For app termination
    process.on('SIGINT', function() {
      handler('App Termination', function () {
        process.exit(0);
      });
    });
    // For normal clean exit
    process.on('exit', function() {
      handler('Normal Exit', function() {});
    });

    process.on('uncaughtException', function(e) {
      handler('Uncaught Exception', function() {
        log.error('Uncaught Exception...');
        log.error(e.stack);
        process.exit(99);
      })
    });
  },
  /**
   * Returns true if url is an XML file ending
   * @param url
   */
  isXMLFile: function(url) {
    return xmlFileRegex.test(url);
  }
};
