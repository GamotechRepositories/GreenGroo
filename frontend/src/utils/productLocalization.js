/**
 * Comprehensive Product Localization & Translation Utility
 * Provides Hindi, Marathi, and English bilingual names and unit quantities
 * with Devanagari numerals and localized weight formatting.
 */

// Devanagari digit converter
export function toDevanagariNumerals(str) {
  if (str === null || str === undefined) return "";
  const devanagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(str).replace(/[0-9]/g, (d) => devanagariDigits[Number(d)] || d);
}

// Convert English unit quantity to Marathi
export function translateUnitToMarathi(unitStr) {
  if (!unitStr) return "";
  let u = String(unitStr).trim();

  // Clean wrapper parentheses if any
  u = u.replace(/^\((.+)\)$/, "$1").trim();

  // Check for range patterns: e.g. "approx. 350g to 550g" or "350g to 550g" or "350-550g"
  const rangeMatch = u.match(/(?:approx\.?\s*)?(\d+)\s*(?:g|gm|gram|grams)?\s*(?:to|-)\s*(\d+)\s*(?:g|gm|gram|grams)?/i);
  if (rangeMatch) {
    const from = toDevanagariNumerals(rangeMatch[1]);
    const to = toDevanagariNumerals(rangeMatch[2]);
    return `अंदाजे ${from}-${to} ग्रॅम`;
  }

  const singleApproxMatch = u.match(/approx\.?\s*(\d+(?:\.\d+)?)\s*(kg|kilo|g|gm|gram|grams|l|litre|ml|pc|pcs|piece|pieces)?/i);
  if (singleApproxMatch) {
    const val = toDevanagariNumerals(singleApproxMatch[1]);
    const type = (singleApproxMatch[2] || "g").toLowerCase();
    if (type.startsWith("k")) return `अंदाजे ${val} किलो`;
    if (type.startsWith("l")) return `अंदाजे ${val} लिटर`;
    if (type.startsWith("m")) return `अंदाजे ${val} मि.ली.`;
    if (type.startsWith("p")) return `अंदाजे ${val} नग`;
    return `अंदाजे ${val} ग्रॅम`;
  }

  // Common units
  // Kilograms
  const kgMatch = u.match(/^(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram|kilograms)$/i);
  if (kgMatch) {
    return `${toDevanagariNumerals(kgMatch[1])} किलो`;
  }

  // Grams
  const gMatch = u.match(/^(\d+)\s*(?:g|gm|gram|grams)$/i);
  if (gMatch) {
    return `${toDevanagariNumerals(gMatch[1])} ग्रॅम`;
  }

  // Pieces / Pcs
  const pcMatch = u.match(/^(\d+)\s*(?:pc|pcs|piece|pieces)$/i);
  if (pcMatch) {
    return `${toDevanagariNumerals(pcMatch[1])} नग`;
  }

  // Bunch
  const bunchMatch = u.match(/^(\d+)?\s*(?:bunch|bunches|juri|judi)$/i);
  if (bunchMatch) {
    const n = bunchMatch[1] ? toDevanagariNumerals(bunchMatch[1]) : "१";
    return `${n} जुडी`;
  }

  // Litre
  const lMatch = u.match(/^(\d+(?:\.\d+)?)\s*(?:l|litre|litres|liter)$/i);
  if (lMatch) {
    return `${toDevanagariNumerals(lMatch[1])} लिटर`;
  }

  // Millilitre
  const mlMatch = u.match(/^(\d+)\s*(?:ml|millilitre|milliliter)$/i);
  if (mlMatch) {
    return `${toDevanagariNumerals(mlMatch[1])} मि.ली.`;
  }

  // Pack
  const packMatch = u.match(/^(?:pack\s*of\s*(\d+)|(\d+)\s*packs?)$/i);
  if (packMatch) {
    const n = toDevanagariNumerals(packMatch[1] || packMatch[2] || "1");
    return `${n} पॅक`;
  }

  const pieceWithInner = u.match(/^(\d+)\s*(?:pc|pcs|piece|pieces)\s*\(([^)]+)\)$/i);
  if (pieceWithInner) {
    const inner = translateUnitToMarathi(pieceWithInner[2]);
    return `${toDevanagariNumerals(pieceWithInner[1])} नग${inner ? ` (${inner})` : ""}`;
  }

  const dozenMatch = u.match(/^(\d+)\s*dozen$/i);
  if (dozenMatch) return `${toDevanagariNumerals(dozenMatch[1])} डझन`;

  const boxMatch = u.match(/^(\d+)\s*box(?:es)?$/i);
  if (boxMatch) return `${toDevanagariNumerals(boxMatch[1])} बॉक्स`;

  const packetMatch = u.match(/^(\d+)\s*packets?$/i);
  if (packetMatch) return `${toDevanagariNumerals(packetMatch[1])} पाकीट`;

  const bagMatch = u.match(/^(\d+)\s*bags?$/i);
  if (bagMatch) return `${toDevanagariNumerals(bagMatch[1])} पिशवी`;

  const setMatch = u.match(/^(\d+)\s*sets?$/i);
  if (setMatch) return `${toDevanagariNumerals(setMatch[1])} संच`;

  const pairMatch = u.match(/^(\d+)\s*pairs?$/i);
  if (pairMatch) return `${toDevanagariNumerals(pairMatch[1])} जोडी`;

  const bundleMatch = u.match(/^(\d+)\s*bundles?$/i);
  if (bundleMatch) return `${toDevanagariNumerals(bundleMatch[1])} गड्डी`;

  const meterMatch = u.match(/^(\d+(?:\.\d+)?)\s*(?:meter|metre|m)$/i);
  if (meterMatch) return `${toDevanagariNumerals(meterMatch[1])} मीटर`;

  const cmMatch = u.match(/^(\d+(?:\.\d+)?)\s*(?:cm|centimeter|centimetre)$/i);
  if (cmMatch) return `${toDevanagariNumerals(cmMatch[1])} सें.मी.`;

  // Fallback: convert digits to devanagari and replace common words
  let marathi = u
    .replace(/approx\.?/gi, "अंदाजे")
    .replace(/\bto\b/gi, "-")
    .replace(/\bkg|kilo|kilogram\b/gi, "किलो")
    .replace(/\bg|gm|gram|grams\b/gi, "ग्रॅम")
    .replace(/\bpc|pcs|piece|pieces\b/gi, "नग")
    .replace(/\bbunch|bunches\b/gi, "जुडी")
    .replace(/\bdozen\b/gi, "डझन")
    .replace(/\bbox(?:es)?\b/gi, "बॉक्स")
    .replace(/\bpackets?\b/gi, "पाकीट")
    .replace(/\bpacks?\b/gi, "पॅक")
    .replace(/\bbags?\b/gi, "पिशवी")
    .replace(/\bsets?\b/gi, "संच")
    .replace(/\bpairs?\b/gi, "जोडी")
    .replace(/\bbundles?\b/gi, "गड्डी")
    .replace(/\bmeters?|metres?\b/gi, "मीटर")
    .replace(/\bcm\b/gi, "सें.मी.")
    .replace(/\blitre|liter|l\b/gi, "लिटर")
    .replace(/\bml\b/gi, "मि.ली.")
    .replace(/\s+/g, " ")
    .trim();

  return toDevanagariNumerals(marathi);
}

