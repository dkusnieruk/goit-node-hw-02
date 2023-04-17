const app = require("./app");
const path = require("path");
const createFolderIfNotExist = require("./helpers/helpers");
const port = 3600;
const storeImagesTmp = path.join(process.cwd(), "tmp");

app.listen(port, () => {
  createFolderIfNotExist(storeImagesTmp);
  console.log("Server running. Use our API on port: " + port);
});
