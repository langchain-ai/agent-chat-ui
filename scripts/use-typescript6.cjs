const Module = require("node:module");

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolveFilename.call(
    this,
    request === "typescript" ? "@typescript/typescript6" : request,
    ...args,
  );
};
