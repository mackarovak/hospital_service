import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginPage } from "../../src/features/auth/LoginPage";

const { post } = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("../../src/shared/api/client", () => ({
  api: { post },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    post.mockReset();
    localStorage.clear();
  });

  it("logs in a patient and redirects to the patient area", async () => {
    post.mockResolvedValue({
      data: {
        access_token: "test-token",
        user: { role: "PATIENT" },
      },
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/patient" element={<p>Patient area</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText("Логин"), "patient1");
    await userEvent.type(screen.getByLabelText("Пароль"), "password");
    await userEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(post).toHaveBeenCalledWith("/auth/login", {
      login: "patient1",
      password: "password",
    });
    expect(localStorage.getItem("access_token")).toBe("test-token");
    expect(await screen.findByText("Patient area")).toBeInTheDocument();
  });

  it("shows a friendly error when login fails", async () => {
    post.mockRejectedValue(new Error("Unauthorized"));

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("Не удалось войти")).toBeInTheDocument();
  });
});
