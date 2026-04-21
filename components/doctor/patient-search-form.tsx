import Link from "next/link";

type SearchParams = {
  name?: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  stomaDate?: string;
  stomaType?: string;
  medicalRecordNo?: string;
};

export function PatientSearchForm({ search }: { search: SearchParams }) {
  return (
    <section className="portal-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Combinational Query</p>
          <h2>组合检索</h2>
        </div>
        <span className="muted">7 个字段任意组合</span>
      </div>

      <form className="form-grid" method="GET" style={{ marginTop: 16 }}>
        <div className="grid-compact">
          <div className="field">
            <label htmlFor="name">姓名</label>
            <input defaultValue={search.name} id="name" name="name" />
          </div>
          <div className="field">
            <label htmlFor="gender">性别</label>
            <select defaultValue={search.gender ?? ""} id="gender" name="gender">
              <option value="">全部</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="unknown">未标注</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="birthDate">出生日期</label>
            <input defaultValue={search.birthDate} id="birthDate" name="birthDate" type="date" />
          </div>
          <div className="field">
            <label htmlFor="phone">手机号</label>
            <input defaultValue={search.phone} id="phone" name="phone" />
          </div>
          <div className="field">
            <label htmlFor="stomaDate">造口日期</label>
            <input defaultValue={search.stomaDate} id="stomaDate" name="stomaDate" type="date" />
          </div>
          <div className="field">
            <label htmlFor="stomaType">造口类型</label>
            <select defaultValue={search.stomaType ?? ""} id="stomaType" name="stomaType">
              <option value="">全部</option>
              <option value="ileostomy">回肠造口</option>
              <option value="colostomy">结肠造口</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="medicalRecordNo">病历号</label>
            <input
              defaultValue={search.medicalRecordNo}
              id="medicalRecordNo"
              name="medicalRecordNo"
            />
          </div>
        </div>

        <div className="inline-row">
          <button className="button-primary" type="submit">
            搜索患者
          </button>
          <Link className="button-secondary" href="/doctor/patients">
            清空条件
          </Link>
        </div>
      </form>
    </section>
  );
}
