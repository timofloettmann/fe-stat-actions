This is an example repository to compare webpack stats.json files on Pull requests, using Github Actions.

The action is triggered for any Pull Request update, then runs a build on `master` and a build on the branch the PR is for. Both files are stored as artifact and compared in a 3rd step.

The diff is generated with [webpack-stats-diff](https://github.com/ZachGawlik/webpack-stats-diff), forked to extend with Markdown support [here](https://github.com/timofloettmann/webpack-stats-diff)

See PR [PR #1](https://github.com/timofloettmann/fe-stat-actions/pull/1) for an example of the webpack stats diff.

[PR #2](https://github.com/timofloettmann/fe-stat-actions/pull/2) also introduces an automated lighthouse report.
