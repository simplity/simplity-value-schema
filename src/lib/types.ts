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
  EarliestDate = '_earliestDate',
  LatestDate = '_latestDate',
}
