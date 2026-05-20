// @vitest-environment jsdom

import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PatientListPanel } from "@/components/doctor/patient-list-panel";

describe("PatientListPanel", () => {
  it("renders a dense patient card and expands into follow-up details", async () => {
    const user = userEvent.setup();

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
            updatedAt: "2026-04-20T09:00:00.000Z",
            followupCount: 1,
            totalImageCount: 2,
            latestFollowupDate: "2026-04-20",
            followups: [
              {
                id: "followup-1",
                followupDate: "2026-04-20",
                status: "completed",
                imageCount: 2,
                positions: ["sitting_front", "sitting_side"],
                images: [
                  {
                    id: "img-1",
                    browserUrl: "/api/images/img-1",
                    originalFilename: "front.jpg",
                    positionType: "sitting_front",
                    shotDate: "2026-04-20"
                  }
                ],
                report: {
                  status: "finalized",
                  conclusion: "正常",
                  severityGrade: null,
                  doctorComment: "恢复平稳"
                }
              }
            ]
          }
        ]}
      />
    );

    expect(screen.getByText("王敏")).toBeInTheDocument();
    expect(screen.getByText(/病历号 MRN-1010/)).toBeInTheDocument();
    expect(screen.getByText("共 1 位患者")).toBeInTheDocument();
    expect(screen.getByText("front.jpg")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "收起档案" }));
    expect(screen.queryByText("front.jpg")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "展开档案" }));
    expect(screen.getByText("front.jpg")).toBeInTheDocument();
    expect(screen.getByText("恢复平稳")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "2026-04-20 端坐正位" })).toBeInTheDocument();
  });
});