// Convert English unit quantity to Hindi
export function translateUnitToHindi(unitStr) {
  if (!unitStr) return "";
  let u = String(unitStr).trim();
  u = u.replace(/^\((.+)\)$/, "$1").trim();

  const rangeMatch = u.match(/(?:approx\.?\s*)?(\d+)\s*(?:g|gm|gram|grams)?\s*(?:to|-)\s*(\d+)\s*(?:g|gm|gram|grams)?/i);
  if (rangeMatch) {
    const from = toDevanagariNumerals(rangeMatch[1]);
    const to = toDevanagariNumerals(rangeMatch[2]);
    return `लगभग ${from}-${to} ग्राम`;
  }

  const singleApproxMatch = u.match(/approx\.?\s*(\d+(?:\.\d+)?)\s*(kg|kilo|g|gm|gram|grams|l|litre|ml|pc|pcs|piece|pieces)?/i);
  if (singleApproxMatch) {
    const val = toDevanagariNumerals(singleApproxMatch[1]);
    const type = (singleApproxMatch[2] || "g").toLowerCase();
    if (type.startsWith("k")) return `लगभग ${val} किलो`;
    if (type.startsWith("l")) return `लगभग ${val} लीटर`;
    if (type.startsWith("m")) return `लगभग ${val} मि.ली.`;
    if (type.startsWith("p")) return `लगभग ${val} पीस`;
    return `लगभग ${val} ग्राम`;
  }

  const kgMatch = u.match(/^(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram|kilograms)$/i);
  if (kgMatch) return `${toDevanagariNumerals(kgMatch[1])} किलो`;

  const gMatch = u.match(/^(\d+)\s*(?:g|gm|gram|grams)$/i);
  if (gMatch) return `${toDevanagariNumerals(gMatch[1])} ग्राम`;

  const pcMatch = u.match(/^(\d+)\s*(?:pc|pcs|piece|pieces)$/i);
  if (pcMatch) return `${toDevanagariNumerals(pcMatch[1])} पीस`;

  const bunchMatch = u.match(/^(\d+)?\s*(?:bunch|bunches|juri|judi)$/i);
  if (bunchMatch) return `${toDevanagariNumerals(bunchMatch[1] || "1")} गड्डी`;

  const lMatch = u.match(/^(\d+(?:\.\d+)?)\s*(?:l|litre|litres|liter)$/i);
  if (lMatch) return `${toDevanagariNumerals(lMatch[1])} लीटर`;

  const mlMatch = u.match(/^(\d+)\s*(?:ml|millilitre|milliliter)$/i);
  if (mlMatch) return `${toDevanagariNumerals(mlMatch[1])} मि.ली.`;

  let hindi = u
    .replace(/approx\.?/gi, "लगभग")
    .replace(/\bto\b/gi, "-")
    .replace(/\bkg|kilo|kilogram\b/gi, "किलो")
    .replace(/\bg|gm|gram|grams\b/gi, "ग्राम")
    .replace(/\bpc|pcs|piece|pieces\b/gi, "पीस")
    .replace(/\bbunch|bunches\b/gi, "गड्डी")
    .replace(/\blitre|liter|l\b/gi, "लीटर")
    .replace(/\bml\b/gi, "मि.ली.")
    .replace(/\s+/g, " ")
    .trim();

  return toDevanagariNumerals(hindi);
}

