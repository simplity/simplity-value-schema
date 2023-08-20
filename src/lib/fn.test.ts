import { Value, ValueSchema, ValueType, GenericErrorCode } from './types';
import { createValidationFn } from './fn';
import { describe, expect, test } from '@jest/globals';

type TestSets = { [valueType in ValueType]: TestCases[] };
type OkTest = {
  value: Value;
  parsedValue: Value;
};
type NotOkTest = {
  value: Value | undefined;
  errorId: string;
  params?: string[];
};

type TestCases = {
  schema: ValueSchema;
  okTests: OkTest[];
  notOkTests: NotOkTest[];
};

const testSets: TestSets = {
  boolean: [
    {
      schema: {
        valueType: ValueType.Boolean,
        maxLength: 10,
      },
      notOkTests: [
        {
          value: undefined,
          errorId: GenericErrorCode.InvalidBoolean,
        },
        {
          value: -1,
          errorId: GenericErrorCode.InvalidBoolean,
        },
        {
          value: 100,
          errorId: GenericErrorCode.InvalidBoolean,
        },
        {
          value: 't rue',
          errorId: GenericErrorCode.InvalidBoolean,
        },
        {
          value: ' true',
          errorId: GenericErrorCode.InvalidBoolean,
        },
        {
          value: 'a long text that is certainly not a boolean',
          errorId: GenericErrorCode.InvalidBoolean,
        },
      ],
      okTests: [
        { value: true, parsedValue: true },
        {
          value: false,
          parsedValue: false,
        },
        {
          value: 'true',
          parsedValue: true,
        },
        {
          value: 'false',
          parsedValue: false,
        },
        {
          value: '1',
          parsedValue: true,
        },
        {
          value: '0',
          parsedValue: false,
        },
        {
          value: 1,
          parsedValue: true,
        },
        {
          value: '0',
          parsedValue: false,
        },
      ],
    },
  ],
  text: [],
  integer: [],
  decimal: [],
  date: [],
  timestamp: [],
  array: [],
  ds: [],
};

Object.entries(testSets).forEach(([valueType, cases]) => {
  describe(`Validating ${valueType}`, () => {
    for (const c of cases) {
      const validationFn = createValidationFn(c.schema);

      for (const t of c.okTests) {
        let desc =
          getValueText(t.value) + ' should be valid and value should be ';
        if (
          valueType === ValueType.Integer ||
          valueType === ValueType.Decimal ||
          valueType === ValueType.Boolean
        ) {
          desc += t.parsedValue;
        } else {
          desc += "'" + t.parsedValue + "'";
        }

        test(desc, () => {
          const res = validationFn(t.value as Value);
          expect(res.value).toBe(t.parsedValue);
        });
      }

      for (const t of c.notOkTests) {
        const desc = getValueText(t.value) + ' is an invalid ' + valueType;
        test(desc, () => {
          const res = validationFn(t.value as Value); //we are forcing a wrong type 'undefined' for testing
          expect(res.errorId).toBe(t.errorId);
          expect(res.params).toBe(t.params);
        });
      }
    }
  });
});

function getValueText(value: Value | undefined) {
  if (value === undefined) {
    return 'undefined';
  }
  let str = typeof value;
  if (str === 'string') {
    return str + " '" + value + "'";
  }
  return str + ' ' + value.toString();
}
