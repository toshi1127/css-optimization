# css-optimization

This project uses [pupperium](https://github.com/akito0107/pupperium) to make [puppeteer](https://github.com/GoogleChrome/puppeteer) intuitive.

This tool uses puppeteer's coverage feature to output an optimized CSS file.

By describing actions in the yaml file, the puppeteer can be operated intuitively, so a more accurate CSS file is output.

Media query and font-face, etc. are not deleted because PostCSS AST node is used.

### Installing
```
$ yarn global add css-optimization
```

### How to use
```
$ css-optimization -p <caseDir> -i <imgDir> -c <cssDir>
```

### Options
```
$ pupperium --help
Usage: pupperium [options]

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
url: 'https://suumo.jp/kanto/'
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

```

### Demo
```
$ git clone https://github.com/toshi1127/css-optimization.git
$ cd cli
$ yarn
$ yarn run build
$ yarn run test:e2e:run-tests
```