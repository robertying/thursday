export const getSemesterTextFromId = (
  semesterId: string,
  compact?: boolean,
) => {
  const texts = semesterId.split("-");
  return compact
    ? `${texts?.[0]}-${texts?.[1]}\n${
        texts?.[2] === "1" ? "秋" : texts?.[2] === "2" ? "春" : "夏"
      }`
    : `${texts?.[0]}-${texts?.[1]} 学年${
        texts?.[2] === "1"
          ? "秋季学期"
          : texts?.[2] === "2"
          ? "春季学期"
          : "夏季学期"
      }`;
};
