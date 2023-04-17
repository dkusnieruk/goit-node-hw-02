const fs = require("fs").promises;

const isExist = (path) => {
  return fs
    .access(path)
    .then(() => true)
    .catch(() => false);
};

const createFolderIfNotExist = async (path) => {
  if (!(await isExist(path))) {
    await fs.mkdir(path);
  }
};

module.exports = createFolderIfNotExist;
