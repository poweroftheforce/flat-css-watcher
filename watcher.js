const damURL = "https://author-abbvie-commercial-prod-65.adobecqms.net";
const damPreviewURL = "https://preview19.rinvoq.com";
const env = "preview";
const damCSSFolder = "/content/dam/rinvoq/css/";
const srcDir = "css";
const distBase = "dist";
const distDir = "author";
const pdistDir = "preview"

const path = require("path");
const fs = require("fs");
const rework = require("rework-file");
const pluginURL = require("rework-plugin-url");
const reworkImportUrl = require('rework-plugin-import-url');
const chokidar = require('chokidar');
const http = require('http');

const watcher = chokidar.watch(path.resolve(`${__dirname}/${srcDir}/`), {ignored: /^\./, persistent: true});

const colorPre = "\x1b";
const colorReset = `${colorPre}[0m`;
const colorBright = `${colorPre}[1m`;
const colorBlue = `${colorPre}[34m`;
const colorGreen = `${colorPre}[32m`;
const colorRed = `${colorPre}[31m`;
const colorYellow = `${colorPre}[33m`;


function promiseAllP(items, block) {
  var promises = [];
  items.forEach(function(item,index) {
      promises.push( function(item,i) {
          return new Promise(function(resolve, reject) {
              return block.apply(this,[item,index,resolve,reject]);
          });
      }(item,index))
  });
  return Promise.all(promises);
}

function updateCSSFilesAuthor(dirname, output) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirname, function(err, filenames) {
      if (err) return reject(err);
      promiseAllP(filenames, (filename, index, resolve, reject) =>  {
        fs.lstat(path.resolve(dirname, filename), (err, stats) => {
          if (stats.isFile()) {
              let content = rework(path.resolve(dirname, filename), { silent: true })
                .use(pluginURL(function(url) {
                  if (url.indexOf(`data:image`) !== -1) {
                    return url;
                  }
                  return damURL + url;
                }))
                .use(reworkImportUrl(function(url) {
                  return damURL + damCSSFolder + url.replace(/\.\//g, "");
                }));
              if (content && content.obj.stylesheet && content.obj.stylesheet.parsingErrors && content.obj.stylesheet.parsingErrors.length) {
                let parseErrs = content.obj.stylesheet.parsingErrors;

                console.log(`${colorBright}${colorBlue}Error parsing file:`, {
                  filename  : parseErrs[0].filename,
                  line      : parseErrs[0].line,
                  reason    : parseErrs[0].reason,
                }, colorReset);
              } else {
                fs.writeFile(path.resolve(output, filename), content.toString(), err => {
                  if (err) {
                    return;
                  }
                });
                console.log(`${colorBright}${colorGreen}File written: ${path.resolve(output, filename)}`, colorReset);
              }
          }
        });
      })
      .then(results => {
        return resolve(results);
      })
      .catch(error => {
        return reject(error);
      });
    });
  });
}

function updateCSSFilesPreview(dirname, output) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirname, function(err, filenames) {
      if (err) return reject(err);
      promiseAllP(filenames, (filename, index, resolve, reject) =>  {
        fs.lstat(path.resolve(dirname, filename), (err, stats) => {
          if (stats.isFile()) {
              let content = rework(path.resolve(dirname, filename), { silent: true })
                .use(pluginURL(function(url) {
                  if (url.indexOf(`data:image`) !== -1) {
                    return url;
                  }
                  return damPreviewURL + url;
                }))
                .use(reworkImportUrl(function(url) {
                  return damPreviewURL + damCSSFolder + url.replace(/\.\//g, "");
                }));
              if (content && content.obj.stylesheet && content.obj.stylesheet.parsingErrors && content.obj.stylesheet.parsingErrors.length) {
                let parseErrs = content.obj.stylesheet.parsingErrors;

                console.log(`${colorBright}${colorBlue}Error parsing file:`, {
                  filename  : parseErrs[0].filename,
                  line      : parseErrs[0].line,
                  reason    : parseErrs[0].reason,
                }, colorReset);
              } else {
                fs.writeFile(path.resolve(output, filename), content.toString(), err => {
                  if (err) {
                    return;
                  }
                });
                console.log(`${colorBright}${colorGreen}File written: ${path.resolve(output, filename)}`, colorReset);
              }
          }
        });
      })
      .then(results => {
        return resolve(results);
      })
      .catch(error => {
        return reject(error);
      });
    });
  });
}

// Create dist folder if it doesn't exist
if (!fs.existsSync(distBase)) {
  fs.mkdirSync(distBase);
}

// Create distDir (author) folder if it doesn't exist
if (!fs.existsSync(distBase + "/" + distDir)) {
  fs.mkdirSync(distBase + "/" + distDir);
}

// Create pdistDir (preview) folder if it doesn't exist
if (!fs.existsSync(distBase + "/" + pdistDir)) {
  fs.mkdirSync(distBase + "/" + pdistDir);
}

watcher
  .on('add', function(path) {
    // console.log('File', path, 'has been added');
  })
  .on('change', function(path) {
    console.log('File', path, 'has been changed');
    // Read CSS file in source folder
    updateCSSFilesAuthor(`${__dirname}/${srcDir}`, `${__dirname}/${distBase + "/" + distDir}`);
    updateCSSFilesPreview(`${__dirname}/${srcDir}`, `${__dirname}/${distBase + "/" + pdistDir}`);
  });

const static = require('node-static');
const port = 8080;
var file = new(static.Server)(__dirname);

http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(port);

console.log(`${colorBright}${colorYellow}Local server running at http://localhost:${port}/`, colorReset);
updateCSSFilesAuthor(`${__dirname}/${srcDir}`, `${__dirname}/${distBase + "/" + distDir}`);
updateCSSFilesPreview(`${__dirname}/${srcDir}`, `${__dirname}/${distBase + "/" + pdistDir}`);