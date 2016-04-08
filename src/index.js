// dependencies
import Plugin from 'abigail-plugin';
import minimatch from 'minimatch';

// self dependencies
import Script from './Script';

// @class Parse
export default class Parse extends Plugin {
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
  * @param {string[]} sentence - a sentence of chopsticks
  * @param {object} scripts - a source npm scripts
  * @param {object} [options] - optional
  * @param {object} [options.serial] - if ture, process the glob in serial
  * @returns {array} task - the represents the execution order of the script
  *   task[]             - run in parallel
  *   task[][]           - run in serial
  *   task[][][]         - run in parallel
  *   task[][][].scripts - run in serial ({pre, main, post})
  */
  static parse(sentence = [], scripts = {}, options = {}) {
    const task = [];

    sentence.forEach((patterns) => {
      const serial = [];

      patterns.forEach((pattern) => {
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
        throw new Error(`no scripts found: ${patterns}`);
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
      const sentence = props.sentence;
      const scripts = props.json.data.scripts;

      const options = {
        serial: this.opts.value === 'serial',
      };
      const task = this.constructor.parse(sentence, scripts, options);
      this.setProps({ task });
    });
  }
}
