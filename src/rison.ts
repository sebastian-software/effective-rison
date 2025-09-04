export { quote, encode, encode_object, encode_array, encode_uri } from "./encode";
export { Parser } from "./parser";
export { decode, decode_object, decode_array } from "./decode";

import { quote, encode, encode_object, encode_array, encode_uri } from "./encode";
import { Parser } from "./parser";
import { decode, decode_object, decode_array } from "./decode";

const rison = { encode, encode_object, encode_array, encode_uri, decode, decode_object, decode_array, parser: Parser, quote };
export default rison;
