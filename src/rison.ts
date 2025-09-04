export { quote, encode, encodeObject, encode_object, encodeArray, encode_array, encodeUri, encode_uri } from "./encode";
export { Parser } from "./parser";
export { decode, decodeObject, decode_object, decodeArray, decode_array } from "./decode";

import { quote, encode, encodeObject, encode_object, encodeArray, encode_array, encodeUri, encode_uri } from "./encode";
import { Parser } from "./parser";
import { decode, decodeObject, decode_object, decodeArray, decode_array } from "./decode";

const rison = {
  // primary camelCase API
  encode,
  encodeObject,
  encodeArray,
  encodeUri,
  decode,
  decodeObject,
  decodeArray,
  parser: Parser,
  quote,
  // backwards-compat snake_case aliases
  encode_object,
  encode_array,
  encode_uri,
  decode_object,
  decode_array
};
export default rison;
