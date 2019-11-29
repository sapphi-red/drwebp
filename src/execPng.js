const util = require("util");
const fs = require("fs-extra");
const path = require("path");
const { execFile } = require("child_process");
const filesize = require("filesize");

const cwebpPath = path.join(__dirname, "../lib/cwebp");

module.exports = async (file, folder) => {
  console.log("Exec png:", file);

  const newFile = file.replace(/\.png$/, ".webp");

  let res;
  try {
    if (await fs.exists(`${newFile}`)) {
      throw { stdout: `${newFile} exists!` };
    }

    res = await util.promisify(execFile)(cwebpPath, [
      "-q",
      "100",
      "-m",
      "6",
      "-pass",
      "10",
      "-mt",
      "-lossless",
      `${file}`,
      "-o",
      `${newFile}`
    ]);
  } catch (e) {
    console.log("Failed to exec png:", file);
    console.error(e, e.stdout);
    throw { path: file, err: e.stdout };
  }

  try {
    const oldSize = (await fs.lstat(file)).size;
    const newSize = (await fs.lstat(newFile)).size;

    await fs.ensureDir("tmp");
    await fs.move(file, path.join("tmp", path.relative(folder, file)));

    console.log("Execed png:", file);
    console.log(
      `  Size change: ${filesize(oldSize)} -> ${filesize(newSize)} (${(
        (newSize / oldSize) *
        100
      ).toFixed(2)}%)`
    );

    return { path: file, res: res.stderr, oldSize, newSize };
  } catch (e) {
    console.log("Failed to exec png:", file);
    console.error(e, e.stdout);
    throw { path: file, err: e.stdout };
  }
};
