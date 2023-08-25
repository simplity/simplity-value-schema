import { createValidationFn } from './fn';
import { testSets } from './fn.data';
import { Value } from './types';

Object.entries(testSets).forEach(([valueType, cases]) => {
  describe(`Validating ${valueType}`, () => {
    for (const c of cases) {
      const fn = createValidationFn(c.schema);
      describe(`${c.description}`, () => {
        for (const t of c.okTests) {
          const res = fn(t.value as Value);
          const parsedValue =
            t.parsedValue === undefined ? (t.value as Value) : t.parsedValue;
          test(`${quoteIt(t.value)} should be valid. `, () => {
            expect(res.error).toBeUndefined();
            expect(res.value).toBe(parsedValue);
          });
        }

        for (const t of c.notOkTests) {
          test(`${quoteIt(t.value)} should be invalid`, () => {
            const res = fn(t.value);
            expect(res.value).toBeUndefined();
            const error = res.error;
            expect(error).toBeDefined();
            expect(error?.code).toBe(t.errorId);
            expect(error?.params).toStrictEqual(t.params);
          });
        }
      });
    }
  });
});

function quoteIt(value: any) {
  const str = '' + value;
  if (typeof value === 'string') {
    return '"' + str + '"';
  }
  return str;
}
