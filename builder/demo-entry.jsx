// Review demo for #168: the real m22–m24 component, plus ready-made sample
// files a reviewer can send straight into its upload.
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import "@fontsource-variable/heebo";
import "../src/index.css";
import "../src/tovspace/tovspace.css";
import { LangProvider, useLang } from "../src/i18n/LangContext";
import { ThemeProvider } from "../src/theme/ThemeContext";
import { AccessibilityProvider } from "../src/theme/AccessibilityContext";
import { SaveProvider } from "../src/state/SaveContext";
import { TaskFinishHostProvider } from "../src/tovspace/TaskFinishHost";
import { AnswerKey } from "../src/tovspace/AnswerKey";
import {
  SheetCalculationEasy,
  SheetCalculationMedium,
  SheetCalculationHard,
} from "../src/tovspace/modules/SheetCalculation";
import { expectedSheet } from "../src/state/sheetCalcLogic";
import { buildZip } from "../src/fileformats/zip";

const LEVELS = [
  { id: "m22", label: "Easy", Comp: SheetCalculationEasy },
  { id: "m23", label: "Medium", Comp: SheetCalculationMedium },
  { id: "m24", label: "Hard", Comp: SheetCalculationHard },
];

// The sample-file panel's own words, in the language the task is in.
const PANEL = {
  en: {
    title: "Ready-made files",
    lede: "Download the file below, change it in your own spreadsheet program and upload it back. Or, for a quick look, send the task one of these files, built for the version on screen, in the language on screen:",
    files: {
      right: ["Done right", "Formulas filled down, as Excel saves them"],
      typed: ["Typed numbers", "The right values, typed in without formulas"],
      mistakes: ["Two mistakes", 'The SUM misses the last row, and "low" uses ≤'],
    },
    sent: (label) => `Uploaded “${label}”. Press the task's check button below to see the verdict.`,
    noInput: "Couldn't find the upload box.",
    sheet: (name) => `What the downloaded file holds (${name})`,
  },
  he: {
    title: "קבצים מוכנים",
    lede: "הורידו את הקובץ שלמטה, שנו אותו בתוכנת הגיליונות שלכם והעלו אותו בחזרה. או, להצצה מהירה, שלחו למשימה אחד מהקבצים האלה. הם בנויים לגרסה ולשפה שעל המסך:",
    files: {
      right: ["עשוי נכון", "נוסחאות שהועתקו לכל השורות, כמו ש-Excel שומר אותן"],
      typed: ["מספרים מוקלדים", "הערכים הנכונים, מוקלדים בלי נוסחאות"],
      mistakes: ["שתי טעויות", "ה-SUM מדלג על השורה האחרונה, ו\"מלאי נמוך\" משתמש ב-≤"],
    },
    sent: (label) => `הועלה הקובץ “${label}”. לחצו למטה על כפתור הסיום והבדיקה של המשימה כדי לראות את התוצאה.`,
    noInput: "לא נמצאה תיבת ההעלאה.",
    sheet: (name) => `מה יש בקובץ שמורידים (${name})`,
  },
};

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const str = (ref, s) => `<c r="${ref}" t="inlineStr"><is><t>${esc(s)}</t></is></c>`;
const num = (ref, x) => `<c r="${ref}"><v>${x}</v></c>`;
const r2 = (x) => Math.round(x * 100) / 100;

/*
  The three ready-made files:
  - right: formulas filled down the way Excel saves them (shared formulas);
  - typed: the right numbers and words, typed in, no formulas;
  - mistakes: the sum leaves out the last row, and Low stock uses <= so an
    item exactly at its minimum is wrongly marked (medium and hard have one).
*/
function sampleXlsx(kind, v, t, lang) {
  const n = v.rows.length;
  const last = n + 1;
  const exp = expectedSheet(v);
  const [yes, no] = lang === "he" ? ["כן", "לא"] : ["Yes", "No"];
  const totalCol = v.place?.total ?? "F";
  const lowCol = v.place?.low ?? "G";
  const sumRef = v.place?.sum ?? `F${n + 2}`;
  const op = kind === "mistakes" ? "<=" : "<";
  const ifText = esc(`IF(D2${op}E2,"${yes}","${no}")`);
  const rows = [
    `<row r="1">${v.columns.map((h, c) => str(`${"ABCDE"[c]}1`, h)).join("")}${str(`${totalCol}1`, t.columns.total)}${str(`${lowCol}1`, t.columns.low)}</row>`,
  ];
  v.rows.forEach((r, i) => {
    const R = i + 2;
    const total = r2(exp.totals[i]);
    const isLow = kind === "mistakes" ? r.stock <= r.min : exp.low[i];
    const word = isLow ? yes : no;
    let extra;
    if (kind === "typed") {
      extra = num(`${totalCol}${R}`, total) + str(`${lowCol}${R}`, word);
    } else if (R === 2) {
      extra =
        `<c r="${totalCol}2"><f t="shared" ref="${totalCol}2:${totalCol}${last}" si="0">B2*C2</f><v>${total}</v></c>` +
        `<c r="${lowCol}2" t="str"><f t="shared" ref="${lowCol}2:${lowCol}${last}" si="1">${ifText}</f><v>${esc(word)}</v></c>`;
    } else {
      extra =
        `<c r="${totalCol}${R}"><f t="shared" si="0"/><v>${total}</v></c>` +
        `<c r="${lowCol}${R}" t="str"><f t="shared" si="1"/><v>${esc(word)}</v></c>`;
    }
    rows.push(
      `<row r="${R}">${str(`A${R}`, r.item)}${num(`B${R}`, r.qty)}${num(`C${R}`, r.price)}${num(`D${R}`, r.stock)}${num(`E${R}`, r.min)}${extra}</row>`,
    );
  });
  const sumTo = kind === "mistakes" ? last - 1 : last;
  const sumVal = kind === "mistakes" ? r2(exp.totals.slice(0, n - 1).reduce((a, b) => a + b, 0)) : r2(exp.sum);
  const sumCell =
    kind === "typed" ? num(sumRef, sumVal) : `<c r="${sumRef}"><f>SUM(${totalCol}2:${totalCol}${sumTo})</f><v>${sumVal}</v></c>`;
  rows.push(`<row r="${sumRef.slice(1)}">${sumCell}</row>`);
  return buildZip({ "xl/worksheets/sheet1.xml": `<worksheet ${NS}><sheetData>${rows.join("")}</sheetData></worksheet>` });
}

