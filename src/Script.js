import { parse, quote } from 'shell-quote';
import which from 'which';
import { relative as relativePaths } from 'path';

export default class Script {
  constructor(name, raw, options = {}, meta = {}) {
    this.name = name;
    this.raw = raw;
    this.meta = meta;
    this.parsed = parse(raw);
    this.canSpawn = this.parsed.reduce((can, op) => can && typeof op === 'string', true);

    if (options.require) {
      this.transformRawScript(options.require);
    }
  }

  transformRawScript(moduleName) {
    const bin = this.parsed[0];
    try {
      // FIXME: failure process.cwd() in package.json lower directory in abigail-v1.8.0
      const resolvedBin = relativePaths(process.cwd(), which.sync(bin));
      const isNodeCLI = resolvedBin.split('/').slice(-2, -1)[0] === '.bin';
      if (isNodeCLI) {
        this.parsed = ['node', '--require', moduleName, resolvedBin].concat(this.parsed.slice(1));
        this.raw = quote(this.parsed);
      }
    } catch (error) {
      // ignore
    }
  }
}
