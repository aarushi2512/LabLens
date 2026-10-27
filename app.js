/* LabLens: all processing happens in the browser. No data is sent anywhere. */
(function () {
  "use strict";

  // ---------- Field definitions ----------
  const FIELDS = [
    { id: "age",        en: "Age",                 hi: "à¤†à¤¯à¥",                unit: "years",      min: 18,  max: 100,  step: 1 },
    { id: "hb",         en: "Hemoglobin",          hi: "à¤¹à¥€à¤®à¥‹à¤—à¥à¤²à¥‹à¤¬à¤¿à¤¨",         unit: "g/dL",       min: 2,   max: 25,   step: 0.1, group: "cbc" },
    { id: "hct",        en: "Hematocrit",          hi: "à¤¹à¥€à¤®à¤¾à¤Ÿà¥‹à¤•à¥à¤°à¤¿à¤Ÿ",          unit: "%",          min: 10,  max: 70,   step: 0.1, group: "cbc" },
    { id: "wbc",        en: "WBC",                 hi: "WBC (à¤¶à¥à¤µà¥‡à¤¤ à¤°à¤•à¥à¤¤ à¤•à¤£)",   unit: "Ã—10Â³/ÂµL",    min: 0.5, max: 100,  step: 0.1, group: "cbc" },
    { id: "rbc",        en: "RBC",                 hi: "RBC (à¤²à¤¾à¤² à¤°à¤•à¥à¤¤ à¤•à¤£)",    unit: "Ã—10â¶/ÂµL",    min: 1,   max: 9,    step: 0.01, group: "cbc" },
    { id: "mcv",        en: "MCV",                 hi: "MCV",                unit: "fL",         min: 50,  max: 130,  step: 0.1, group: "cbc" },
    { id: "rdw",        en: "RDW",                 hi: "RDW",                unit: "%",          min: 8,   max: 30,   step: 0.1, group: "cbc" },
    { id: "plt",        en: "Platelets",           hi: "à¤ªà¥à¤²à¥‡à¤Ÿà¤²à¥‡à¤Ÿà¥à¤¸",           unit: "Ã—10Â³/ÂµL",    min: 5,   max: 1500, step: 1,   group: "cbc" },
    { id: "glucose",    en: "Glucose",             hi: "à¤—à¥à¤²à¥‚à¤•à¥‹à¤œà¤¼ (à¤¶à¥à¤—à¤°)",       unit: "mg/dL",      min: 20,  max: 800,  step: 1,   group: "sugar" },
    { id: "hba1c",      en: "HbA1c",               hi: "HbA1c",              unit: "%",          min: 3,   max: 18,   step: 0.1, group: "sugar" },
    { id: "creatinine", en: "Creatinine",          hi: "à¤•à¥à¤°à¤¿à¤à¤Ÿà¤¿à¤¨à¤¿à¤¨",           unit: "mg/dL",      min: 0.1, max: 20,   step: 0.01, group: "kft" },
    { id: "uric_acid",  en: "Uric acid",           hi: "à¤¯à¥‚à¤°à¤¿à¤• à¤à¤¸à¤¿à¤¡",           unit: "mg/dL",      min: 0.5, max: 20,   step: 0.1, group: "kft" },
    { id: "alt",        en: "ALT (SGPT)",          hi: "ALT (SGPT)",         unit: "U/L",        min: 1,   max: 3000, step: 1,   group: "lft" },
    { id: "ast",        en: "AST (SGOT)",          hi: "AST (SGOT)",         unit: "U/L",        min: 1,   max: 3000, step: 1,   group: "lft" },
    { id: "tchol",      en: "Total cholesterol",   hi: "à¤•à¥à¤² à¤•à¥‹à¤²à¥‡à¤¸à¥à¤Ÿà¥à¤°à¥‰à¤²",       unit: "mg/dL",      min: 50,  max: 600,  step: 1,   group: "lipid" },
    { id: "hdl",        en: "HDL",                 hi: "HDL",                unit: "mg/dL",      min: 5,   max: 200,  step: 1,   group: "lipid" },
    { id: "ldl",        en: "LDL",                 hi: "LDL",                unit: "mg/dL",      min: 10,  max: 400,  step: 1,   group: "lipid" },
    { id: "tg",         en: "Triglycerides",       hi: "à¤Ÿà¥à¤°à¤¾à¤‡à¤—à¥à¤²à¤¿à¤¸à¤°à¤¾à¤‡à¤¡à¥à¤¸",       unit: "mg/dL",      min: 20,  max: 3000, step: 1,   group: "lipid" },
    { id: "bmi",        en: "BMI",                 hi: "BMI",                unit: "kg/mÂ²",      min: 10,  max: 80,   step: 0.1 },
  ];
  const FIELD = Object.fromEntries(FIELDS.map(f => [f.id, f]));

  // ---------- Conditions ----------
  const CONDS = [
    { key: "y_anemia",   en: "Anemia",                    hi: "à¤à¤¨à¥€à¤®à¤¿à¤¯à¤¾ (à¤–à¥‚à¤¨ à¤•à¥€ à¤•à¤®à¥€)",       test: "hb",    testEn: "Hemoglobin (CBC)",             testHi: "à¤¹à¥€à¤®à¥‹à¤—à¥à¤²à¥‹à¤¬à¤¿à¤¨ (CBC)" },
    { key: "y_diabetes", en: "Prediabetes / Diabetes",    hi: "à¤ªà¥à¤°à¥€à¤¡à¤¾à¤¯à¤¬à¤¿à¤Ÿà¥€à¤œà¤¼ / à¤¡à¤¾à¤¯à¤¬à¤¿à¤Ÿà¥€à¤œà¤¼",    test: "hba1c", testEn: "HbA1c",                        testHi: "HbA1c" },
    { key: "y_kidney",   en: "Reduced kidney function",   hi: "à¤•à¤¿à¤¡à¤¨à¥€ à¤•à¥€ à¤•à¤¾à¤°à¥à¤¯à¤•à¥à¤·à¤®à¤¤à¤¾ à¤®à¥‡à¤‚ à¤•à¤®à¥€", test: "creatinine", testEn: "Serum creatinine (KFT)", testHi: "à¤¸à¥€à¤°à¤® à¤•à¥à¤°à¤¿à¤à¤Ÿà¤¿à¤¨à¤¿à¤¨ (KFT)" },
    { key: "y_liver",    en: "Liver stress",              hi: "à¤²à¤¿à¤µà¤° à¤ªà¤° à¤¦à¤¬à¤¾à¤µ",              test: "alt",   testEn: "ALT / SGPT (LFT)",             testHi: "ALT / SGPT (LFT)" },
    { key: "y_ldl",      en: "High LDL cholesterol",      hi: "à¤‰à¤šà¥à¤š LDL à¤•à¥‹à¤²à¥‡à¤¸à¥à¤Ÿà¥à¤°à¥‰à¤²",        test: "ldl",   testEn: "Lipid profile (LDL)",          testHi: "à¤²à¤¿à¤ªà¤¿à¤¡ à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤² (LDL)" },
  ];

  // ---------- UI strings ----------
  const T = {
    en: {
      workspace:"Workspace", overview:"Overview", reader:"Report reader", review:"Review values", screening:"Screening", localSession:"Private session", aiReady:"AI READER READY",
      heroEyebrow:"PERSONAL LAB WORKSPACE", heroTitle:"Your health data, in a clearer light.", tagline:"Upload a report to extract and review its laboratory values.", disclaimer:"Preliminary screening only, not a diagnosis. Always discuss your results with a healthcare professional.",
      uploadKicker:"REPORT INTAKE", uploadTitle:"Bring in a lab report", uploadDescription:"Extract key values and organize them for your review.", dropPrompt:"Drop your report here", or:"or", browse:"browse files", fileHints:"PDF, JPG, PNG, WEBP, TXT, CSV, JSON · max 8 MB", privacy:"Your report is sent to this server and then to the configured AI provider for analysis.", extractButton:"Extract values & create summary", extracting:"Reading your report...",
      reviewKicker:"REVIEW & EDIT", reviewTitle:"Check your lab values", reviewDescription:"AI extraction can make mistakes. Compare every value with the original report.", editable:"EDITABLE", reviewNotice:"Review and correct extracted values before running a preliminary screening.", sample:"Load sample", clear:"Clear", runScreening:"Run preliminary screening", insightKicker:"PRELIMINARY INSIGHTS", screeningTitle:"Screening overview", insightPlaceholderTitle:"Your results will appear here", insightPlaceholder:"Review your values, then run a preliminary screening to see the indicator cards.", modelWarning:"Demo model uses placeholder weights and is not clinically validated. Results are not medical advice.", privacyTitle:"Your data, handled with care", privacyCard:"Reports are sent to the configured AI provider for extraction.", resultsKicker:"SCREENING OUTPUT", results:"Preliminary screening", resultsDescription:"Decision support only. A healthcare professional can interpret your results in context.", preliminary:"PRELIMINARY", footerLine:"A clearer view of your lab results", footerPrivacy:"Reports are sent to the configured AI provider for extraction.",
      sex:"Sex", notGiven:"Not given", male:"Male", female:"Female", rangeNote:"Compare with your report interval", gBasic:"Basics", gcbc:"Blood count (CBC)", gsugar:"Blood sugar", gkft:"Kidney", glft:"Liver", glipid:"Lipids",
      analyze:"Analyze", predicted:"Demo model output", measured:"Measured value", abnormal:"Outside screening threshold", normal:"Within screening threshold", low:"Lower model band", medium:"Middle model band", high:"Higher model band", why:"Details", whyMeasured:"Based on the entered {test} value and the prototype cutoff.", noReasons:"Not enough entered values to explain this estimate.", next:"Suggested next test", nextWhy:"The {cond} model output is most uncertain. This test may add useful context.", nextNone:"The key test for each indicator is already entered.", critical:"Some entered values are far outside the prototype thresholds. Please seek clinical advice:", enterSomething:"Enter at least one value first.", up:"raises model output", down:"lowers model output", above:"{name} {val} is above a usual screening level", below:"{name} {val} is below a usual screening level", sexF:"Female reference factor", sexM:"Male reference factor", invalid:"Out of range, ignored",
    },
    hi: {
      workspace:"कार्यस्थान", overview:"अवलोकन", reader:"रिपोर्ट रीडर", review:"मानों की समीक्षा", screening:"स्क्रीनिंग", localSession:"निजी सत्र", aiReady:"AI रीडर तैयार",
      heroEyebrow:"व्यक्तिगत लैब कार्यस्थान", heroTitle:"आपकी स्वास्थ्य जानकारी, स्पष्ट रूप में।", tagline:"रिपोर्ट अपलोड करें और लैब मानों की समीक्षा करें।", disclaimer:"केवल प्रारंभिक स्क्रीनिंग, निदान नहीं। परिणामों पर स्वास्थ्य विशेषज्ञ से चर्चा करें।",
      uploadKicker:"रिपोर्ट जोड़ें", uploadTitle:"लैब रिपोर्ट जोड़ें", uploadDescription:"मुख्य मान निकालें और समीक्षा के लिए व्यवस्थित करें।", dropPrompt:"रिपोर्ट यहां छोड़ें", or:"या", browse:"फ़ाइल चुनें", fileHints:"PDF, JPG, PNG, WEBP, TXT, CSV, JSON · अधिकतम 8 MB", privacy:"विश्लेषण के लिए रिपोर्ट इस सर्वर और फिर चुने गए AI प्रदाता को भेजी जाती है।", extractButton:"मान निकालें और सारांश बनाएं", extracting:"रिपोर्ट पढ़ी जा रही है...",
      reviewKicker:"समीक्षा और संपादन", reviewTitle:"लैब मान जांचें", reviewDescription:"AI से निकले मान गलत हो सकते हैं। हर मान मूल रिपोर्ट से मिलाएं।", editable:"संपादन योग्य", reviewNotice:"प्रारंभिक स्क्रीनिंग से पहले निकाले गए मानों की समीक्षा और सुधार करें।", sample:"नमूना भरें", clear:"साफ़ करें", runScreening:"प्रारंभिक स्क्रीनिंग चलाएं", insightKicker:"प्रारंभिक जानकारी", screeningTitle:"स्क्रीनिंग अवलोकन", insightPlaceholderTitle:"आपके परिणाम यहां दिखेंगे", insightPlaceholder:"मानों की समीक्षा करें, फिर स्क्रीनिंग चलाएं।", modelWarning:"डेमो मॉडल में प्लेसहोल्डर वेट हैं और इसका क्लिनिकल सत्यापन नहीं हुआ है। यह चिकित्सा सलाह नहीं है।", privacyTitle:"आपकी जानकारी का ध्यान", privacyCard:"रिपोर्ट निकालने के लिए चुने गए AI प्रदाता को भेजी जाती है।", resultsKicker:"स्क्रीनिंग परिणाम", results:"प्रारंभिक स्क्रीनिंग", resultsDescription:"केवल निर्णय सहायता। स्वास्थ्य विशेषज्ञ परिणामों को संदर्भ में समझ सकते हैं।", preliminary:"प्रारंभिक", footerLine:"लैब परिणामों की स्पष्ट जानकारी", footerPrivacy:"रिपोर्ट निकालने के लिए चुने गए AI प्रदाता को भेजी जाती है।",
      sex:"लिंग", notGiven:"नहीं बताया", male:"पुरुष", female:"महिला", rangeNote:"रिपोर्ट की संदर्भ सीमा से तुलना करें", gBasic:"मूल जानकारी", gcbc:"रक्त गणना (CBC)", gsugar:"रक्त शर्करा", gkft:"किडनी", glft:"लिवर", glipid:"लिपिड", analyze:"विश्लेषण करें", predicted:"डेमो मॉडल आउटपुट", measured:"मापा गया मान", abnormal:"स्क्रीनिंग सीमा से बाहर", normal:"स्क्रीनिंग सीमा के भीतर", low:"कम मॉडल बैंड", medium:"मध्यम मॉडल बैंड", high:"उच्च मॉडल बैंड", why:"विवरण", whyMeasured:"दर्ज {test} मान और प्रोटोटाइप सीमा पर आधारित।", noReasons:"इस अनुमान को समझाने के लिए पर्याप्त मान नहीं हैं।", next:"अगली सुझाई गई जांच", nextWhy:"{cond} मॉडल आउटपुट सबसे अनिश्चित है। यह जांच अतिरिक्त संदर्भ दे सकती है।", nextNone:"हर संकेतक की मुख्य जांच दर्ज है।", critical:"कुछ दर्ज मान प्रोटोटाइप सीमाओं से बहुत बाहर हैं। कृपया स्वास्थ्य विशेषज्ञ से सलाह लें:", enterSomething:"पहले कम से कम एक मान दर्ज करें।", up:"मॉडल आउटपुट बढ़ाता है", down:"मॉडल आउटपुट घटाता है", above:"{name} {val} सामान्य स्क्रीनिंग स्तर से ऊपर है", below:"{name} {val} सामान्य स्क्रीनिंग स्तर से नीचे है", sexF:"महिला संदर्भ कारक", sexM:"पुरुष संदर्भ कारक", invalid:"सीमा से बाहर, अनदेखा किया गया",
    }
  };

  // ---------- Core maths (no DOM; testable in Node) ----------
  const sigmoid = z => 1 / (1 + Math.exp(-z));

  // Same steps as the notebook: log -> median fill + missing flag -> standardise -> logistic
  function predict(model, logFeats, x) {
    let z = model.intercept;
    const contrib = [];
    for (const f of model.features) {
      let v = x[f];
      const missing = v === null || v === undefined || Number.isNaN(v);
      if (missing) {
        z += model.coef_missing[f];
        v = model.median[f];                 // already in transformed space
      } else if (logFeats.includes(f)) {
        v = Math.log1p(v);
      }
      const zs = (v - model.mean[f]) / model.std[f];
      const c = model.coef[f] * zs;
      z += c;
      if (!missing) contrib.push({ f, c, zs });
    }
    return { p: sigmoid(z), contrib };
  }

  // CKD-EPI 2021 (race-free), same formula as the notebook
  function egfr(scr, age, female) {
    const k = female ? 0.7 : 0.9, a = female ? -0.241 : -0.302, r = scr / k;
    return 142 * Math.pow(Math.min(r, 1), a) * Math.pow(Math.max(r, 1), -1.2) *
           Math.pow(0.9938, age) * (female ? 1.012 : 1);
  }

  // If the defining test is present, use the standard cutoff instead of a prediction
  function measuredStatus(key, x) {
    const has = v => v !== null && v !== undefined && !Number.isNaN(v);
    switch (key) {
      case "y_anemia":
        if (!has(x.hb)) return null;
        { const cut = x.female === 1 ? 12 : 13;
          return { abnormal: x.hb < cut, label: `Hb ${x.hb} g/dL (cutoff < ${cut})` }; }
      case "y_diabetes":
        if (!has(x.hba1c)) return null;
        return { abnormal: x.hba1c >= 5.7, label: `HbA1c ${x.hba1c}% (cutoff â‰¥ 5.7)` };
      case "y_kidney":
        if (!has(x.creatinine) || !has(x.age) || !has(x.female)) return null;
        { const e = egfr(x.creatinine, x.age, x.female === 1);
          return { abnormal: e < 60, label: `eGFR ${e.toFixed(0)} (cutoff < 60)` }; }
      case "y_liver":
        if (!has(x.alt)) return null;
        return { abnormal: x.alt > 40, label: `ALT ${x.alt} U/L (cutoff > 40)` };
      case "y_ldl":
        if (has(x.ldl)) return { abnormal: x.ldl >= 130, label: `LDL ${x.ldl} mg/dL (cutoff â‰¥ 130)` };
        if (has(x.tchol) && has(x.hdl) && has(x.tg) && x.tg < 400) {
          const l = x.tchol - x.hdl - x.tg / 5;     // Friedewald
          return { abnormal: l >= 130, label: `LDL â‰ˆ ${l.toFixed(0)} mg/dL, calculated (cutoff â‰¥ 130)` };
        }
        return null;
    }
    return null;
  }

  // Critical values: deliberately simple, conservative "see a doctor" triggers
  function criticalFlags(x) {
    const out = [], has = v => v !== null && v !== undefined && !Number.isNaN(v);
    if (has(x.hb) && x.hb < 7) out.push(`Hemoglobin ${x.hb} g/dL`);
    if (has(x.glucose) && (x.glucose < 54 || x.glucose > 400)) out.push(`Glucose ${x.glucose} mg/dL`);
    if (has(x.plt) && x.plt < 50) out.push(`Platelets ${x.plt} Ã—10Â³/ÂµL`);
    if (has(x.wbc) && (x.wbc < 2 || x.wbc > 30)) out.push(`WBC ${x.wbc} Ã—10Â³/ÂµL`);
    if (has(x.alt) && x.alt > 200) out.push(`ALT ${x.alt} U/L`);
    if (has(x.creatinine) && has(x.age) && has(x.female) && egfr(x.creatinine, x.age, x.female === 1) < 15)
      out.push(`eGFR below 15`);
    return out;
  }

  const band = p => (p < 0.25 ? "low" : p < 0.5 ? "medium" : "high");
  const entropy = p => (p <= 0 || p >= 1) ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));

  function analyze(M, x) {
    const results = CONDS.map(c => {
      const measured = measuredStatus(c.key, x);
      const pred = predict(M.models[c.key], M.log_feats, x);
      return { cond: c, measured, ...pred };
    });
    // Next test = defining test of the condition whose prediction is most uncertain
    const candidates = results.filter(r => !r.measured);
    let next = null;
    if (candidates.length) next = candidates.reduce((a, b) => (entropy(b.p) > entropy(a.p) ? b : a));
    return { results, next, critical: criticalFlags(x) };
  }

  const core = { predict, egfr, measuredStatus, criticalFlags, analyze, band, FIELDS, CONDS };
  if (typeof window !== "undefined") window.LabLensCore = core;
  if (typeof module !== "undefined") module.exports = core;
  if (typeof document === "undefined") return;

  // ---------- UI ----------
  let lang = "en";
  const M = window.LABLENS_MODEL;
  const $ = s => document.querySelector(s);
  const t = (k, vars = {}) => T[lang][k].replace(/\{(\w+)\}/g, (_, v) => vars[v]);

  const SAMPLE = { age: 52, sex: "1", hb: 12.6, hct: 38, wbc: 7.2, rbc: 4.3, mcv: 82, rdw: 15.1, plt: 260,
    glucose: 118, uric_acid: 6.8, alt: 52, ast: 38, tchol: 225, hdl: 38, tg: 210, bmi: 29.5 };

  const GROUPS = [["basic", null], ["cbc", "cbc"], ["sugar", "sugar"], ["kft", "kft"], ["lft", "lft"], ["lipid", "lipid"]];

  function buildForm() {
    const wrap = $("#fields");
    if (!wrap) return;
    wrap.innerHTML = "";
    for (const [g, key] of GROUPS) {
      const fs = document.createElement("fieldset");
      fs.className = "field-group";
      const title = g === "basic" ? t("gBasic") : t("g" + g);
      let html = `<legend>${title}</legend><div class="field-grid">`;
      if (g === "basic") {
        html += `<label class="field-label" for="f_sex">${t("sex")}
          <select id="f_sex" class="field-control">
            <option value="">${t("notGiven")}</option><option value="1">${t("male")}</option><option value="2">${t("female")}</option>
          </select></label>`;
      }
      for (const f of FIELDS.filter(f => (f.group || null) === key || (g === "basic" && !f.group))) {
        html += `<label class="field-label" for="f_${f.id}">${lang === "hi" ? f.en : f.en}
          <input id="f_${f.id}" type="number" inputmode="decimal" step="${f.step}" min="${f.min}" max="${f.max}" aria-describedby="hint_${f.id}" placeholder="${f.unit}" class="field-control" />
          <span id="hint_${f.id}" class="field-hint">${f.unit} · ${t("rangeNote")}</span></label>`;
      }
      fs.innerHTML = html + "</div>";
      wrap.appendChild(fs);
    }
    wrap.querySelectorAll("input, select").forEach(el => el.addEventListener("input", () => {
      const field = FIELDS.find(item => "f_" + item.id === el.id);
      if (!field) return;
      const value = Number(el.value);
      const invalid = el.value !== "" && (!Number.isFinite(value) || value < field.min || value > field.max);
      el.classList.toggle("is-invalid", invalid);
      el.setAttribute("aria-invalid", String(invalid));
    }));
  }

  function readInputs() {
    const x = {}, bad = [];
    let any = false;
    for (const f of FIELDS) {
      const el = $("#f_" + f.id), raw = el.value.trim();
      el.classList.remove("is-invalid");
      if (raw === "") { x[f.id] = NaN; continue; }
      const v = parseFloat(raw);
      if (Number.isNaN(v) || v < f.min || v > f.max) { x[f.id] = NaN; el.classList.add("is-invalid"); bad.push(f.id); continue; }
      x[f.id] = v; any = true;
    }
    const s = $("#f_sex").value;
    x.female = s === "" ? NaN : (s === "2" ? 1 : 0);
    return { x, any: any || s !== "", bad };
  }

  function reasonText(r, x) {
    if (r.f === "female") return `${x.female === 1 ? t("sexF") : t("sexM")} &rarr; ${r.c > 0 ? t("up") : t("down")}`;
    const fd = FIELD[r.f], name = fd.en, val = `(${x[r.f]} ${fd.unit})`;
    const lvl = r.zs >= 0 ? t("above", { name, val }) : t("below", { name, val });
    return `${lvl} &rarr; ${r.c > 0 ? t("up") : t("down")}`;
  }

  const COLORS = {
    low: "bg-emerald-100 text-emerald-800", medium: "bg-amber-100 text-amber-800", high: "bg-rose-100 text-rose-800",
    bar: { low: "bg-emerald-500", medium: "bg-amber-500", high: "bg-rose-500" },
  };

  function render(out, x) {
    const box = $("#results");
    let html = "";
    if (out.critical.length) {
      html += `<div role="alert" class="critical-alert"><strong>! ${t("critical")}</strong><ul>${out.critical.map(c => `<li>${c}</li>`).join("")}</ul></div>`;
    }
    for (const [index, r] of out.results.entries()) {
      const name = r.cond.en;
      if (r.measured) {
        const status = r.measured.abnormal ? "abnormal" : "normal";
        html += `<article class="result-card" style="--delay:${index * 65}ms"><h3>${name}</h3><div class="result-status ${status}">${t(status)}</div>
          <p class="result-reading">${t("measured")}: ${r.measured.label}</p><p class="result-why">${t("whyMeasured", { test: r.cond.testEn })}</p></article>`;
      } else {
        const b = band(r.p), pct = Math.round(r.p * 100);
        const top = [...r.contrib].sort((a, c) => Math.abs(c.c) - Math.abs(a.c)).filter(c => Math.abs(c.c) > 0.01).slice(0, 3);
        html += `<article class="result-card" style="--delay:${index * 65}ms"><h3>${name}</h3><div class="result-status ${b}">${t(b)}</div>
          <p class="result-reading">${t("predicted")}</p><div class="meter ${b}" role="img" aria-label="${t("predicted")}: ${t(b)}"><span style="--meter:${Math.max(8, pct)}%"></span></div>
          <details class="result-details"><summary>${t("why")}</summary>${top.length ? `<ul>${top.map(c => `<li>${reasonText(c, x)}</li>`).join("")}</ul>` : `<p>${t("noReasons")}</p>`}</details></article>`;
      }
    }
    const n = out.next;
    html += n ? `<div class="next-test"><div><h3>${t("next")}</h3><p>${t("nextWhy", { cond: n.cond.en })}</p></div><span class="next-tag">${n.cond.testEn}</span></div>` : `<div class="next-test"><div><h3>${t("next")}</h3><p>${t("nextNone")}</p></div></div>`;
    box.innerHTML = html;
    $("#resultsWrap").classList.remove("hidden");
    const placeholder = document.querySelector(".placeholder-insight");
    if (placeholder) placeholder.classList.add("is-complete");
  }

  let last = null;
  function run() {
    const { x, any, bad } = readInputs();
    $("#msg").textContent = bad.length ? t("invalid") + ": " + bad.join(", ") : "";
    if (!any) { $("#msg").textContent = t("enterSomething"); return; }
    last = x;
    render(analyze(M, x), x);
    $("#resultsWrap").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  function applyLang() {
    const existing = {};
    if ($("#fields")) for (const f of FIELDS) existing[f.id] = $("#f_" + f.id)?.value ?? "";
    if ($("#f_sex")) existing.sex = $("#f_sex").value;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-t]").forEach(el => (el.textContent = t(el.dataset.t)));
    if (M && $("#fields")) buildForm();
    if ($("#fields")) {
      for (const f of FIELDS) if (existing[f.id]) $("#f_" + f.id).value = existing[f.id];
      if (existing.sex) $("#f_sex").value = existing.sex;
    }
    $("#langBtn").textContent = lang === "en" ? "हिन्दी" : "English";
    if (last) render(analyze(M, last), last);
  }

  // ---------- AI report upload ----------
  let selectedReport = null;
  const REPORT_MAX_BYTES = 8 * 1024 * 1024;

  function formatFileSize(bytes) {
    return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));
  }

  function setReportFile(file) {
    const meta = $("#fileMeta");
    if (!file) {
      selectedReport = null;
      meta.classList.add("hidden");
      $("#uploadAnalyzeBtn").disabled = true;
      return;
    }
    if (file.size > REPORT_MAX_BYTES) {
      $("#uploadMsg").textContent = "This file is larger than 8 MB. Please choose a smaller report.";
      return;
    }
    selectedReport = file;
    meta.classList.remove("hidden");
    meta.classList.add("flex");
    meta.innerHTML = `<span>ðŸ“Ž <strong>${escapeHtml(file.name)}</strong> <span class="text-slate-500">(${formatFileSize(file.size)})</span></span><button id="removeReport" type="button" class="text-rose-700 hover:underline">Remove</button>`;
    $("#removeReport").onclick = () => setReportFile(null);
    $("#uploadAnalyzeBtn").disabled = false;
    $("#uploadMsg").textContent = "";
  }

  function fillExtractedValues(values) {
    if (!values || typeof values !== "object") return 0;
    let count = 0;
    Object.entries(values).forEach(([key, value]) => {
      const el = $("#f_" + key);
      if (el && value !== null && value !== undefined && value !== "") { el.value = value; count++; }
    });
    if (values.sex && $("#f_sex")) $("#f_sex").value = String(values.sex).toLowerCase() === "female" ? "2" : String(values.sex).toLowerCase() === "male" ? "1" : "";
    return count;
  }

  function renderOcn(report) {
    const values = report.values || {};
    const rows = Object.entries(values).filter(([, value]) => value !== null && value !== undefined && value !== "").map(([key, value]) => {
      const field = FIELD[key];
      return `<tr class="border-t border-slate-100"><td class="px-3 py-2 font-medium">${escapeHtml(field ? field.en : key)}</td><td class="px-3 py-2">${escapeHtml(value)}</td><td class="px-3 py-2 text-slate-500">${escapeHtml(field ? field.unit : "")}</td></tr>`;
    }).join("");
    const list = items => (Array.isArray(items) && items.length) ? `<ul class="mt-1 list-disc pl-5">${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="mt-1 text-slate-600">Not provided.</p>`;
    $("#ocnResults").innerHTML = `<div class="rounded-xl border border-teal-200 bg-teal-50 p-4">
      <div class="flex flex-wrap items-center justify-between gap-2"><h3 class="text-lg font-bold text-teal-900">OCN summary</h3><span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-800">${escapeHtml(report.provider || "AI")}</span></div>
      <div class="mt-4 grid gap-4 md:grid-cols-3"><div><h4 class="font-semibold text-teal-900">Observations</h4>${list(report.observations)}</div><div><h4 class="font-semibold text-teal-900">Conclusion</h4><p class="mt-1 text-slate-700">${escapeHtml(report.conclusion || "Not provided.")}</p></div><div><h4 class="font-semibold text-teal-900">Next steps</h4>${list(report.nextSteps)}</div></div>
      <div class="mt-5 overflow-x-auto rounded-lg bg-white"><table class="w-full text-left text-sm"><thead class="bg-slate-100 text-xs uppercase tracking-wide text-slate-500"><tr><th class="px-3 py-2">Test</th><th class="px-3 py-2">Value</th><th class="px-3 py-2">Unit</th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="px-3 py-3 text-slate-500">No supported numeric values were found.</td></tr>'}</tbody></table></div>
      <p class="mt-3 text-xs text-slate-600">Extracted values were copied into the form below. Review them against the original report before analyzing. This is a screening aid, not a diagnosis.</p></div>`;
    $("#ocnResults").classList.remove("hidden");
  }

  async function analyzeUploadedReport() {
    if (!selectedReport) return;
    const button = $("#uploadAnalyzeBtn");
    button.disabled = true; button.textContent = "Reading reportâ€¦"; $("#uploadMsg").textContent = "";
    try {
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("Could not read the selected file.")); reader.readAsDataURL(selectedReport); });
      const response = await fetch("/api/analyze-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: selectedReport.name, type: selectedReport.type, data, provider: "openrouter" }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The report could not be analyzed.");
      renderOcn(body.report);
      const count = fillExtractedValues(body.report.values);
      $("#uploadMsg").className = "mt-2 text-sm text-emerald-700";
      $("#uploadMsg").textContent = `${count} value${count === 1 ? "" : "s"} copied into the form. Review and click Analyze below.`;
    } catch (error) {
      $("#uploadMsg").className = "mt-2 text-sm text-rose-700";
      $("#uploadMsg").textContent = error.name === "TypeError" ? "Cannot reach the LabLens server. Start it with: npm start" : error.message;
    } finally { button.disabled = !selectedReport; button.textContent = "Extract values & create OCN"; }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!M) { document.body.innerHTML = "<p style='padding:2rem'>model.js is missing. Put it next to index.html.</p>"; return; }
    buildForm();
    applyLang();
    $("#langBtn").onclick = () => { lang = lang === "en" ? "hi" : "en"; applyLang(); };
    $("#analyzeBtn").onclick = run;
    $("#sampleBtn").onclick = () => {
      for (const f of FIELDS) $("#f_" + f.id).value = SAMPLE[f.id] ?? "";
      $("#f_sex").value = SAMPLE.sex;
      $("#msg").textContent = "";
      run();
    };
    $("#clearBtn").onclick = () => {
      for (const f of FIELDS) $("#f_" + f.id).value = "";
      $("#f_sex").value = "";
      $("#msg").textContent = "";
      $("#resultsWrap").classList.add("hidden");
    };
    $("#printBtn").onclick = () => window.print();
    $("#reportFile").onchange = event => setReportFile(event.target.files[0]);
    $("#uploadAnalyzeBtn").onclick = analyzeUploadedReport;
    const dropZone = $("#dropZone");
    ["dragenter", "dragover"].forEach(eventName => dropZone.addEventListener(eventName, event => { event.preventDefault(); dropZone.classList.add("drop-active"); }));
    ["dragleave", "drop"].forEach(eventName => dropZone.addEventListener(eventName, event => { event.preventDefault(); dropZone.classList.remove("drop-active"); }));
    dropZone.addEventListener("drop", event => setReportFile(event.dataTransfer.files[0]));
  });
})();

