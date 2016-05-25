Abigail Parse Plugin
---

<p align="right">
  <a href="https://npmjs.org/package/abigail-plugin-parse">
    <img src="https://img.shields.io/npm/v/abigail-plugin-parse.svg?style=flat-square">
  </a>
  <a href="https://travis-ci.org/abigailjs/abigail-plugin-parse">
    <img src="http://img.shields.io/travis/abigailjs/abigail-plugin-parse.svg?style=flat-square">
  </a>
  <a href="https://codeclimate.com/github/abigailjs/abigail-plugin-parse/coverage">
    <img src="https://img.shields.io/codeclimate/github/abigailjs/abigail-plugin-parse.svg?style=flat-square">
  </a>
  <a href="https://codeclimate.com/github/abigailjs/abigail-plugin-parse">
    <img src="https://img.shields.io/codeclimate/coverage/github/abigailjs/abigail-plugin-parse.svg?style=flat-square">
  </a>
  <a href="https://gemnasium.com/abigailjs/abigail-plugin-parse">
    <img src="https://img.shields.io/gemnasium/abigailjs/abigail-plugin-parse.svg?style=flat-square">
  </a>
</p>

No installation
---
> abigail built-in plugin

Usage
---

## switch to expand the glob in serial

if specify the `'serial'`, glob expand to serial.

```bash
abby cover:* --parse serial
# task start cover:*
# script start cover:test.
# script end cover:test. exit code 0.
#
# script start cover:report.
# script end cover:report. exit code 0.
# task end cover:test, cover:report ...
```

usually expand to parallel.

```bash
abby cover:*
# task start cover:*
# script start cover:test.
# script start cover:report.
# ...
# script end cover:test. exit code 0.
# script end cover:report. exit code 0.
# task end cover:test, cover:report ...
```

## allow raw script

if specify value is `raw`, undefined script execute as a raw command.

```bash
abby 'echo foo' --parse raw
# task start echo foo.
# foo
# ...
```

use `abigail.plugins.parse` field in `package.json`
---

```js
{
  // ...
  "abigail": {
    "plugins": {
      // default allow raw script (default serial)
      "parse": true

      // default parallel
      "parse": "parallel"

      // disallow raw script
      "parse": "script"

      // all configuration
      "parse": {
        "enable": true,
        "serial": false,
        "raw": false
      }
    }
  }
}
```

Note
---
this plugin is parser body. when receiving the `parse` event of abigail.
currently, the option are undefined. __please don't disable this plugin__, launch doesn't work correctly.

in your plugin, if the task is to be changed at any time, you can change the task after getting the instance using this.getPlugin.

```js
import { scripts } from './package.json';
class YourPlugin extends Plugin {
  pluginWillAttach() {
    const parsePlugin = this.getPlugin('parse');
    this.setProps({ task: parsePlugin.parse([['test', 'lint']], scripts) });
  }
}
```

See also
---
* [abigailjs/abigail](https://github.com/abigailjs/abigail#usage)
* [abigailjs/abigail-plugin](https://github.com/abigailjs/abigail-plugin#usage)

Development
---
Requirement global
* NodeJS v5.7.0
* Npm v3.7.1

```bash
git clone https://github.com/abigailjs/abigail-plugin-parse
cd abigail-plugin-parse
npm install

npm test
```

License
---
[MIT](http://abigailjs.mit-license.org/)
