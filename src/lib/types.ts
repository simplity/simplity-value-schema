/**
 * a function that uses a pre-defined schema/logic to validate the supplied argument.
 * It converts/parses the arguments if required and returns the value with the right type.
 * In case of an error, it returns the error code, along with run-time error-parameters if required.
 *
 * NOTE-1: undefined, null and NaN are considered invalid for all value types, except for boolean.
 * null, undefined, NaN, empty string, 0, '0',false, 'false' are false values
 * while  true, 'true', 1 and '1' are true values.
 *
 * NOTE-2: if the text value accepts unicode characters,
 * then min/max length are generally not reliable from end-user's perspective.
 * e.g. how would an end-user count number of characters in 'ಒಂದು'?
 * It is possible to count the number of characters, but it may not be useful.
 * Hence we are just using string.length that is not at all reliable when it comes to unicode characters.
 *
 * NOTE-3: for timestamp, date-part is validated like date.
 * Time part is validated for entire-day. No facility to restrict time-part.
 */
export type ValidationFn = (value: any) => ValidationResult;
export const DEFAULT_MAX_CHARS = 1000;
export const DEFAULT_DAYS_RANGE = 365000;
export const DEFAULT_MAX_NUMBER = Number.MAX_SAFE_INTEGER;
export const DEFAULT_NBR_DECIMALS = 2;

/**
 * validation result. One of value or errors is undefined and the other would be non-undefined always.
 */
export type ValidationResult = {
  /**
   * parsed value in the right type. e.g value = 9 if input was '9.0123' for an integer
   * undefined in case of error
   */
  value?: Value;
  /**
   * error. undefined if value is not undefined.
   */
  error?: ValueSchemaError;
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
}

/**
 * all primitive values are represented with these three primitives
 * Date is a string like "yyyy-mm-dd", and time stamp is a string like "yyyy-mm-ddThh:MM:ss.fffZ"
 */
export type Value = string | number | boolean;

/**
 * meta-data for checking if a given value is suitable for a value-schema
 * boolean-type uses no meta data, and has a fixed value set of (true, false, 1, 0)
 */
export type ValueSchema = {
  /**
   * parsed value is of this type, unless there is an error
   *
   */
  valueType: ValueType;
  /**
   * defaults to 1.
   * relevant for text type, but used, if specified in other types as well
   * NOTE: unicode characters are not counted properly. Use with care.
   */
  minLength?: number;
  /**
   * defaults to 1000.
   * relevant for text type, but used, if specified in other types as well
   * NOTE: unicode characters are not counted properly. Use with care.
   */
  maxLength?: number;
  /**
   * as per javascript RegExp syntax
   */
  regex?: string;
  /**
   * relevant for dates and numbers.
   * defaults to 0 for integer-type and decimal-type,because we expect the usage mostly in business scenarios
   * for date-type, this value is used relative to "today"
   * minValue = 10 means that the date has to be at least 10 days into the future.
   * minValue = -10 means that the date could be as early as 10 days before today.
   * default is -365,000 allowing dates roughly 1000 in the past
   */
  minValue?: number;
  /**
   * relevant for dates and numbers.
   * defaults to Number.MAX_SAFE_INTEGER for both integer and decimal
   * for date-type, this value is used relative to "today"
   * e.g. maxValue = 10 means that the date could be as far into the future as 10 days from now
   * maxValue = -10 means that the date could be as late as 10 days before today.
   * defaults to 365,000, allowing roughly 1000 years into the future
   *
   */

  maxValue?: number;
  /**
   * relevant for decimal-type. defaults to 2.
   * numbers will be rounded based on this.
   */
  nbrDecimalPlaces?: number;
  /**
   * relevant for arrays. defaults to 1
   */
  minRows?: number;
  /**
   * relevant for arrays. defaults to 100
   */
  maxRows?: number;
};

export type ValueSchemaError = {
  code: ValueSchemaErrorCode;
  params?: string[];
};
export enum ValueSchemaErrorCode {
  InvalidText = '_invalidText',
  InvalidBoolean = '_invalidBoolean',
  InvalidNumber = '_invalidNumber',
  InvalidDate = '_invalidDate',
  InvalidTimestamp = '_invalidTimestamp',
  MinLength = '_minLength',
  MaxLength = '_maxLength',
  MinValue = '_minValue',
  MaxValue = '_maxValue',
  EarliestDate = '_earliestDate',
  LatestDate = '_latestDate',
}
