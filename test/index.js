// dependencies
import AsyncEmitter from 'carrack';
import flattenDeep from 'lodash.flattendeep';
import assert from 'power-assert';
import { throws } from 'assert-exception';

// target
import Parse from '../src';
import Script from '../src/Script';

// fixture
import { scripts } from './fixtures/package.json';

// specs
describe('Parse', () => {
  describe('plugin lifecycle', () => {
    it('if fired `parse`, should be get the globs and scripts, and set the analysis results as the task', () => {
      const emitter = new AsyncEmitter;
      const parse = new Parse(emitter);

      parse.setProps({
        sentence: [['test1']],
        json: {
          data: {
            scripts,
          },
        },
      });

      return emitter.emit('initialized')
      .then(() => emitter.emit('parse'))
      .then(() => {
        const task = parse.getProps().task;
        assert(task[0][0][0].main.name === 'test1');
      });
    });

    it('if opts.value is "serial", should process the glob in serial', () => {
      const emitter = new AsyncEmitter;
      const parse = new Parse(emitter, 'serial');

      parse.setProps({
        sentence: [['test*']],
        json: {
          data: {
            scripts,
          },
        },
      });

      return emitter.emit('initialized')
      .then(() => emitter.emit('parse'))
      .then(() => {
        const task = parse.getProps().task;
        assert(task[0][0][0].main.name === 'test1');
        assert(task[0][1][0].main.name === 'test2');
      });
    });
  });

  describe('.createSerial', () => {
    it('should return the match to script in the Script instance to the `main`', () => {
      const { main } = Parse.createSerial('test1', scripts);
      assert(main instanceof Script);
      assert(main.name === 'test1');
    });

    it('if `pre` / `post` exists, it should be returned to the same name of the field', () => {
      const { main, pre, post } = Parse.createSerial('other', scripts);
      assert(main instanceof Script);
      assert(main.name === 'other');
      assert(pre instanceof Script);
      assert(pre.name === 'preother');
      assert(post instanceof Script);
      assert(post.name === 'postother');
    });
  });

  describe('.parse', () => {
    it('should return the script to match the name in a 3d array', () => {
      const task = Parse.parse([['test1']], scripts);

      assert(flattenDeep(task).length === 1);
      assert(task[0][0][0].main.name === 'test1');
    });

    it('if script is not found, should throw the error ', () => {
      assert(throws(() => {
        Parse.parse([['nothing']], scripts);
      }).message === 'no scripts found: nothing');
    });

    it('pre, post should be defined in the same name field', () => {
      const task = Parse.parse([['other']], scripts);

      assert(flattenDeep(task).length === 1);
      assert(task[0][0][0].pre.name === 'preother');
      assert(task[0][0][0].main.name === 'other');
      assert(task[0][0][0].post.name === 'postother');
    });

    it('should processed in parallel unless adjacent to comma(in 1d of the array)', () => {
      let task;

      task = Parse.parse([['test*'], ['test1', 'test2']], scripts);
      assert(task[0][0][0].main.name === 'test1');
      assert(task[0][0][1].main.name === 'test2');
      assert(task[1][0][0].main.name === 'test1');
      assert(task[1][1][0].main.name === 'test2');

      task = Parse.parse([['other'], ['test1', 'test2']], scripts);
      assert(task[0][0][0].main.name === 'other');
      assert(task[0][0][0].pre.name === 'preother');
      assert(task[0][0][0].post.name === 'postother');
      assert(task[1][0][0].main.name === 'test1');
      assert(task[1][1][0].main.name === 'test2');
    });

    it('if options.serial is true, should process the glob in serial', () => {
      const task = Parse.parse([['test*'], ['test1', 'test2']], scripts, { serial: true });
      assert(task[0][0][0].main.name === 'test1');
      assert(task[0][1][0].main.name === 'test2');
      assert(task[1][0][0].main.name === 'test1');
      assert(task[1][1][0].main.name === 'test2');
    });

    xit('TODO: shell script is not supported', () => {
      Parse.parse([['echo "test1 , test2"']], scripts);
    });
  });
});
