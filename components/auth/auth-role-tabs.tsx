type AuthRoleTabsProps = {
  activeRole: "patient" | "doctor";
  onChange: (role: "patient" | "doctor") => void;
};

export function AuthRoleTabs({ activeRole, onChange }: AuthRoleTabsProps) {
  return (
    <div className="segmented-tabs" role="tablist" aria-label="选择登录角色">
      <button
        aria-pressed={activeRole === "patient"}
        className={activeRole === "patient" ? "segmented-tab active" : "segmented-tab"}
        onClick={() => onChange("patient")}
        type="button"
      >
        患者
      </button>
      <button
        aria-pressed={activeRole === "doctor"}
        className={activeRole === "doctor" ? "segmented-tab active" : "segmented-tab"}
        onClick={() => onChange("doctor")}
        type="button"
      >
        医生
      </button>
    </div>
  );
}
