import i18n from "../../i18n/i18n";

export default function LanguageSwitch() {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button onClick={() => i18n.changeLanguage("en")}>EN</button>
      <button onClick={() => i18n.changeLanguage("sr")}>SR</button>
    </div>
  );
}