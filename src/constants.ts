export const NOT_IDCHAR = " '!:(),*@$";
export const NOT_IDSTART = "-0123456789";

const idrx = `[^${NOT_IDSTART}${NOT_IDCHAR}][^${NOT_IDCHAR}]*`;

export const id_ok = new RegExp(`^${idrx}$`);
export const next_id = new RegExp(idrx, "g");

