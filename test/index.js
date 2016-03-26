// dependencies
import AsyncEmitter from 'carrack';
import flattenDeep from 'lodash.flattendeep';
import assert from 'power-assert';

// target
import Parse from '../src';
import Script from '../src/Script';

// fixture
import { scripts } from './fixtures/package.json';

// specs
describe('Parse', () => {
  describe('plugin lifecycle', () => {
    it('waiting to `parse`, should be immediately obtained the task using getProps', () => {
      const emitter = new AsyncEmitter;
      const parse = new Parse(emitter);

      return emitter.emit('parse', ['test1'], scripts).then(() => {
        const task = parse.getProps().task;
        assert(task[0][0][0].main.name === 'test1');
      });
    });
  });

  describe('.normalize', () => {
    it('comma should be converted to one of the command linked', () => {
      const expected = 'test1,test2';

      let normalize;
      normalize = Parse.normalize(['test1,', 'test2']).join(' ');
      assert(normalize === expected);
      normalize = Parse.normalize(['test1', ',test2']).join(' ');
      assert(normalize === expected);
      normalize = Parse.normalize(['test1', ',', 'test2']).join(' ');
      assert(normalize === expected);
      normalize = Parse.normalize(['test1,test2', '']).join(' ');
      assert(normalize === expected);
      normalize = Parse.normalize(['test1,test2', ',', ',']).join(' ');
      assert(normalize === expected);

      // do not change a quoted shell script eg "test , test"
      normalize = Parse.normalize(['test , test']).join(' ');
      assert(normalize !== expected);
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
      const task = Parse.parse(['test1'], scripts);

      assert(flattenDeep(task).length === 1);
      assert(task[0][0][0].main.name === 'test1');
    });

    it('if script is not found, should throw the error ', () => {
      let error = {};
      try {
        Parse.parse(['nothing'], scripts);
      } catch (e) {
        error = e;
      }
      assert(error.message === 'no scripts found: nothing');
    });

    it('comma should be pushed in the 2d of the array', () => {
      const task = Parse.parse(['test1', ',', 'test2'], scripts);

      assert(flattenDeep(task).length === 2);
      assert(task[0][0][0].main.name === 'test1');
      assert(task[0][1][0].main.name === 'test2');
    });

    it('pre, post should be defined in the same name field', () => {
      const task = Parse.parse(['other'], scripts);

      assert(flattenDeep(task).length === 1);
      assert(task[0][0][0].pre.name === 'preother');
      assert(task[0][0][0].main.name === 'other');
      assert(task[0][0][0].post.name === 'postother');
    });

    it('comma should be pushed in the 2d of the array', () => {
      const task = Parse.parse(['test1', ',', 'test2'], scripts);

      assert(flattenDeep(task).length === 2);
      assert(task[0][0][0].main.name === 'test1');
      assert(task[0][1][0].main.name === 'test2');
    });

    it('should processed in parallel unless adjacent to comma(in 1d of the array)', () => {
      let task;

      task = Parse.parse(['test*', 'test1', ',', 'test2'], scripts);
      assert(task[0][0][0].main.name === 'test1');
      assert(task[0][0][1].main.name === 'test2');
      assert(task[1][0][0].main.name === 'test1');
      assert(task[1][1][0].main.name === 'test2');

      task = Parse.parse([',other', 'test1', ',', 'test2'], scripts);
      assert(task[0][0][0].main.name === 'other');
      assert(task[0][0][0].pre.name === 'preother');
      assert(task[0][0][0].post.name === 'postother');
      assert(task[1][0][0].main.name === 'test1');
      assert(task[1][1][0].main.name === 'test2');
    });

    xit('TODO: shell script is not supported', () => {
      Parse.parse(['echo "test1 , test2"'], scripts);
    });
  });
});
