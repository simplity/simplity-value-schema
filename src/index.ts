export function createValidationFn(schema: ValueSchema): ValidationFn {
  let errorId = schema.errorId;
  let textErrorId: string = errorId || GenericErrorCode.InvalidValue;
  let minLength = schema.minLength || 1;
  let maxLength = schema.maxLength;
  let regex: string | undefined = schema.regex;
  let regexp: RegExp | undefined = undefined;
  let minValue = Number.MIN_SAFE_INTEGER;
  let maxValue = Number.MAX_SAFE_INTEGER;

  switch (schema.valueType) {
    case ValueType.Text:
      if (regex) {
        regexp = new RegExp(regex);
      }
      return createTextFn({ textErrorId, maxLength, minLength, regexp });

    case ValueType.Boolean:
      return createBooleanFn({
        textErrorId: GenericErrorCode.InvalidBoolean,
        maxLength: 5,
        minLength: 1,
        regexp: BOOLEAN_REGEX,
      });

    case ValueType.Integer:
    case ValueType.Decimal:
      if (schema.minValue !== undefined) {
        minValue = schema.minValue;
      }
      if (schema.maxValue !== undefined) {
        maxValue = schema.maxValue;
      }

      return createNumberFn({
        textErrorId: GenericErrorCode.InvalidNumber,
        errorId: errorId || GenericErrorCode.InvalidNumber,
        factor:
          schema.nbrDecimalPlaces === undefined
            ? 1
            : 10 ** schema.nbrDecimalPlaces,
        maxLength,
        minLength,
        maxValue,
        minValue,
        regexp: NUMBER_REGEX,
      });

    case ValueType.Date:
      if (schema.minValue === undefined) {
        minValue = MAX_DATE_DIFF;
      } else {
        minValue = schema.minValue;
      }
      if (schema.maxValue === undefined) {
        maxValue = MAX_DATE_DIFF;
      } else {
        maxValue = schema.maxValue;
      }
      return createDateFn({
        textErrorId: GenericErrorCode.InvalidDate,
        errorId: errorId || GenericErrorCode.InvalidNumber,
        maxLength: 10,
        minLength: 1,
        maxValue,
        minValue,
        regexp: DATE_REGEX,
      });

    case ValueType.Timestamp:
      return createTextFn({
        textErrorId: GenericErrorCode.InvalidValue,
        maxLength: 25,
        minLength: 1,
        regexp: TIME_STAMP_REGEX,
      });

    case ValueType.Ds:
    case ValueType.Array:
      return createBooleanFn({
        textErrorId: GenericErrorCode.InvalidValue,
        maxLength: 10000,
        minLength: 1,
        regexp: undefined,
      });
  }
}

/**
 * createXxxFn functions are  designed to minimize the scope of teh closure around the returned function
 */
function createTextFn(schema: TextSchema): ValidationFn {
  return (value: Value) => {
    return validateString(schema, value);
  };
}

function createNumberFn(schema: NumberSchema): ValidationFn {
  return (value: Value) => {
    return validateNumber(schema, value);
  };
}

function createDateFn(schema: DateSchema): ValidationFn {
  return (value: Value) => {
    return validateDate(schema, value);
  };
}

function createBooleanFn(schema: TextSchema): ValidationFn {
  return (value: Value) => {
    return validateBoolean(schema, value);
  };
}

/**
 * a function that validates a value and returns
 */
export type ValidationFn = (value: Value) => ValidationResult;

/**
 * validation result
 */
export type ValidationResult = {
  /**
   * parsed value in the right type. e.g value = 9 if input was '9.0123' for an integer
   * undefined in case of error
   */
  value?: Value;
  /**
   * id of the error message in case of error. undefined if all ok
   */
  errorId?: string;
  /**
   * values for any parameters, in case the message is parameterized. Like min-length
   */
  params?: string[];
};

/**
 * we have considered date and timestamp in text form as primitive values
 */
export enum ValueType {
  Text = 'text',
  Integer = 'integer',
  Decimal = 'decimal',
  Boolean = 'boolean',
  Date = 'date',
  Timestamp = 'timestamp',
  Ds = 'ds',
  Array = 'array',
}

/**
 * all primitive values are represented with these three primitives
 * Date is a string like "yyyy-mm-dd", and time stamp is a string like "yyyy-mm-ddThh:MM:ss.fffZ"
 */
export type PrimitiveValue = string | number | boolean;

/**
 * generic data-structure that is used to group a set of primitive values in a structured way
 */
export type DataStructure = {
  [key: string]: Value;
};

export type Value =
  | PrimitiveValue
  | Array<PrimitiveValue>
  | DataStructure
  | Array<DataStructure>;

/**
 * all possible attributes of a data type. We have kept all values as primitives.
 * this is to ensure that a simple json object can be created to conform to this .
 * This is meant to be used by a code-generator.
 */
export type ValueSchema = {
  errorId?: string;
  valueType: ValueType;
  minLength?: number;
  maxLength: number;
  regex?: string;
  minValue?: number;
  maxValue?: number;
  nbrDecimalPlaces?: number;
  minRows?: number;
  maxRows?: number;
};

export enum GenericErrorCode {
  InvalidValue = '_invalidValue',
  InvalidBoolean = '_invalidBoolean',
  InvalidNumber = '_invalidNumber',
  InvalidDate = '_invalidDate',
  MinLength = '_minLength',
  MaxLength = '_maxLength',
  MinValue = '_minValue',
  MaxValue = '_maxValue',
}
/**
 * generic error codes hard coded by this utility.
 * type defined and exported for a diligent programmer to get the valid values while coding
 */
