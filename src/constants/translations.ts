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
  | "notice_ai_generated"
  | "badge_dictionary"
  | "research_title"
  | "research_desc"
  | "research_privacy"
  | "research_export"
  | "research_clear"
  | "research_clear_msg"
  | "research_cancel"
  | "research_helpful"
  | "research_thanks"
  | "research_empty"
  | "form_chip_about"
  | "form_unsure_chip"
  | "form_unsure_hint"
  | "form_picker_title"
  | "form_none"
  | "form_not_this"
  | "form_unavailable"
  | "form_draft"
  | "form_label_purpose"
  | "form_label_who"
  | "form_label_prepare"
  | "form_label_sections"
  | "form_label_submit"
  | "form_label_reminder"
  | "form_last_checked"
  | "research_show_drafts";

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
    badge_dictionary: "From dictionary",
    research_title: "Research mode (for testers)",
    research_desc:
      "Saves how long lookups take, where each answer came from, and your ratings. Everything stays on this phone until you export it.",
    research_privacy:
      "The words you tap are saved too, so don't use real personal forms while this is on.",
    research_export: "Export results (CSV)",
    research_clear: "Clear results",
    research_clear_msg: "Delete all saved research results from this phone?",
    research_cancel: "Cancel",
    research_helpful: "Was this helpful?",
    research_thanks: "Thanks for your feedback!",
    research_empty: "Nothing recorded yet.",
    form_chip_about: "About this form",
    form_unsure_chip: "Which form is this?",
    form_unsure_hint: "This looks like one of these forms.",
    form_picker_title: "Choose the form",
    form_none: "None of these",
    form_not_this: "Not this form?",
    form_unavailable: "Summary not available yet.",
    form_draft: "DRAFT: not verified yet",
    form_label_purpose: "What it is for",
    form_label_who: "Who uses it",
    form_label_prepare: "What to prepare",
    form_label_sections: "What is on the form",
    form_label_submit: "Where to submit",
    form_label_reminder: "Reminder",
    form_last_checked: "Last checked",
    research_show_drafts: "Show draft form summaries",
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
    badge_dictionary: "Mula sa diksyunaryo",
    research_title: "Research mode (para sa mga tester)",
    research_desc:
      "Sine-save ang tagal ng bawat paghahanap, kung saan galing ang sagot, at ang mga rating mo. Mananatili ang lahat sa phone na ito hanggang i-export mo.",
    research_privacy:
      "Isine-save rin ang mga salitang pinindot mo, kaya huwag gumamit ng totoong personal na form habang naka-on ito.",
    research_export: "I-export ang resulta (CSV)",
    research_clear: "Burahin ang resulta",
    research_clear_msg:
      "Burahin ang lahat ng naka-save na research result sa phone na ito?",
    research_cancel: "Kanselahin",
    research_helpful: "Nakatulong ba ito?",
    research_thanks: "Salamat sa feedback mo!",
    research_empty: "Wala pang naitala.",
    form_chip_about: "Tungkol sa form na ito",
    form_unsure_chip: "Anong form ito?",
    form_unsure_hint: "Mukhang isa ito sa mga form na ito.",
    form_picker_title: "Piliin ang form",
    form_none: "Wala sa mga ito",
    form_not_this: "Hindi ito ang form?",
    form_unavailable: "Wala pang summary.",
    form_draft: "DRAFT: hindi pa na-verify",
    form_label_purpose: "Para saan ito",
    form_label_who: "Sino ang gumagamit",
    form_label_prepare: "Ihanda",
    form_label_sections: "Ano ang nasa form",
    form_label_submit: "Saan ibibigay",
    form_label_reminder: "Paalala",
    form_last_checked: "Huling na-check",
    research_show_drafts: "Ipakita ang mga draft na summary ng form",
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
    badge_dictionary: "Gikan sa diksyonaryo",
    research_title: "Research mode (para sa mga tester)",
    research_desc:
      "Gi-save ang gidugayon sa matag pagpangita, asa gikan ang tubag, ug imong mga rating. Magpabilin ang tanan sa kini nga phone hangtod i-export nimo.",
    research_privacy:
      "Gi-save usab ang mga pulong nga imong gi-tap, busa ayaw gamita ang tinuod nga personal nga form samtang naka-on kini.",
    research_export: "I-export ang resulta (CSV)",
    research_clear: "Papason ang resulta",
    research_clear_msg:
      "Papason ba ang tanang naka-save nga research result niini nga phone?",
    research_cancel: "Kanselahon",
    research_helpful: "Nakatabang ba kini?",
    research_thanks: "Salamat sa imong feedback!",
    research_empty: "Wala pay natala.",
    form_chip_about: "Mahitungod niini nga form",
    form_unsure_chip: "Unsang form kini?",
    form_unsure_hint: "Morag usa kini niini nga mga form.",
    form_picker_title: "Pilia ang form",
    form_none: "Wala niini",
    form_not_this: "Dili kini nga form?",
    form_unavailable: "Wala pa'y summary.",
    form_draft: "DRAFT: wala pa ma-verify",
    form_label_purpose: "Para saan kini",
    form_label_who: "Kinsa ang mogamit",
    form_label_prepare: "Andama",
    form_label_sections: "Unsa ang naa sa form",
    form_label_submit: "Asa ihatag",
    form_label_reminder: "Paalala",
    form_last_checked: "Katapusang gi-check",
    research_show_drafts: "Ipakita ang mga draft nga summary sa form",
  },
};
