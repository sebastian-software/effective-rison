/**
 * Characters that are illegal inside identifiers.
 */
export const NOT_IDCHAR = " '!:(),*@$";

/**
 * Characters that are illegal as the start of an identifier (prevents numeric-looking ids).
 */
export const NOT_IDSTART = "-0123456789";

/**
 * Regex source matching a valid Rison identifier.
 */
const identifierSource = `[^${NOT_IDSTART}${NOT_IDCHAR}][^${NOT_IDCHAR}]*`;

/**
 * Full-match regex for a valid identifier.
 */
export const identifierRegex = new RegExp(`^${identifierSource}$`);

/**
 * Global regex to find the next identifier starting at a given position.
 */
export const nextIdentifierRegex = new RegExp(identifierSource, "g");
