const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(num) {
  if (num < 20) return ONES[num];
  const ten = Math.floor(num / 10);
  const one = num % 10;
  return `${TENS[ten]}${one ? ` ${ONES[one]}` : ""}`.trim();
}

function threeDigits(num) {
  if (num === 0) return "";
  if (num < 100) return twoDigits(num);
  const hundred = Math.floor(num / 100);
  const rest = num % 100;
  return `${ONES[hundred]} Hundred${rest ? ` ${twoDigits(rest)}` : ""}`.trim();
}

function convertIndianNumber(num) {
  if (num === 0) return "Zero";

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundredPart = num % 1000;
  const parts = [];

  if (crore) parts.push(`${convertIndianNumber(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundredPart) parts.push(threeDigits(hundredPart));

  return parts.join(" ").trim();
}

export function amountInWords(amount) {
  const value = Math.round((Number(amount) || 0) * 100) / 100;
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);

  let words = `${convertIndianNumber(rupees)} Rupees`;
  if (paise > 0) {
    words += ` and ${convertIndianNumber(paise)} Paise`;
  }
  return `${words} Only`;
}
