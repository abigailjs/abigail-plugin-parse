// dependencies
import Plugin from 'abigail-plugin';
import minimatch from 'minimatch';

// self dependencies
import Script from './Script';

// @class Parse
export default class Parse extends Plugin {
  /**
  * @param {string[]} argv - a command line arguments
  * @returns {string[]} nomarlized - the script globs
  */
  static normalize(argv) {
    const normalized = [];

    let nextSerial = false;
    argv.forEach((arg) => {
      const name = arg.replace(/(^,|,$)/, '');

      const existsSerialPrev = arg[0] === ',' && normalized.length && name.length;
      const canSerialJoin = nextSerial && normalized.length && name.length;
      if (existsSerialPrev || canSerialJoin) {
        nextSerial = false;
        normalized[normalized.length - 1] += `,${name}`;
        if (arg.slice(-1) === ',') {
          nextSerial = true;
        }
        return;
      }

      if (arg.slice(-1) === ',') {
        nextSerial = true;
      }
      if (name.length === 0) {
        return;
      }

      normalized.push(name);
    });

    return normalized;
  }

  /**
  * @param {string} key - a script name
  * @param {object} scripts - a source npm scripts
  * @returns {object} serial - the matched script with pre and post scripts
  */
  static createSerial(key, scripts) {
    const main = new Script(key, scripts[key]);

    const preKey = `pre${key}`;
    let pre;
    if (scripts[preKey]) {
      pre = new Script(preKey, scripts[preKey]);
    }

    const postKey = `post${key}`;
    let post;
    if (scripts[postKey]) {
      post = new Script(postKey, scripts[postKey]);
    }

    return { pre, main, post };
  }

  /**
  * @param {string[]} argv - a command line arguments
  * @param {object} scripts - a source npm scripts
  * @param {object} [options] - optional
  * @param {object} [options.serial] - if ture, process the glob in serial
  * @returns {array} task - the represents the execution order of the script
  *   task[]             - run in parallel
  *   task[][]           - run in serial
  *   task[][][]         - run in parallel
  *   task[][][].scripts - run in serial ({pre, main, post})
  */
  static parse(argv = [], scripts = {}, options = {}) {
    const task = [];

    this.normalize(argv).forEach((arg) => {
      const serial = [];

      arg.split(',').forEach((pattern) => {
        let parallel = [];

        for (const key in scripts) {
          if (minimatch(key, pattern)) {
            if (options.serial && parallel.length) {
              serial.push(parallel);
              parallel = [];
            }

            parallel.push(this.createSerial(key, scripts));
          }
        }

        if (parallel.length === 0) {
          throw new Error(`no scripts found: ${pattern}`);
        } else {
          serial.push(parallel);
        }
      });

      if (serial.length === 0) {
        throw new Error(`no scripts found: ${arg}`);
      } else {
        task.push(serial);
      }
    });

    return task;
  }

  /**
  * @alias Parse.parse
  * @returns {array} task
  */
  parse(...args) {
    return this.constructor.parse(...args);
  }

  /**
  * execute only once before the parse
  * the plugin lifecycle method of plugin via `initialized`
  *
  * @method pluginDidInitialize
  * @returns {undefined}
  */
  pluginDidInitialize() {
    this.subscribe('parse', () => {
      const props = this.getProps();
      const argv = props.globs;
      const scripts = props.json.data.scripts;

      const options = {
        serial: this.opts.value === 'serial',
      };
      const task = this.constructor.parse(argv, scripts, options);
      this.setProps({ task });
    });
  }
}