/**
 * Extensive Dictionary mapping English / Hinglish produce terms to:
 * - hindiLatin: Common name (e.g. "Dudhi", "Bhindi", "Tamatar", "Aloo")
 * - hindiDev: Devanagari Hindi (e.g. "दूधी (लौकी)", "भिंडी", "टमाटर")
 * - marathiDev: Devanagari Marathi (e.g. "दुधी भोपळा", "भेंडी", "टोमॅटो", "बटाटा")
 * - defaultUnit: Default weight estimation if missing
 */
export const PRODUCE_DICTIONARY = [
  // Bottle Gourd / Dudhi
  {
    regex: /dudhi|doodhi|lauki|bottle\s*gourd|ghiya/i,
    hindiLatin: "Dudhi",
    hindiDev: "दूधी (लौकी)",
    marathiDev: "दुधी भोपळा",
    defaultUnit: "approx. 350g to 550g",
  },
  // Potato / Aloo / Batata
  {
    regex: /potato|aloo|alu|batata/i,
    hindiLatin: "Aloo (Potato)",
    hindiDev: "आलू (बटाटा)",
    marathiDev: "बटाटा",
    defaultUnit: "1 kg",
  },
  // Tomato / Tamatar
  {
    regex: /tomato|tamatar/i,
    hindiLatin: "Tamatar",
    hindiDev: "टमाटर",
    marathiDev: "टोमॅटो",
    defaultUnit: "approx. 500g",
  },
  // Onion / Pyaz / Kanda
  {
    regex: /onion|pyaz|pyaaz|kanda/i,
    hindiLatin: "Pyaz",
    hindiDev: "प्याज",
    marathiDev: "कांदा",
    defaultUnit: "1 kg",
  },
  // Lady Finger / Bhindi / Okra
  {
    regex: /bhindi|bhindee|okra|lady\s*finger/i,
    hindiLatin: "Bhindi",
    hindiDev: "भिंडी",
    marathiDev: "भेंडी",
    defaultUnit: "approx. 250g to 500g",
  },
  // Brinjal / Eggplant / Baingan / Vangi
  {
    regex: /brinjal|baingan|eggplant|vangi/i,
    hindiLatin: "Baingan",
    hindiDev: "बैंगन",
    marathiDev: "वांगी",
    defaultUnit: "approx. 500g",
  },
  // Spinach / Palak
  {
    regex: /palak|spinach/i,
    hindiLatin: "Palak",
    hindiDev: "पालक",
    marathiDev: "पालक",
    defaultUnit: "1 bunch (approx. 250g)",
  },
  // Fenugreek / Methi
  {
    regex: /methi|fenugreek/i,
    hindiLatin: "Methi",
    hindiDev: "मेथी",
    marathiDev: "मेथी",
    defaultUnit: "1 bunch",
  },
  // Coriander / Kothmir / Dhaniya
  {
    regex: /coriander|kothmir|dhaniya|kothimbir/i,
    hindiLatin: "Dhaniya (Kothmir)",
    hindiDev: "धनिया (कोथमिर)",
    marathiDev: "कोथिंबीर",
    defaultUnit: "100g",
  },
  // Mint / Pudina
  {
    regex: /mint|pudina/i,
    hindiLatin: "Pudina",
    hindiDev: "पुदीना",
    marathiDev: "पुदिना",
    defaultUnit: "50g",
  },
  // Cauliflower / Phool Gobi
  {
    regex: /cauliflower|phool\s*gobi|phul\s*gobi/i,
    hindiLatin: "Phool Gobi",
    hindiDev: "फूल गोभी",
    marathiDev: "फ्लॉवर (फुलकोबी)",
    defaultUnit: "1 pc (approx. 400g to 600g)",
  },
  // Cabbage / Patta Gobi / Kobi
  {
    regex: /cabbage|patta\s*gobi|band\s*gobi|kobi/i,
    hindiLatin: "Patta Gobi",
    hindiDev: "पत्ता गोभी",
    marathiDev: "कोबी",
    defaultUnit: "1 pc (approx. 500g)",
  },
  // Capsicum / Shimla Mirch / Dhobli Mirchi
  {
    regex: /capsicum|shimla\s*mirch|bell\s*pepper/i,
    hindiLatin: "Shimla Mirch",
    hindiDev: "शिमला मिर्च",
    marathiDev: "ढोबळी मिरची",
    defaultUnit: "approx. 250g to 500g",
  },
  // Chilli / Green Chilli / Mirchi
  {
    regex: /green\s*chilli|chilli|chili|mirch|mirchi|hari\s*mirch/i,
    hindiLatin: "Hari Mirch",
    hindiDev: "हरी मिर्च",
    marathiDev: "हिरवी मिरची",
    defaultUnit: "100g",
  },
  // Cucumber / Kheera / Kakdi
  {
    regex: /cucumber|kheera|kakdi|kakri/i,
    hindiLatin: "Kheera (Kakdi)",
    hindiDev: "खीरा (ककड़ी)",
    marathiDev: "काकडी",
    defaultUnit: "approx. 500g",
  },
  // Carrot / Gajar
  {
    regex: /carrot|gajar|gaajar/i,
    hindiLatin: "Gajar",
    hindiDev: "गाजर",
    marathiDev: "गाजर",
    defaultUnit: "approx. 500g",
  },
  // Radish / Mooli / Mula
  {
    regex: /radish|mooli|muli|mula/i,
    hindiLatin: "Mooli",
    hindiDev: "मूली",
    marathiDev: "मुळा",
    defaultUnit: "approx. 500g",
  },
  // Bitter Gourd / Karela / Karle
  {
    regex: /bitter\s*gourd|karela|karle/i,
    hindiLatin: "Karela",
    hindiDev: "करेला",
    marathiDev: "कारले",
    defaultUnit: "approx. 500g",
  },
  // Ridge Gourd / Turai / Dodka
  {
    regex: /ridge\s*gourd|turai|tori|dodka/i,
    hindiLatin: "Turai (Tori)",
    hindiDev: "तुरई (तोरी)",
    marathiDev: "दोडका",
    defaultUnit: "approx. 500g",
  },
  // Sponge Gourd / Gilki / Ghosale
  {
    regex: /sponge\s*gourd|gilki|ghosale/i,
    hindiLatin: "Gilki",
    hindiDev: "गिलकी",
    marathiDev: "घोसाळे",
    defaultUnit: "approx. 500g",
  },
  // Pumpkin / Kaddu / Bhopla
  {
    regex: /pumpkin|kaddu|bhopla|lal\s*bhopla/i,
    hindiLatin: "Kaddu",
    hindiDev: "कद्दू",
    marathiDev: "लाल भोपळा",
    defaultUnit: "approx. 500g",
  },
  // Ash Gourd / Petha / Kohla
  {
    regex: /ash\s*gourd|petha|kohla/i,
    hindiLatin: "Petha",
    hindiDev: "पेठा",
    marathiDev: "कोहळा",
    defaultUnit: "approx. 500g to 1kg",
  },
  // Green Peas / Matar / Vatana
  {
    regex: /green\s*peas|peas|matar|vatana/i,
    hindiLatin: "Matar",
    hindiDev: "मटर",
    marathiDev: "हिरवे वाटाणे",
    defaultUnit: "approx. 500g",
  },
  // French Beans / Beans / Farasbi
  {
    regex: /french\s*beans|beans|farasbi|fravsi/i,
    hindiLatin: "Beans (Farasbi)",
    hindiDev: "बीन्स (फरासबी)",
    marathiDev: "फरसबी",
    defaultUnit: "approx. 250g",
  },
  // Cluster Beans / Gwar / Gavar
  {
    regex: /cluster\s*beans|gwar|gavar/i,
    hindiLatin: "Gwar Phali",
    hindiDev: "ग्वार फली",
    marathiDev: "गवार",
    defaultUnit: "approx. 250g",
  },
  // Drumstick / Sehjan / Shevga
  {
    regex: /drumstick|moringa|sehjan|shevga/i,
    hindiLatin: "Sehjan",
    hindiDev: "सहजन (ड्रमस्टिक)",
    marathiDev: "शेवगा शेंग",
    defaultUnit: "approx. 250g (3-4 pcs)",
  },
  // Ginger / Adrak / Ale
  {
    regex: /ginger|adrak|aada|ale/i,
    hindiLatin: "Adrak",
    hindiDev: "अदरक",
    marathiDev: "आले",
    defaultUnit: "100g",
  },
  // Garlic / Lahsun / Lasun
  {
    regex: /garlic|lahsun|lasun/i,
    hindiLatin: "Lahsun",
    hindiDev: "लहसुन",
    marathiDev: "लसूण",
    defaultUnit: "100g",
  },
  // Lemon / Nimbu / Limbu
  {
    regex: /lemon|lime|nimbu|limbu/i,
    hindiLatin: "Nimbu",
    hindiDev: "नींबू",
    marathiDev: "लिंबू",
    defaultUnit: "4-5 pcs (approx. 150g)",
  },
  // Beetroot / Chukandar / Beet
  {
    regex: /beetroot|chukandar|beet/i,
    hindiLatin: "Chukandar",
    hindiDev: "चुकंदर",
    marathiDev: "बीट",
    defaultUnit: "approx. 500g",
  },
  // Sweet Potato / Shakarkand / Ratale
  {
    regex: /sweet\s*potato|shakarkand|ratale/i,
    hindiLatin: "Shakarkand",
    hindiDev: "शकरकंद",
    marathiDev: "रताळे",
    defaultUnit: "approx. 500g",
  },
  // Ivy Gourd / Tindora / Tondli
  {
    regex: /tindora|tondli|kundru/i,
    hindiLatin: "Kundru (Tindora)",
    hindiDev: "कुंदरू (टिंडोरा)",
    marathiDev: "तोंडली",
    defaultUnit: "approx. 250g",
  },
  // Curry Leaves / Kadi Patta
  {
    regex: /curry\s*leaves|kadi\s*patta|kadhipatta/i,
    hindiLatin: "Kadi Patta",
    hindiDev: "कढ़ी पत्ता",
    marathiDev: "कढीपत्ता",
    defaultUnit: "50g",
  },
  // Sweet Corn / Bhutta / Maka
  {
    regex: /sweet\s*corn|corn|bhutta|maka/i,
    hindiLatin: "Sweet Corn (Bhutta)",
    hindiDev: "भुट्टा (मक्का)",
    marathiDev: "मका (कणीस)",
    defaultUnit: "1 pc / 2 pcs",
  },
  // Mushroom
  {
    regex: /mushroom|khumb/i,
    hindiLatin: "Mushroom",
    hindiDev: "मशरूम",
    marathiDev: "मशरूम (अळंबी)",
    defaultUnit: "1 pack (200g)",
  },
  // Broccoli
  {
    regex: /broccoli/i,
    hindiLatin: "Broccoli",
    hindiDev: "ब्रोकली (हरी गोभी)",
    marathiDev: "ब्रोकली",
    defaultUnit: "1 pc (approx. 250g to 400g)",
  },
  // Fruits
  // Banana
  {
    regex: /banana|kela|kele/i,
    hindiLatin: "Kela",
    hindiDev: "केला",
    marathiDev: "केळी",
    defaultUnit: "1 dozen (12 pcs) / 500g",
  },
  // Apple
  {
    regex: /apple|seb|safarchand/i,
    hindiLatin: "Seb (Apple)",
    hindiDev: "सेब",
    marathiDev: "सफरचंद",
    defaultUnit: "4 pcs (approx. 500g)",
  },
  // Orange
  {
    regex: /orange|santra|santri/i,
    hindiLatin: "Santra",
    hindiDev: "संतरा",
    marathiDev: "संत्री",
    defaultUnit: "approx. 500g to 1kg",
  },
  // Pomegranate
  {
    regex: /pomegranate|anar|dalimb/i,
    hindiLatin: "Anar",
    hindiDev: "अनार",
    marathiDev: "डाळिंब",
    defaultUnit: "approx. 500g (2-3 pcs)",
  },
  // Papaya
  {
    regex: /papaya|papita|papai/i,
    hindiLatin: "Papita",
    hindiDev: "पपीता",
    marathiDev: "पपई",
    defaultUnit: "1 pc (approx. 800g to 1.2kg)",
  },
  // Watermelon
  {
    regex: /watermelon|tarbooj|kalingad/i,
    hindiLatin: "Tarbooj",
    hindiDev: "तरबूज",
    marathiDev: "कलिंगड",
    defaultUnit: "1 pc (approx. 2kg to 3kg)",
  },
  // Muskmelon
  {
    regex: /muskmelon|kharbooja|kharbuj/i,
    hindiLatin: "Kharbooja",
    hindiDev: "खरबूजा",
    marathiDev: "खरबूज",
    defaultUnit: "1 pc (approx. 700g to 1kg)",
  },
  // Grapes
  {
    regex: /grapes|angoor|drakshe/i,
    hindiLatin: "Angoor",
    hindiDev: "अंगूर",
    marathiDev: "द्राक्षे",
    defaultUnit: "approx. 500g",
  },
  // Guava
  {
    regex: /guava|amrood|peru/i,
    hindiLatin: "Amrood",
    hindiDev: "अमरूद",
    marathiDev: "पेरू",
    defaultUnit: "approx. 500g (3-4 pcs)",
  },
  // Mango
  {
    regex: /mango|aam|amba/i,
    hindiLatin: "Aam (Mango)",
    hindiDev: "आम",
    marathiDev: "आंबा",
    defaultUnit: "1 kg / 6 pcs",
  },
  // Coconut
  {
    regex: /coconut|nariyal|naral/i,
    hindiLatin: "Nariyal",
    hindiDev: "नारियल",
    marathiDev: "नारळ",
    defaultUnit: "1 pc",
  },
  // Dairy & Staples
  // Milk
  {
    regex: /milk|doodh|dudh/i,
    hindiLatin: "Doodh (Milk)",
    hindiDev: "ताजा दूध",
    marathiDev: "ताजे दूध",
    defaultUnit: "1 Litre",
  },
  // Dahi / Curd
  {
    regex: /curd|dahi/i,
    hindiLatin: "Dahi (Curd)",
    hindiDev: "दही",
    marathiDev: "ताजे दही",
    defaultUnit: "400g / 500g",
  },
  // Paneer
  {
    regex: /paneer/i,
    hindiLatin: "Paneer",
    hindiDev: "पनीर",
    marathiDev: "पनीर",
    defaultUnit: "200g",
  },
  // Ghee
  {
    regex: /ghee|toop/i,
    hindiLatin: "Desi Ghee",
    hindiDev: "शुद्ध घी",
    marathiDev: "साजूक तूप",
    defaultUnit: "500 ML / 1 Litre",
  },
  // Turmeric
  {
    regex: /turmeric|haldi|halad/i,
    hindiLatin: "Haldi (Turmeric)",
    hindiDev: "हल्दी",
    marathiDev: "हळद",
    defaultUnit: "250g / 500g",
  },
  // Jaggery
  {
    regex: /jaggery|gud|gul/i,
    hindiLatin: "Gud (Jaggery)",
    hindiDev: "गुड़",
    marathiDev: "सेंद्रिय गूळ",
    defaultUnit: "1 kg",
  },
  // Honey
  {
    regex: /honey|madh|shahad/i,
    hindiLatin: "Shahad (Honey)",
    hindiDev: "शहद",
    marathiDev: "शुद्ध मध",
    defaultUnit: "500g",
  },
];

