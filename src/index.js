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
  * @param {object} [options={}] - add extra behavior
  * @param {string[]} [options.suffixes] - add the arguments to the end of script
  * @returns {object} serial - the matched script with pre and post scripts
  */
  static createSerial(key, scripts, options = {}) {
    let suffix = '';
    if (options.suffixes && options.suffixes.length) {
      suffix = ` ${options.suffixes.join(' ')}`;
    }
    const main = new Script(key, scripts[key] + suffix);

    const preKey = `pre${key}`;
    let pre;
    if (scripts[preKey]) {
      pre = new Script(preKey, scripts[preKey] + suffix);
    }

    const postKey = `post${key}`;
    let post;
    if (scripts[postKey]) {
      post = new Script(postKey, scripts[postKey] + suffix);
    }

    return { pre, main, post };
  }

  /**
  * @param {string} raw - a raw script
  * @param {object} [options={}] - add extra behavior
  * @param {string[]} [options.suffixes] - add the arguments to the end of script
  * @returns {object} serial - the raw script
  */
  static createRawScript(raw, options = {}) {
    let suffix = '';
    if (options.suffixes && options.suffixes.length) {
      suffix = ` ${options.suffixes.join(' ')}`;
    }
    const main = new Script(raw, raw + suffix);
    return { main };
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

            parallel.push(this.createSerial(key, scripts, options));
          }
        }

        if (parallel.length === 0) {
          if (!options.raw) {
            throw new Error(`no scripts found: ${pattern}`);
          }
          serial.push([this.createRawScript(pattern, options)]);
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

      const suffixes = props.scriptSuffixes || [];
      const cliOptions = {};
      switch (this.opts.value) {
        case 'serial':
          cliOptions.serial = true;
          break;
        case 'raw':
          cliOptions.raw = true;
          break;
        default:
          // noop
      }
      const actualOptions = { suffixes, ...this.opts, ...cliOptions };

      const task = this.constructor.parse(sentence, scripts, actualOptions);
      this.setProps({ task });
    });
  }
}
