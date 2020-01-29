const formatPercentage = number =>
  [Infinity, -Infinity, undefined].includes(number)
    ? "-"
    : `${number > 0 ? "\u25b2" : "\u25bc"}&nbsp;${number.toFixed(2)}&nbsp;%`;

const formatSize = size => {
  if (size === 0) {
    return "0";
  }

  const abbreviations = ["bytes", "KiB", "MiB", "GiB"];
  const index = Math.floor(Math.log(Math.abs(size)) / Math.log(1024));

  return `${+(size / Math.pow(1024, index)).toPrecision(3)}&nbsp;${
    abbreviations[index]
  }`;
};

const requiredParam = argumentName => {
  throw new Error(`${argumentName} is required`);
};

const createDiff = (oldSize, newSize) => {
  if (oldSize === undefined || newSize === undefined) {
    return {
      newSize,
      oldSize,
      diff: undefined,
      diffPercentage: undefined
    };
  }

  return {
    newSize,
    oldSize,
    diff: newSize - oldSize,
    diffPercentage: +((1 - newSize / oldSize) * -100).toFixed(5) || 0
  };
};

const indexNameToSize = (statAssets, config) =>
  statAssets.reduce((acc, asset) => {
    const nameParts = asset.name.split(".");
    const extParts = [...config.compressions, ...config.extensions];
    const [name /* hash */] = nameParts.filter(x => !extParts.includes(x));
    const [ext, comp] = nameParts.filter(x => extParts.includes(x));

    return Object.assign(acc, {
      [name]: {
        ...(acc[name] || {}),
        [comp ? comp : ext]: asset.size
      }
    });
  }, {});

const filterByExtension = (statAssets, config) => {
  const mergedExtensions = config.extensions.reduce(
    (acc, e) => [...acc, e, ...config.compressions.map(c => `${e}.${c}`)],
    []
  );

  return statAssets.filter(({ name }) =>
    mergedExtensions.some(ex => name.endsWith(ex))
  );
};

const getStatsDiff = (
  oldAssetStats = requiredParam("oldAssetStats"),
  newAssetStats = requiredParam("newAssetStats"),
  config = requiredParam("config")
) => {
  const oldAssetsByName = indexNameToSize(
    filterByExtension(oldAssetStats, config),
    config
  );
  const newAssetsByName = indexNameToSize(
    filterByExtension(newAssetStats, config),
    config
  );

  // merge extensions with compressions, so it's easier to filter out unwanted assets
  const merged = Object.entries(newAssetsByName).reduce(
    (acc, [name, newStats]) => {
      const oldStats = oldAssetsByName[name];

      return Object.assign(acc, {
        [name]: Object.keys(newStats).reduce(
          (obj, ext) =>
            Object.assign(obj, {
              [ext]: createDiff(
                oldStats && oldStats[ext],
                newStats && newStats[ext]
              )
            }),
          {}
        )
      });
    },
    {}
  );

  return merged;
};

const generateMarkdownString = ({ headers, rows, totals }) => {
  const headerSeparators = headers.map(x =>
    Array.from(new Array(x.length))
      .map(_ => "-")
      .join("")
  );

  return `
<details>
<summary>Details of bundled changes.</summary>

${headers.join(" | ")}
${headerSeparators.join(" | ")}
${rows.map(columns => columns.join(" | ")).join("\n")}
</details>
  
${totals.join(", ")}

  `;
};

const formatStatsDiff = statsDiff => {
  const types = [
    ...Object.values(statsDiff)
      .reduce((acc, stats) => acc.concat(Object.keys(stats)), [])
      .reduce((acc, type) => (acc.has(type) ? acc : acc.add(type)), new Set())
      .keys()
  ];

  const headers = types.reduce(
    (acc, t) => acc.concat([`${t}&nbsp;Prev`, `${t}&nbsp;Current`]),
    types.reduce((acc, t) => acc.concat([`${t}&nbsp;Diff`]), ["File"])
  );

  const rows = Object.entries(statsDiff).map(([file, stats]) => {
    const diffColumns = types.reduce(
      (acc, t) => {
        if (!stats[t] || !stats[t].diffPercentage) {
          return acc.concat(["-"]);
        }

        return acc.concat([formatPercentage(stats[t].diffPercentage)]);
      },
      [file]
    );

    return types.reduce((acc, t) => {
      if (!stats[t]) {
        return acc.concat(["-", "-"]);
      }

      return acc.concat([
        stats[t].oldSize ? formatSize(stats[t].oldSize) : "-",
        stats[t].newSize ? formatSize(stats[t].newSize) : "-"
      ]);
    }, diffColumns);
  });

  const totals = types
    .map(type => {
      const total = Object.values(statsDiff)
        .map(stats => stats[type] && stats[type].diffPercentage)
        .filter(x => x !== undefined)
        .reduce((sum, x) => sum + x, 0);

      return [type, total];
    })
    .filter(([, total]) => total !== 0)
    .map(([type, total]) => `${type}: ${formatPercentage(total)}`);

  return generateMarkdownString({ headers, rows, totals });
};

module.exports = { getStatsDiff, formatStatsDiff };