export type HardCodedErrorId =
  | '_invalidValue'
  | '_invalidBoolean'
  | '_invalidNumber'
  | '_invalidDate'
  | '_minLength'
  | '_maxLength'
  | '_minValue'
  | '_maxValue';

type TextSchema = {
  textErrorId: string;
  minLength: number;
  maxLength: number;
  regexp?: RegExp;
};

type DateSchema = TextSchema & {
  minValue: number;
  maxValue: number;
  errorId: string;
};

type NumberSchema = DateSchema & {
  factor: number;
};

function validateString(schema: TextSchema, value: Value): ValidationResult {
  if (value === undefined) {
    return {
      errorId: '_invalidValue' as HardCodedErrorId,
    };
  }

  const s = value.toString();
  const len = s.length;
  if (len < schema.minLength!) {
    return {
      errorId: '_minLength' as HardCodedErrorId,
      params: [schema.minLength + ''],
    };
  }

  if (len < schema.maxLength!) {
    return {
      errorId: '_maxLength' as HardCodedErrorId,
      params: [schema.maxLength + ''],
    };
  }

  if (schema.regexp && schema.regexp.test(s) === false) {
    return { errorId: schema.textErrorId };
  }

  return { value: s };
}

function validateNumber(schema: NumberSchema, value: Value): ValidationResult {
  const res = validateString(schema, value);
  if (res.errorId) {
    return res;
  }

  let nbr = Number.parseFloat(res.value! as string);
  if (Number.isNaN(nbr)) {
    return { errorId: '_invalidNumber' as HardCodedErrorId };
  }

  //make it an integer or decimal to the right number of decimal places
  nbr = Math.round(nbr * schema.factor) / schema.factor;

  if (nbr < schema.minValue) {
    return {
      errorId: '_minValue' as HardCodedErrorId,
      params: [schema.minValue + ''],
    };
  }

  if (nbr > schema.maxValue) {
    return {
      errorId: '_minValue' as HardCodedErrorId,
      params: [schema.maxValue + ''],
    };
  }

  return { value: nbr };
}

function validateBoolean(schema: TextSchema, value: Value): ValidationResult {
  const res = validateString(schema, value);
  if (res.errorId) {
    return res;
  }

  const s = res.value as string;
  if (s === 'true' || s == '1') {
    return { value: true };
  }
  return { value: false };
}

// by default we allow  1000 years from current date as valid date
const MAX_DATE_DIFF = 1000 * 365 * 24 * 60 * 60;
const BOOLEAN_REGEX = /^1|0|(true)|(false)$/;
const NUMBER_REGEX = /^-{0,1}\d*\.*\d*$/;
const DATE_REGEX = /^\d\d\d\d-\d\d-\d\d$/;
const TIME_STAMP_REGEX =
  /^\d\d\d\d-\d\d-\d\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d\d\dZ$/;
const ZERO_TIME = 'T00:00:00.000Z';

function validateDate(schema: DateSchema, value: Value): ValidationResult {
  const res = validateString(schema, value);
  if (res.errorId) {
    return res;
  }

  //str is guaranteed to be yyyy-mm-dd
  const str = res.value as string;
  const arr = str.split('-');
  const yyyy = Number.parseInt(arr[0], 10);
  const mm = Number.parseInt(arr[1], 10) - 1; //month index
  const dd = Number.parseInt(arr[2], 10);
  const n = Date.parse(str + ZERO_TIME);
  if (!n) {
    return { errorId: '_invalidDate' as HardCodedErrorId };
  }

  const date = new Date(yyyy, mm, dd, 0, 0, 0, 0);

  if (
    dd !== date.getDate() ||
    mm !== date.getMonth() ||
    yyyy !== date.getFullYear()
  ) {
    return { errorId: '_invalidDate' as HardCodedErrorId };
  }

  const dateMs = date.valueOf();
  //get a date object as per local time zone but with zero time components
  const now = new Date();
  const nowMs = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  ).valueOf();

  // minValue is already in ms
  if (dateMs < nowMs - schema.minValue) {
    return {
      errorId: '_minValue' as HardCodedErrorId,
      params: [schema.minValue + ''],
    };
  }

  if (dateMs > nowMs + schema.maxValue) {
    return {
      errorId: '_minValue' as HardCodedErrorId,
      params: [schema.maxValue + ''],
    };
  }

  // note that we use date-string as the value for date fields
  return { value: str };
}

//small convenience
type StringMap<T> = { [key: string]: T };

export type ListSource = {
  name: string;
  listType: 'simple' | 'keyed' | 'runtime';
  isKeyed?: boolean;
  list?: SimpleList;
  keyedLists?: KeyedList;
};

/**
 * value-displayedText pair that is generally used to
 * create an option element in a select(drop-down) element
 */
export type ListEntry = {
  /**
   * internal value
   */
  value: string | number;
  /**
   * text being displayed for this value
   */
  text: string;
};

/**
 * simple list that is suitable for a drop-down
 */
export type SimpleList = ListEntry[];

/**
 * when the options depends on another field, like states for a country,
 * we need options for each possible keys
 */
export type KeyedList = StringMap<SimpleList>;

/**
 * collection of keyed lists
 */
export type KeyedLists = StringMap<KeyedList>;
export type LocalLists = {
  [key: string]:
    | {
        isKeyed: false;
        list: SimpleList;
      }
    | {
        isKeyed: true;
        list: KeyedList;
      };
};
