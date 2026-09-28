import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Workspace3D from "./Workspace3D";
afterEach(cleanup);
it("keeps the workspace usable before WebGL is loaded", () => {
  const onExplore = vi.fn();
  const { container } = render(<Workspace3D onExplore={onExplore} />);
  expect(container.querySelector("canvas")).toBeNull();
  expect(screen.getByRole("img")).toHaveAttribute("src", "/workspace-room.png");
  fireEvent.click(screen.getByRole("button", { name: "Product ↗" }));
  expect(screen.getByRole("button", { name: "Product ↗" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Try this demo ↗" }));
  expect(onExplore).toHaveBeenCalledWith("practice");
});
it("resetting the camera also clears the selected area", () => {
  render(<Workspace3D onExplore={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Data ↗" }));
  fireEvent.click(screen.getByRole("button", { name: "Reset view" }));
  expect(screen.queryByRole("button", { name: "Try this demo ↗" })).toBeNull();
  expect(screen.getByRole("button", { name: "Data ↗" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
