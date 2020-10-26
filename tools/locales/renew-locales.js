/* eslint-disable no-await-in-loop,no-restricted-syntax,no-console */
const fs = require('fs').promises;
const path = require('path');
const _ = require('lodash');
const { LOCALES_DIR } = require('../constants');

/**
 * Search configuration
 */
const configuration = {
    src: path.join(LOCALES_DIR, 'en/messages.json'), // Base language json
    targets: ['./Extension/'], // Directory to search occurrences
    output: path.join(LOCALES_DIR, 'en/messages.json'), // Place to put result
    filesReg: '(.js|.html)$',
    // messages used in extensions localisations e.g. __MSG_short_name__
    persistedMessages: ['name', 'short_name', 'description'],
};

/**
 * Promise wrapper for writing in file
 *
 * @param {string} filename
 * @param {*} body
 */
const writeInFile = (filename, body) => {
    if (typeof body !== 'string') {
        body = JSON.stringify(body, null, 4);
    }
    return fs.writeFile(filename, body);
};

/**
 * Finds files paths within directory corresponding to filesReg
 * @param {string} dir
 * @param {string} filesReg
 * @returns {Promise<*>}
 */
const findFilesPaths = async (dir, filesReg) => {
    const filterRegexp = new RegExp(filesReg);
    const walk = async (dir, filePaths = []) => {
        const files = await fs.readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);

            if (stat.isDirectory()) {
                filePaths = await walk(filePath, filePaths);
            } else if (filePath.match(filterRegexp)) {
                filePaths.push(filePath);
            }
        }
        return filePaths;
    };
    return walk(dir);
};

const getFilesPathsList = async (targets, filesReg) => {
    const filesListsPromises = targets.map(async (directory) => {
        return findFilesPaths(directory, filesReg);
    });
    return Promise
        .all(filesListsPromises)
        .then((filesLists) => {
            return filesLists.reduce((uniqueFiles, filesList) => {
                return [...new Set([...uniqueFiles, ...filesList])];
            }, []);
        });
};

const filterMessages = (messages, content) => {
    return messages.filter((message) => {
        return content.indexOf(message) > -1;
    });
};

const chooseMessagesFromFiles = async (messages, targets, filesReg) => {
    const filesPaths = await getFilesPathsList(targets, filesReg);
    const filteredMessages = filesPaths.map(async (filePath) => {
        const fileContent = await fs.readFile(filePath);
        return filterMessages(messages, fileContent);
    });
    return Promise
        .all(filteredMessages)
        .then((messages) => {
            return [...messages.reduce((unique, messageArray) => {
                return new Set([...unique, ...messageArray]);
            }, new Set())];
        });
};

/**
 * Initialization of search process
 */
export const renewLocales = async () => {
    let { targets } = configuration;
    const {
        src,
        output = 'result.json',
        filesReg = '.html$',
        persistedMessages = [],
    } = configuration;

    if (!src) {
        throw new Error('No source path');
    }

    if (!targets || !targets.length) {
        throw new Error('No target directories');
    }

    if (typeof targets === 'string') {
        targets = [targets];
    }

    // eslint-disable-next-line global-require,import/no-dynamic-require
    const source = require(src);
    const oldKeys = Object.keys({ ...source });

    chooseMessagesFromFiles(oldKeys, targets, filesReg)
        .then((chosenKeys) => {
            const result = {};
            const resultMessages = _.uniq([...chosenKeys, ...persistedMessages]);
            resultMessages.forEach((key) => {
                result[key] = source[key];
            });
            console.log('existing keys number: ', resultMessages.length);
            console.log('old keys number: ', oldKeys.length);
            const removedKeys = _.xor(resultMessages, oldKeys);
            console.log('removed keys number: ', removedKeys.length);
            console.log('removed keys: ', removedKeys);
            return writeInFile(output, result);
        })
        .then(() => {
            console.log('Success');
        })
        .catch((err) => {
            console.error(err);
        });
};