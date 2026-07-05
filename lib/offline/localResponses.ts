export type LocalResponseId =
  | "yes"
  | "no"
  | "i_do_not_know"
  | "left"
  | "right"
  | "straight"
  | "go_back"
  | "near"
  | "far"
  | "safe"
  | "not_safe"
  | "wait"
  | "follow_me"
  | "write_number_here";

export interface LocalResponse {
  id: LocalResponseId;
  label: string;
  english: string;
  pronunciation_simple: string;
  translations: Record<string, string>;
}

export const LOCAL_RESPONSES: LocalResponse[] = [
  {
    id: "yes",
    label: "Yes",
    english: "Yes",
    pronunciation_simple: "yes",
    translations: {
      tl: "Oo",
      ceb: "Oo",
      hil: "Huo",
    },
  },
  {
    id: "no",
    label: "No",
    english: "No",
    pronunciation_simple: "noh",
    translations: {
      tl: "Hindi",
      ceb: "Dili",
      hil: "Indi",
    },
  },
  {
    id: "i_do_not_know",
    label: "I do not know",
    english: "I do not know",
    pronunciation_simple: "ay doh not noh",
    translations: {
      tl: "Hindi ko alam",
      ceb: "Wala ko kahibalo",
      hil: "Wala ko kabalo",
    },
  },
  {
    id: "left",
    label: "Left",
    english: "Left",
    pronunciation_simple: "left",
    translations: {
      tl: "Kaliwa",
      ceb: "Wala",
      hil: "Wala",
    },
  },
  {
    id: "right",
    label: "Right",
    english: "Right",
    pronunciation_simple: "ryt",
    translations: {
      tl: "Kanan",
      ceb: "Tuo",
      hil: "Tu-o",
    },
  },
  {
    id: "straight",
    label: "Straight",
    english: "Straight ahead",
    pronunciation_simple: "strayt ah-HED",
    translations: {
      tl: "Diretso",
      ceb: "Tul-id",
      hil: "Tul-id",
    },
  },
  {
    id: "go_back",
    label: "Go back",
    english: "Go back",
    pronunciation_simple: "goh BAK",
    translations: {
      tl: "Bumalik",
      ceb: "Balik",
      hil: "Balik",
    },
  },
  {
    id: "near",
    label: "Near",
    english: "Near",
    pronunciation_simple: "neer",
    translations: {
      tl: "Malapit",
      ceb: "Duol",
      hil: "Near",
    },
  },
  {
    id: "far",
    label: "Far",
    english: "Far",
    pronunciation_simple: "far",
    translations: {
      tl: "Malayo",
      ceb: "Layo",
      hil: "Lay-o",
    },
  },
  {
    id: "safe",
    label: "Safe",
    english: "Safe",
    pronunciation_simple: "sayf",
    translations: {
      tl: "Ligtas",
      ceb: "Luwas",
      hil: "Luwas",
    },
  },
  {
    id: "not_safe",
    label: "Not safe",
    english: "Not safe",
    pronunciation_simple: "not SAYF",
    translations: {
      tl: "Hindi ligtas",
      ceb: "Dili luwas",
      hil: "Indi luwas",
    },
  },
  {
    id: "wait",
    label: "Wait",
    english: "Wait",
    pronunciation_simple: "wayt",
    translations: {
      tl: "Sandali",
      ceb: "Hulat",
      hil: "Hulat",
    },
  },
  {
    id: "follow_me",
    label: "Follow me",
    english: "Follow me",
    pronunciation_simple: "FOL-oh mee",
    translations: {
      tl: "Sundan mo ako",
      ceb: "Sunod sa ako",
      hil: "Follow sa ako",
    },
  },
  {
    id: "write_number_here",
    label: "Write number here",
    english: "Write the number here",
    pronunciation_simple: "ryt thuh NUM-ber heer",
    translations: {
      tl: "Isulat ang numero dito",
      ceb: "Isulat ang numero diri",
      hil: "Isulat ang numero diri",
    },
  },
];

export function getLocalResponseText(
  response: LocalResponse,
  languageCode: string,
): string {
  return (
    response.translations[languageCode] ??
    `${response.english} (translation unavailable for ${languageCode})`
  );
}