/** Hands a built file to the task's own (hidden) file input, as a picked file would arrive. */
function upload(stage, bytes, name) {
  const input = stage?.querySelector('input[type="file"]');
  if (!input) return false;
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], name, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function Demo() {
  const { strings, lang, setLang } = useLang();
  const [level, setLevel] = useState(0);
  const [variant, setVariant] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [raw, setRaw] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [stage, setStage] = useState(null);
  const [note, setNote] = useState(null);

  const { id, Comp } = LEVELS[level];
  const t = strings.tovspace[id];
  const v = t.variants[variant];
  const ak = strings.tovspace.presentation.answerKey;
  const p = PANEL[lang] ?? PANEL.en;

  const host = useMemo(
    () => ({
      kind: "presentation",
      primary: {
        label: revealed ? ak.hideBtn : ak.showBtn,
        pressed: revealed,
        onClick: (payload) => {
          if (payload) setRaw(payload);
          setRevealed((x) => !x);
        },
      },
      onEditStart: () => setRevealed(false),
    }),
    [revealed, ak],
  );

  function restart(nextLevel, nextVariant) {
    setLevel(nextLevel);
    setVariant(nextVariant);
    setNonce((x) => x + 1);
    setRaw(null);
    setRevealed(false);
    setNote(null);
  }

  function sendSample(kind) {
    const ok = upload(stage, sampleXlsx(kind, v, t, lang), v.fileName);
    setNote(ok ? { kind } : { kind: null });
  }

  return (
    <>
      <div className="sd-controls" dir="ltr" lang="en">
        <div className="sd-group" role="group" aria-label="Level">
          <span className="sd-label">Level</span>
          {LEVELS.map((l, i) => (
            <button key={l.id} type="button" className="sd-chip" aria-pressed={i === level} onClick={() => restart(i, variant)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="sd-group" role="group" aria-label="Version">
          <span className="sd-label">Version</span>
          {t.variants.map((x, i) => (
            <button key={i} type="button" className="sd-chip" aria-pressed={i === variant} onClick={() => restart(level, i)}>
              {i + 1}. {x.workplaceName}
            </button>
          ))}
        </div>
        <div className="sd-group" role="group" aria-label="Language">
          <span className="sd-label">Language</span>
          <button type="button" className="sd-chip" aria-pressed={lang === "he"} onClick={() => setLang("he")}>עברית</button>
          <button type="button" className="sd-chip" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
        </div>
      </div>

      <section className="sd-files" dir={lang === "he" ? "rtl" : "ltr"} lang={lang} aria-label={p.title}>
        <div>
          <h2>{p.title}</h2>
          <p>{p.lede}</p>
        </div>
        <div className="sd-file-btns">
          {["right", "typed", "mistakes"].map((kind) => (
            <button key={kind} type="button" className="sd-file" onClick={() => sendSample(kind)}>
              <b>{p.files[kind][0]}</b>
              <span>{p.files[kind][1]}</span>
            </button>
          ))}
        </div>
        {note && (
          <p className="sd-note" role="status">
            {note.kind ? p.sent(p.files[note.kind][0]) : p.noInput}
          </p>
        )}
        <details className="sd-sheet">
          <summary>{p.sheet(v.fileName)}</summary>
          <div className="sd-table-wrap">
            <table dir={lang === "he" ? "rtl" : "ltr"}>
              <thead>
                <tr>
                  <th></th>
                  {["A", "B", "C", "D", "E"].map((c) => <th key={c}>{c}</th>)}
                </tr>
                <tr>
                  <th>1</th>
                  {v.columns.map((h) => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {v.rows.map((r, i) => (
                  <tr key={i}>
                    <th>{i + 2}</th>
                    <td>{r.item}</td>
                    <td>{r.qty}</td>
                    <td>{r.price}</td>
                    <td>{r.stock}</td>
                    <td>{r.min}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <div className="sd-stage" ref={setStage}>
        <TaskFinishHostProvider value={host}>
          <Comp
            key={`${id}-${variant}-${nonce}`}
            elapsed={() => 0}
            logEvent={() => {}}
            onDone={(payload) => {
              setRaw(payload);
              setRevealed(true);
            }}
            forcedVariant={variant}
          />
        </TaskFinishHostProvider>
        {revealed && (
          <div className="fade-in" style={{ marginTop: 12 }}>
            <AnswerKey moduleId={id} variant={v} raw={raw} />
          </div>
        )}
      </div>
    </>
  );
}

createRoot(document.getElementById("sheet-demo")).render(
  <StrictMode>
    <MemoryRouter>
      <ThemeProvider>
        <AccessibilityProvider>
          <LangProvider>
            <SaveProvider>
              <Demo />
            </SaveProvider>
          </LangProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </MemoryRouter>
  </StrictMode>,
);
