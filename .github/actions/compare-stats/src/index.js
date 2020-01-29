const core = require("@actions/core");
const { ensureDir } = require("fs-extra");
const path = require("path");
const fs = require("fs");
const { writeFile } = require("fs").promises;
const { getStatsDiff, formatStatsDiff } = require("./utils");

const checkPathExists = p => {
  if (!fs.existsSync(p)) {
    printError(`Error: ${p} does not exist!`);
  }
};

async function main() {
  const oldStatsFile = core.getInput("oldStatsFile");
  if (!oldStatsFile) {
    throw new Error("oldStatsFile missing.");
  }

  const newStatsFile = core.getInput("newStatsFile");
  if (!newStatsFile) {
    throw new Error("oldStatsFile missing.");
  }

  const diffOutputFile = core.getInput("diffOutputFile") || "diff.txt";

  const config = {
    extensions: (core.getInput("extensions") || "js").split(","),
    compressions: (core.getInput("compressions") || "gz,br").split(",")
  };

  const absoluteOldPath = path.join(process.cwd(), oldStatsFile);
  const absoluteNewPath = path.join(process.cwd(), newStatsFile);

  checkPathExists(absoluteOldPath);
  checkPathExists(absoluteNewPath);

  const oldAssets = require(absoluteOldPath).assets;
  const newAssets = require(absoluteNewPath).assets;

  const statsDiff = getStatsDiff(oldAssets, newAssets, config);
  const formatted = formatStatsDiff(statsDiff);

  const resultsPath = path.join(process.cwd(), diffOutputFile)
  const resultDir = path.dirname(resultsPath)

  await ensureDir(resultDir);
  await writeFile(resultsPath, formatted);
}

main()
  .catch(err => {
    core.setFailed(err.message);
    process.exit(1);
  })
  .then(() => {
    console.log(`Completed in ${process.uptime()}s.`);
    process.exit();
  });
