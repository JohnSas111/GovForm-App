export type LanguageKey = "English" | "Tagalog" | "Cebuano";
export type TranslationKey =
  | "app_title"
  | "subtitle"
  | "btn_take_photo"
  | "btn_choose_photo"
  | "nav_home"
  | "nav_forms"
  | "nav_settings"
  | "choose_language"
  | "sectionTitle"
  | "label_original_text"
  | "label_definition"
  | "label_example"
  | "label_synonyms"
  | "label_sample_entry"
  | "err_title"
  | "err_offline"
  | "err_timeout"
  | "err_network"
  | "err_rate_limit"
  | "err_blocked"
  | "err_server"
  | "err_invalid"
  | "err_auth"
  | "err_generic"
  | "btn_try_again"
  | "notice_approximate"
  | "btn_explain_sentence"
  | "label_sentence_meaning"
  | "loading_sentence"
  | "notice_ai_generated";

export const translations: Record<
  LanguageKey,
  Record<TranslationKey, string>
> = {
  English: {
    app_title: "GovForm AI",
    subtitle: "Take a picture of any government form and let AI help you.",
    btn_take_photo: "Take a Picture of the form",
    btn_choose_photo: "Choose Existing Photo",
    nav_home: "Home",
    nav_forms: "Recents",
    nav_settings: "Settings",
    choose_language: "Choose a\nLanguage",
    sectionTitle: "Select a Language",
    label_original_text: "Original Text from Document",
    label_definition: "Definition",
    label_example: "Example Sentence",
    label_synonyms: "Synonyms",
    label_sample_entry: "Sample Entry",
    err_title: "Couldn't Get the Definition",
    err_offline:
      "You're offline and this word isn't saved yet. Connect to the internet and try again.",
    err_timeout:
      "This is taking too long. Check your connection and try again.",
    err_network:
      "Couldn't reach the dictionary service. Check your internet connection and try again.",
    err_rate_limit:
      "The dictionary service is busy right now. Please wait a moment and try again.",
    err_blocked:
      "The AI couldn't provide a definition for this word. Try tapping a different word.",
    err_server:
      "The dictionary service had a problem. Please try again in a moment.",
    err_invalid: "The AI gave an incomplete answer. Please try again.",
    err_auth:
      "The dictionary service isn't set up correctly. Please contact the app developer.",
    err_generic: "Something went wrong. Please try again.",
    btn_try_again: "Try Again",
    notice_approximate:
      "Saved from a different form. It may not match this one.",
    btn_explain_sentence: "Explain this sentence",
    label_sentence_meaning: "Simple version of this sentence",
    loading_sentence: "Simplifying…",
    notice_ai_generated:
      "AI-generated. Check with the agency if you're unsure.",
  },
  Tagalog: {
    app_title: "GovForm AI",
    subtitle:
      "Kunan ng picture ang anumang form ng gobyerno at hayaang tulungan ka ng AI.",
    btn_take_photo: "Kunan ng Picture ang Form",
    btn_choose_photo: "Pumili sa Gallery",
    nav_home: "Home",
    nav_forms: "Mga Nakaraan",
    nav_settings: "Settings",
    choose_language: "Pumili ng\nWika",
    sectionTitle: "Pumili ng Wika",
    label_original_text: "Orihinal na Teksto mula sa Dokumento",
    label_definition: "Kahulugan ng salita",
    label_example: "Halimbawang Pangungusap",
    label_synonyms: "Mga Kasingkahulugan",
    label_sample_entry: "Halimbawang Isusulat",
    err_title: "Hindi Makuha ang Kahulugan",
    err_offline:
      "Offline ka at hindi pa nase-save ang salitang ito. Kumonekta sa internet at subukan ulit.",
    err_timeout:
      "Masyadong matagal ito. Suriin ang koneksyon mo at subukan ulit.",
    err_network:
      "Hindi maabot ang serbisyo ng diksyunaryo. Suriin ang iyong internet at subukan ulit.",
    err_rate_limit:
      "Abala ang serbisyo ng diksyunaryo ngayon. Maghintay sandali at subukan ulit.",
    err_blocked:
      "Hindi nakapagbigay ng kahulugan ang AI para sa salitang ito. Subukan ang ibang salita.",
    err_server:
      "Nagkaproblema ang serbisyo ng diksyunaryo. Subukan ulit maya-maya.",
    err_invalid: "Hindi kumpleto ang sagot ng AI. Pakisubukan ulit.",
    err_auth:
      "Hindi tama ang setup ng serbisyo ng diksyunaryo. Makipag-ugnayan sa developer ng app.",
    err_generic: "May nangyaring mali. Pakisubukan ulit.",
    btn_try_again: "Subukan Ulit",
    notice_approximate:
      "Na-save mula sa ibang form. Maaaring hindi ito tumugma sa form na ito.",
    btn_explain_sentence: "Ipaliwanag ang pangungusap na ito",
    label_sentence_meaning: "Simpleng bersyon ng pangungusap na ito",
    loading_sentence: "Pinapasimple…",
    notice_ai_generated:
      "Gawa ng AI. Magtanong sa ahensya kung hindi ka sigurado.",
  },
  Cebuano: {
    app_title: "GovForm AI",
    subtitle:
      "Picturi ang bisan unsang form sa gobyerno ug ipatabang kini sa AI.",
    btn_take_photo: "Picturi ang Form",
    btn_choose_photo: "Pangitag Litrato gikan sa Gallery",
    nav_home: "Home",
    nav_forms: "Mga Niagi",
    nav_settings: "Settings",
    choose_language: "Pagpili og\nPinulongan",
    sectionTitle: "Pagpili og Pinulongan",
    label_original_text: "Orihinal nga Teksto gikan sa Dokumento",
    label_definition: "Kahulogan sa pulong",
    label_example: "Pananglitan nga Sentence",
    label_synonyms: "Susama nga mga Pulong",
    label_sample_entry: "Pananglitan nga Isulat",
    err_title: "Wala Makuha ang Kahulogan",
    err_offline:
      "Offline ka ug wala pa ma-save kini nga pulong. Konektar sa internet ug sulayi pag-usab.",
    err_timeout:
      "Dugay kaayo kini. Susiha ang imong koneksyon ug sulayi pag-usab.",
    err_network:
      "Wala maabot ang serbisyo sa diksyonaryo. Susiha ang imong internet ug sulayi pag-usab.",
    err_rate_limit:
      "Busy ang serbisyo sa diksyonaryo karon. Maghulat sa makadiyot ug sulayi pag-usab.",
    err_blocked:
      "Wala makahatag og kahulogan ang AI para niini nga pulong. Sulayi ang lain nga pulong.",
    err_server:
      "Adunay problema ang serbisyo sa diksyonaryo. Sulayi pag-usab sa makadiyot.",
    err_invalid: "Dili kompleto ang tubag sa AI. Palihog sulayi pag-usab.",
    err_auth:
      "Dili husto ang setup sa serbisyo sa diksyonaryo. Kontaka ang developer sa app.",
    err_generic: "Adunay nasayop. Palihog sulayi pag-usab.",
    btn_try_again: "Sulayi Pag-usab",
    notice_approximate:
      "Na-save gikan sa lain nga form. Mahimong dili kini motugma niini nga form.",
    btn_explain_sentence: "Ipasabot kini nga sentence",
    label_sentence_meaning: "Sayon nga bersyon sa kini nga sentence",
    loading_sentence: "Gihimong sayon…",
    notice_ai_generated:
      "Gihimo sa AI. Pangutan-a ang ahensya kung dili ka sigurado.",
  },
};
