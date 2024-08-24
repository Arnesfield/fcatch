/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expect } from 'chai';
import { Catch, f, FCatch, Result } from '../src/index.js';

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

function expectCatch(value: Catch) {
  const props = ['run', 'runAsync', 'resolve', 'wrap', 'wrapAsync'];
  for (const prop of props) {
    expect(value).to.have.property(prop).that.is.a('function');
  }
}

describe('f', () => {
  it('should be a function', () => {
    expect(f).to.be.a('function');
  });

  it('should contain Catch properties', () => {
    expect(f).to.have.property('catch').that.is.a('function');
    expectCatch(f);
  });

  it('should return itself', () => {
    expect(f).to.equal(f);
  });

  it('should accept error generic type', () => {
    const a: FCatch<unknown> = f;
    const b: FCatch<Error> = f<Error>();
    expect(a).to.equal(b); // useless check
  });

  it('should return a function for wrap call', () => {
    expect(f.wrap(() => {})).to.be.a('function');
  });

  it('should return a function for wrapAsync call', () => {
    expect(f.wrapAsync(() => {})).to.be.a('function');
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

  class Greeter {
    constructor(public value = 'Hello') {}
    greet(this: this, name: string) {
      return `${this.value} ${name}!`;
    }
    setGreetingTo<T extends Greeter>(this: this, greeter: T) {
      greeter.value = this.value;
      return greeter;
    }
  }
  class AsyncGreeter extends Greeter {
    async greetAsync(this: this, name: string) {
      await delay();
      return this.greet(name);
    }
  }
  const greeter = new Greeter();

  describe('catch', () => {
    it('should accept a map error function', () => {
      const fc: Catch<Error> = f.catch(error => error as Error);
      expectCatch(fc);
    });
  });

  describe('run', () => {
    it('should run and return a Result object', () => {
      const result = f.run(() => 1);
      expectResult(result, true, 1);
      const result2 = f.run((...args) => args.length);
      expectResult(result2, true, 0);
    });

    it('should handle `this` and args', () => {
      // @ts-expect-error
      const errResult = f.run(greeter.greet);
      expectResult(errResult, false);
      expect(errResult.error).to.be.an.instanceOf(TypeError);

      const result = f.run(greeter.greet, new Greeter('Hi'), 'fcatch');
      expectResult(result, true, 'Hi fcatch!');

      function madGreet(this: Greeter, name: string) {
        return this.greet(name).toUpperCase();
      }
      const result2 = f.run(madGreet, greeter, 'World');
      expectResult(result2, true, 'HELLO WORLD!');
    });

    it('should map caught errors', () => {
      const result = f
        .catch(error => {
          return error instanceof Error ? error.message : 'default';
        })
        .run(() => {
          throw new Error('error');
        });
      expectResult(result, false);
      expect(result.error).to.be.a('string').that.equals('error');
    });
  });

  describe('runAsync', () => {
    it('should run and return a Promise that resolves to a Result object', async () => {
      const promise = f.runAsync(() => 1);
      expect(promise).to.be.a('promise');
      expectResult(await promise, true, 1);
      const result = await f.runAsync((...args) => args.length);
      expectResult(result, true, 0);
    });

    it('should handle `this` and args', async () => {
      const asyncGreeter = new AsyncGreeter();
      // @ts-expect-error
      const errResult = await f.runAsync(asyncGreeter.greetAsync);
      expectResult(errResult, false);
      expect(errResult.error).to.be.an.instanceOf(TypeError);

      const result = await f.runAsync(
        asyncGreeter.greetAsync,
        new AsyncGreeter('Hi'),
        'fcatch'
      );
      expectResult(result, true, 'Hi fcatch!');

      async function madGreetAsync(this: AsyncGreeter, name: string) {
        return (await this.greetAsync(name)).toUpperCase();
      }
      const result2 = await f.runAsync(madGreetAsync, asyncGreeter, 'World');
      expectResult(result2, true, 'HELLO WORLD!');
    });

    it('should map caught errors', async () => {
      const promise = f
        .catch(error => {
          return error instanceof Error ? error.message : 'default';
        })
        .runAsync(() => {
          throw new Error('error');
        });
      expect(promise).to.be.a('promise');
      const result = await promise;
      expectResult(result, false);
      expect(result.error).to.be.a('string').that.equals('error');
    });
  });

  describe('resolve', () => {
    it('should handle resolved promise', async () => {
      const promise = f.resolve(delay());
      expect(promise).to.be.a('promise');
      const result = await promise;
      expectResult(result, true, 0);
    });

    it('should handle rejected promise', async () => {
      const promise = f<Error>().resolve(delay(1));
      expect(promise).to.be.a('promise');
      const result = await promise;
      expectResult(result, false);
      expect(result.error)
        .to.be.an('error')
        .that.has.a.property('message')
        .that.equals('Not implemented.');
    });

    it('should map caught errors', async () => {
      const promise = f
        .catch(error => (error instanceof Error ? error.message : 'error'))
        .resolve(delay(1));
      expect(promise).to.be.a('promise');
      const result = await promise;
      expectResult(result, false);
      expect(result.error).to.be.a('string').that.equals('Not implemented.');
    });
  });

  describe('wrap', () => {
    it('should return a Result object', () => {
      const result = f.wrap((n: number, m: number) => n + m)(1, 2);
      testResultObject(result);
    });

    it('should catch errors', () => {
      const error = new Error('error');
      const result = f<Error>().wrap((n: number) => {
        if (n > 0) {
          throw error;
        }
        return n;
      })(1);
      testCatchErrors(result, error);
    });

    it('should handle discriminated unions', () => {
      const result = f<Error>().wrap((n: number) => {
        if (n > 0) {
          throw new Error('error');
        }
        return n;
      })(1);
      testDiscriminatedUnions(result);
    });

    it('should map caught errors', () => {
      const message = 'error';
      const result = f
        .catch(error => (error instanceof Error ? error.message : 'default'))
        .wrap((n: number) => {
          if (n > 0) {
            throw new Error(message);
          }
          return n;
        })(1);
      testMapCaughtErrors(result, message);
    });

    it('should handle different return types', () => {
      const fc1: Result<number> = f.wrap(() => 1)();
      expect(fc1.value).to.equal(1);
      const fc2: Result<string, Error> = f<Error>().wrap(() => '1')();
      expect(fc2.value).to.equal('1');
      const fc3: Result<Result<string, Error>> = f.wrap(() => fc2)();
      expect(fc3.value).to.equal(fc2);
    });

    it('should handle `this` keyword', () => {
      const greet = f.wrap(greeter.greet);
      // @ts-expect-error
      const errResult = greet('World');
      expectResult(errResult, false);
      expect(errResult.error).to.be.an.instanceOf(TypeError);
      const result = greet.call(greeter, 'World');
      expectResult(result, true, 'Hello World!');
      const result2 = greet.call(new Greeter('Hi'), 'fcatch');
      expectResult(result2, true, 'Hi fcatch!');
    });

    it('should not bind `this` to original function', () => {
      const setGreetingTo = f
        .wrap(greeter.setGreetingTo)
        .bind(new Greeter('Hi'));
      const result = setGreetingTo(new Greeter('Hey'));
      expectResult(result, true);
      if (!result.ok) {
        throw new Error('Expected result.ok to be true.');
      }
      expect(result.value.value).to.equal('Hi');

      const helloGreeter = greeter.setGreetingTo(new Greeter('Hey'));
      expect(helloGreeter.value).to.equal('Hello');
    });

    it('should allow explicit type for function generics', async () => {
      // @ts-expect-error
      const setGreetingTo: <T extends Greeter>(greeter: T) => Result<T, Error> =
        f<Error>().wrap(greeter.setGreetingTo).bind(new Greeter('Hey'));

      const asyncGreeter = new AsyncGreeter();
      const result = setGreetingTo(asyncGreeter);
      expectResult(result, true, asyncGreeter);
      if (!result.ok) {
        throw new Error('Expected result.ok to be true.');
      }

      const promise = result.value.greetAsync('World');
      expect(promise).to.be.a('promise');
      expect(await promise).to.equal('Hey World!');
    });
  });

  describe('wrapAsync', () => {
    it('should return a Promise that resolves to a Result object', async () => {
      const promise = f.wrapAsync(async (n: number, m: number) => {
        await delay();
        return n + m;
      })(1, 2);
      expect(promise).to.be.a('promise');
      testResultObject(await promise);
    });

    it('should catch errors', async () => {
      const error = new Error();
      const result = await f<Error>().wrapAsync(async (n: number) => {
        await delay();
        if (n > 0) {
          throw error;
        }
        return n;
      })(1);
      testCatchErrors(result, error);
    });

    it('should handle discriminated unions', async () => {
      const result = await f<Error>().wrapAsync(async (n: number) => {
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
      const result = await f
        .catch(error => (error instanceof Error ? error.message : 'default'))
        .wrapAsync(async (n: number) => {
          await delay();
          if (n > 0) {
            throw new Error(message);
          }
          return n;
        })(1);
      testMapCaughtErrors(result, message);
    });

    it('should handle different return types', async () => {
      const fc1: Result<number> = await f.wrapAsync(() => 1)();
      expect(fc1.value).to.equal(1);
      const fc2: Result<string, Error> = await f<Error>().wrapAsync(
        async () => {
          await delay();
          return '1';
        }
      )();
      expect(fc2.value).to.equal('1');
      const fc3: Result<Result<string, Error>> = await f.wrapAsync(
        async () => fc2
      )();
      expect(fc3.value).to.equal(fc2);
    });

    it('should handle `this` keyword', async () => {
      const greet = f.wrapAsync(greeter.greet);
      // @ts-expect-error
      const errResult = await greet('World');
      expectResult(errResult, false);
      expect(errResult.error).to.be.an.instanceOf(TypeError);
      const result = await greet.call(greeter, 'World');
      expectResult(result, true, 'Hello World!');
      const result2 = await greet.call(new Greeter('Hi'), 'fcatch');
      expectResult(result2, true, 'Hi fcatch!');
    });

    it('should not bind `this` to original function', async () => {
      const setGreetingTo = f
        .wrapAsync(greeter.setGreetingTo)
        .bind(new Greeter('Hi'));

      const promise = setGreetingTo(new Greeter('Hey'));
      expect(promise).to.be.a('promise');
      const result = await promise;
      expectResult(result, true);
      if (!result.ok) {
        throw new Error('Expected result.ok to be true.');
      }
      expect(result.value.value).to.equal('Hi');

      const helloGreeter = greeter.setGreetingTo(new Greeter('Hey'));
      expect(helloGreeter.value).to.equal('Hello');
    });

    it('should allow explicit type for function generics', async () => {
      // @ts-expect-error
      const setGreetingTo: <T extends Greeter>(
        greeter: T
      ) => Promise<Result<T, Error>> = f<Error>()
        .wrapAsync(greeter.setGreetingTo)
        .bind(new Greeter('Hey'));

      // make sure normal call is not bound
      const heyGreeter = greeter.setGreetingTo(new Greeter('Hey'));
      expect(heyGreeter.value).to.equal('Hello');

      const asyncGreeter = new AsyncGreeter();
      const promise = setGreetingTo(asyncGreeter);
      expect(promise).to.be.a('promise');
      const result = await promise;
      expectResult(result, true, asyncGreeter);
      if (!result.ok) {
        throw new Error('Expected result.ok to be true.');
      }

      const greetPromise = result.value.greetAsync('World');
      expect(greetPromise).to.be.a('promise');
      expect(await greetPromise).to.equal('Hey World!');
    });
  });
});
