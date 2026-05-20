type AuthModeTabsProps = {
  activeMode: "login" | "register";
  onChange: (mode: "login" | "register") => void;
};

export function AuthModeTabs({ activeMode, onChange }: AuthModeTabsProps) {
  return (
    <div className="subtle-tabs" role="tablist" aria-label="选择患者认证方式">
      <button
        aria-pressed={activeMode === "login"}
        className={activeMode === "login" ? "subtle-tab active" : "subtle-tab"}
        onClick={() => onChange("login")}
        type="button"
      >
        登录
      </button>
      <button
        aria-pressed={activeMode === "register"}
        className={activeMode === "register" ? "subtle-tab active" : "subtle-tab"}
        onClick={() => onChange("register")}
        type="button"
      >
        注册
      </button>
    </div>
  );
}
