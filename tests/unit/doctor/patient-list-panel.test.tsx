// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PatientListPanel } from "@/components/doctor/patient-list-panel";

describe("PatientListPanel", () => {
  it("renders returned patient records and the empty state helper", () => {
    render(
      <PatientListPanel
        patients={[
          {
            id: "pat-1",
            name: "王敏",
            gender: "female",
            birthDate: "1980-07-10",
            phone: "13800000010",
            stomaDate: "2026-04-20",
            stomaType: "colostomy",
            medicalRecordNo: "MRN-1010",
            profileSource: "doctor_created",
            createdAt: "2026-04-20T09:00:00.000Z",
            updatedAt: "2026-04-20T09:00:00.000Z"
          }
        ]}
      />
    );

    expect(screen.getByText("王敏")).toBeInTheDocument();
    expect(screen.getByText(/病历号 MRN-1010/)).toBeInTheDocument();
    expect(screen.getByText("共 1 位患者")).toBeInTheDocument();
  });
});
