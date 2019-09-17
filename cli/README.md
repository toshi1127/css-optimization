# css-optimization

This tool uses puppeteer's coverage feature to output an optimized CSS file.

As a feature of the tool, by using [pupperium](https://github.com/akito0107/pupperium), user can operate [puppeteer](https://github.com/GoogleChrome/puppeteer) with the yaml file.

Media query and font-face, etc. are not deleted because PostCSS AST node is used.

### Installing
```
$ npm install -g css-optimization
```

### How to use
```
$ css-optimization -p <caseDir> -i <imgDir> -c <cssDir>
```

### Options
```
$ css-optimization --help
Usage: css-optimization [options]

Options:
  -V, --version                   output the version number
  -p, --path <caseDir>            cases root dir
  -i, --image-dir <imgDir>        screehshots dir
  -c, --css-dir <cssDir>          optimize css dir
  -e, --extension-dir <exDir>     extensions dir
  -t, --target <targetScenarios>  target scenario names (comma delimited)
  -h, --disable-headless          disable headless mode
  -h, --help                      output usage information
```

### example: case file
```
name: demo
version: 1
url: 'https://suumo.jp/chintai/bc_100168625925/'
iteration: 1

steps:
  - action:
      type: hover
      selector: '#js-mylist > div > ul > li:nth-child(2) > div > div > ul'
  - action:
      type: click
      selector: '#js-mylist-myHistory' 
  - action:
      type: wait
      duration: 500
  - action:
      type: click
      selector: '#js-mylist-historyBox-close' 
  - action:
      type: screenshot
      name: 'demo'
```

### Demo
```
$ git clone https://github.com/toshi1127/css-optimization.git
$ cd cli
$ npm install
$ npm run build
$ npm run test:e2e:run-tests
```
