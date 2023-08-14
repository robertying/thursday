const absoluteUrlReg = new RegExp("^(?:[a-z]+:)?//", "i");

export const isRelativeUrl = (url: string) => {
  return !absoluteUrlReg.test(url);
};
