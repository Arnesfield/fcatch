/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expect } from 'chai';
import { fcatch, Result } from '../src/index.js';

function expectResult<T, E>(result: Result<T, E>, ok: boolean, value?: T | E) {
  expect(result).to.be.an('array').that.has.length(2);
  expect(result).to.have.property('ok').that.is.a('boolean').that.equals(ok);
  expect(result).to.have.property('value');
  expect(result).to.have.property('error');
  // test values
  if (ok) {
    if (typeof value !== 'undefined') {
      expect(result.value).to.equal(value);
      expect(result[1]).to.equal(value);
    }
    expect(result.error).to.be.null;
    expect(result[0]).to.be.null;
  } else {
    expect(result.value).to.be.null;
    expect(result[1]).to.be.null;
    if (typeof value !== 'undefined') {
      expect(result.error).to.equal(value);
      expect(result[0]).to.equal(value);
    }
  }
}

describe('fcatch', () => {
  it('should be a function', () => {
    expect(fcatch).to.be.a('function');
  });

  it('should return an object (Catch)', () => {
    const fc = fcatch();
    expect(fc).to.be.an('object');
    expect(fc).to.have.property('sync').that.is.a('function');
    expect(fc).to.have.property('async').that.is.a('function');
    expect(fc).to.have.property('resolve').that.is.a('function');
  });

  it('should accept a map error function', () => {
    fcatch<Error>(error => error as Error);
  });

  it('sync call should return a function', () => {
    expect(fcatch().sync(() => {})).to.be.a('function');
  });

  it('async call should return a function', () => {
    expect(fcatch().async(() => {})).to.be.a('function');
  });

  function testResultObject(result: Result<number>) {
    expectResult(result, true, 3);
  }

  function testCatchErrors(result: Result<number, Error>, error: Error) {
    expectResult(result, false, error);
  }

  function testDiscriminatedUnions(result: Result<number, Error>) {
    if (result.ok) {
      expect(result.value.toString()).to.equal('3');
      expect(result[1].toString()).to.equal('3');
      // @ts-expect-error
      expect(result.error?.message).to.be.undefined;
      // @ts-expect-error
      expect(result[0]?.message).to.be.undefined;
    } else {
      // @ts-expect-error
      expect(result.value?.toString()).to.be.undefined;
      // @ts-expect-error
      expect(result[1]?.toString()).to.be.undefined;
      expect(result.error.message).to.be.a('string');
      expect(result[0].message).to.be.a('string');
    }

    const [error, value] = result;
    if (error) {
      // @ts-expect-error
      expect(result.ok === true).to.be.false;
      // @ts-expect-error
      expect(value?.toString()).to.be.undefined;
      // @ts-expect-error
      expect(result.value?.toString()).to.be.undefined;
      expect(error.message).to.be.a('string');
      expect(result.error.message).to.be.a('string');
    } else {
      // @ts-expect-error
      expect(result.ok === false).to.be.false;
      expect(value.toString()).to.equal('3');
      expect(result.value.toString()).to.equal('3');
      // @ts-expect-error
      expect(error?.message).to.be.undefined;
      // @ts-expect-error
      expect(result.error?.message).to.be.undefined;
    }
  }

  function testMapCaughtErrors(
    result: Result<number, string>,
    message: string
  ) {
    expectResult(result, false);
    expect(result.error).to.be.a('string').that.equals(message);
    expect(result[0]).to.be.a('string').that.equals(message);
  }

  function delay(ms?: number) {
    return new Promise<number>((resolve, reject) => {
      setImmediate(() => {
        if (typeof ms === 'number') {
          reject(new Error('Not implemented.'));
        } else {
          resolve(0);
        }
      });
    });
  }

  interface ThisArg {
    value: string;
    greet(this: this, greet: string): string;
  }
  const thisArg: ThisArg = {
    value: 'World',
    greet(greet: string) {
      return `${greet} ${this.value}!`;
    }
  };

  describe('sync', () => {
    it('should return a Result object', () => {
      const result = fcatch().sync((n: number, m: number) => n + m)(1, 2);
      testResultObject(result);
    });

    it('should catch errors', () => {
      const error = new Error('error');
      const result = fcatch<Error>().sync((n: number) => {
        if (n > 0) {
          throw error;
        }
        return n;
      })(1);
      testCatchErrors(result, error);
    });

    it('should handle discriminated unions', () => {
      const result = fcatch<Error>().sync((n: number) => {
        if (n > 0) {
          throw new Error('error');
        }
        return n;
      })(1);
      testDiscriminatedUnions(result);
    });

    it('should map caught errors', () => {
      const message = 'error';
      const result = fcatch(error => {
        return error instanceof Error ? error.message : 'default';
      }).sync((n: number) => {
        if (n > 0) {
          throw new Error(message);
        }
        return n;
      })(1);
      testMapCaughtErrors(result, message);
    });

    it('should handle different return types', () => {
      const fc1: Result<number> = fcatch().sync(() => 1)();
      expect(fc1.value).to.equal(1);
      const fc2: Result<string, Error> = fcatch<Error>().sync(() => '1')();
      expect(fc2.value).to.equal('1');
      const fc3: Result<Result<string, Error>> = fcatch().sync(() => fc2)();
      expect(fc3.value).to.equal(fc2);
    });

    it('should handle `this` keyword', () => {
      const greet = fcatch().sync(thisArg.greet);
      // @ts-expect-error
      const errResult = greet('Hello');
      expectResult(errResult, false);
      expect(errResult.error).to.be.an.instanceOf(TypeError);
      const result = greet.call(thisArg, 'Hello');
      expectResult(result, true, 'Hello World!');
      const result2 = greet.call(
        { value: 'FCatch', greet: thisArg.greet },
        'Hi'
      );
      expectResult(result2, true, 'Hi FCatch!');
    });
  });

  describe('async', () => {
    it('should return a Promise that resolves to a Result object', async () => {
      const promise = fcatch().async(async (n: number, m: number) => {
        await delay();
        return n + m;
      })(1, 2);
      expect(promise).to.be.a('promise');
      testResultObject(await promise);
    });

    it('should catch errors', async () => {
      const error = new Error();
      const result = await fcatch<Error>().async(async (n: number) => {
        await delay();
        if (n > 0) {
          throw error;
        }
        return n;
      })(1);
      testCatchErrors(result, error);
    });

    it('should handle discriminated unions', async () => {
      const result = await fcatch<Error>().async(async (n: number) => {
        await delay();
        if (n > 0) {
          throw new Error('error');
        }
        return n;
      })(1);
      testDiscriminatedUnions(result);
    });

    it('should map caught errors', async () => {
      const message = 'error';
      const result = await fcatch(error => {
        return error instanceof Error ? error.message : 'default';
      }).async(async (n: number) => {
        await delay();
        if (n > 0) {
          throw new Error(message);
        }
        return n;
      })(1);
      testMapCaughtErrors(result, message);
    });

    it('should handle different return types', async () => {
      const fc1: Result<number> = await fcatch().async(() => 1)();
      expect(fc1.value).to.equal(1);
      const fc2: Result<string, Error> = await fcatch<Error>().async(
        async () => {
          await delay();
          return '1';
        }
      )();
      expect(fc2.value).to.equal('1');
      const fc3: Result<Result<string, Error>> = await fcatch().async(
        async () => fc2
      )();
      expect(fc3.value).to.equal(fc2);
    });

    it('should handle `this` keyword', async () => {
      const greet = fcatch().async(thisArg.greet);
      // @ts-expect-error
      const errResult = await greet('Hello');
      expectResult(errResult, false);
      expect(errResult.error).to.be.an.instanceOf(TypeError);
      const result = await greet.call(thisArg, 'Hello');
      expectResult(result, true, 'Hello World!');
      const result2 = await greet.call(
        { value: 'FCatch', greet: thisArg.greet },
        'Hi'
      );
      expectResult(result2, true, 'Hi FCatch!');
    });
  });

  describe('resolve', () => {
    it('should handle resolved promise', async () => {
      const promise = fcatch().resolve(delay());
      expect(promise).to.be.a('promise');
      const result = await promise;
      expectResult(result, true, 0);
    });

    it('should handle rejected promise', async () => {
      const promise = fcatch<Error>().resolve(delay(1));
      expect(promise).to.be.a('promise');
      const result = await promise;
      expectResult(result, false);
      expect(result.error)
        .to.be.an('error')
        .that.has.a.property('message')
        .that.equals('Not implemented.');
    });

    it('should map caught errors', async () => {
      const promise = fcatch(error => {
        return error instanceof Error ? error.message : 'error';
      }).resolve(delay(1));
      expect(promise).to.be.a('promise');
      const result = await promise;
      expectResult(result, false);
      expect(result.error).to.be.a('string').that.equals('Not implemented.');
    });
  });
});
