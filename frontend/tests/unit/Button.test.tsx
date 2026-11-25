import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../../src/shared/ui/Button";

describe("Button", () => {
  it("renders its label and handles a click", () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Сохранить</Button>);

    const button = screen.getByRole("button", { name: "Сохранить" });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("supports the native disabled state", () => {
    render(<Button disabled>Недоступно</Button>);

    expect(screen.getByRole("button", { name: "Недоступно" })).toBeDisabled();
  });
});
