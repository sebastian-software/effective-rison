export { quote, encode, encodeObject, encodeArray, encodeUri } from "./encode";
export { Parser } from "./parser";
export { decode, decodeObject, decodeArray } from "./decode";

import { quote, encode, encodeObject, encodeArray, encodeUri } from "./encode";
import { Parser } from "./parser";
import { decode, decodeObject, decodeArray } from "./decode";

const rison = { encode, encodeObject, encodeArray, encodeUri, decode, decodeObject, decodeArray, parser: Parser, quote };
export default rison;