/**
 * Extracts and formats the primary (Hindi/English) and secondary (Marathi)
 * product title and unit quantity, strictly adhering to:
 * Line 1: Dudhi(approx.350g to 550g)
 * Line 2: दुधी भोपळा (अंदाजे ३५०-५५० ग्रॅम) ⌵
 */
export function getProductDisplayDetails(product = {}, fallbackUnit = "") {
  const rawName = String(product?.name || "").trim();
  const rawMarathiName = String(product?.marathiName || "").trim();
  const rawHindiName = String(product?.hindiName || "").trim();
  const rawUnit = String(
    fallbackUnit || product?.unit || product?.sub || product?.weight || ""
  ).trim();

  // Check if rawName already has a parenthetical unit: e.g. "Dudhi (approx. 350g to 550g)"
  let baseName = rawName;
  let embeddedUnit = "";
  const parenMatch = rawName.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    baseName = parenMatch[1].trim();
    embeddedUnit = parenMatch[2].trim();
  }

  // Effective English/Hindi unit
  const activeUnit = embeddedUnit || rawUnit || "approx. 500g";

  // Look up in produce dictionary for localized vernacular names
  const dictMatch = PRODUCE_DICTIONARY.find((item) =>
    item.regex.test(baseName) || item.regex.test(rawName)
  );

  // Line 1: Hindi/English title
  // e.g. "Dudhi(approx.350g to 550g)"
  const line1Base = rawHindiName || (dictMatch ? dictMatch.hindiLatin : baseName);
  const formattedUnit = activeUnit
    .replace(/\s*to\s*/i, " to ")
    .replace(/approx\.\s*/i, "approx.")
    .trim();
  const primaryTitle = `${line1Base}(${formattedUnit})`;

  // Line 2: Marathi name with Marathi unit in brackets
  // e.g. "दुधी भोपळा (अंदाजे ३५०-५५० ग्रॅम)"
  const marathiBase =
    rawMarathiName || (dictMatch ? dictMatch.marathiDev : baseName);
  const marathiUnit = translateUnitToMarathi(activeUnit);
  const secondaryTitle = marathiUnit
    ? `${marathiBase} (${marathiUnit})`
    : marathiBase;

  // Also Hindi in Devanagari (available for toggle / tooltip / full display)
  const hindiDevBase = dictMatch ? dictMatch.hindiDev : (rawHindiName || baseName);
  const hindiUnit = translateUnitToHindi(activeUnit);
  const hindiDevTitle = hindiUnit
    ? `${hindiDevBase} (${hindiUnit})`
    : hindiDevBase;

  // Storefront titles show the catalog's English name and English pack size.
  const englishUnit = /\d/.test(embeddedUnit) ? embeddedUnit : rawUnit;

  return {
    primaryTitle: rawName || line1Base,
    secondaryTitle: englishUnit,
    localizedTitle: primaryTitle,
    marathiTitle: secondaryTitle,
    hindiDevTitle, // e.g. "दूधी (लौकी) (लगभग ३५०-५५० ग्राम)"
    baseName,
    line1Base,
    marathiBase,
    hindiDevBase,
    activeUnit,
    marathiUnit,
    hindiUnit,
  };
}
