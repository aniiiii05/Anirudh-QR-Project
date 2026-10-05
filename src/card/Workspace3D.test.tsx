import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Workspace3D from "./Workspace3D";

/**
 * The real RoomCanvas needs WebGL; jsdom has none. This stand-in records the
 * callbacks Workspace3D passes, so tests can drive ready / select / context
 * loss exactly as the canvas would.
 */
type CanvasProps = {
  area: string | null;
  onReady: () => void;
  onSelect: (area: "operations" | "practice" | "workflow") => void;
  onContextLost: () => void;
  onContextRestored: () => void;
};
const canvas = vi.hoisted(() => ({
  mounts: 0,
  shouldThrow: false,
  props: null as CanvasProps | null,
}));
vi.mock("./three/RoomCanvas", async () => {
  const { useEffect } = await import("react");
  function FakeRoomCanvas(props: CanvasProps) {
    if (canvas.shouldThrow) throw new Error("chunk failed");
    canvas.props = props;
    useEffect(() => {
      canvas.mounts++;
      props.onReady();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid="room-canvas" data-area={props.area ?? ""} />;
  }
  return { default: FakeRoomCanvas };
});

const webgl = vi.hoisted(() => ({ available: true }));
vi.mock("./three/webgl", () => ({ hasWebGL2: () => webgl.available }));

beforeEach(() => {
  canvas.mounts = 0;
  canvas.shouldThrow = false;
  canvas.props = null;
  webgl.available = true;
});
afterEach(cleanup);

const areaButtons = () => within(screen.getByRole("group", { name: "Workspace corners" }));

describe("Workspace3D still view", () => {
  it("renders the section copy verbatim with the poster and no canvas before Explore", () => {
    const { container } = render(<Workspace3D onExplore={() => {}} />);
    const section = container.querySelector("section#workspace");
    expect(section).not.toBeNull();
    expect(screen.getByText("A LITTLE ROOM FOR IDEAS")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Different tools. Same curiosity." })).toBeInTheDocument();
    expect(
      screen.getByText("An imaginary workspace for the things I like making. Pick a corner and take a closer look."),
    ).toBeInTheDocument();
    const poster = screen.getByRole("img", { name: /imaginary miniature workspace/i });
    expect(poster).toHaveAttribute("src", "/workspace-room.png");
    expect(poster).toHaveAttribute("width", "1600");
    expect(poster).toHaveAttribute("height", "1280");
    expect(container.querySelector('source[type="image/webp"]')).toHaveAttribute("srcset", "/workspace-room.webp");
    expect(container.querySelector("canvas")).toBeNull();
    expect(screen.queryByTestId("room-canvas")).toBeNull();
    expect(canvas.mounts).toBe(0);
    expect(screen.getByRole("link", { name: "3D inspiration & credits ↗" })).toHaveAttribute(
      "href",
      "/notices/3d-credits.txt",
    );
  });

  it("marks the selected corner with aria-pressed", () => {
    render(<Workspace3D onExplore={() => {}} />);
    const buttons = areaButtons();
    for (const name of ["Data", "Product", "Automation"])
      expect(buttons.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(buttons.getByRole("button", { name: "Product" }));
    expect(buttons.getByRole("button", { name: "Product" })).toHaveAttribute("aria-pressed", "true");
    expect(buttons.getByRole("button", { name: "Data" })).toHaveAttribute("aria-pressed", "false");
    // The matching hotspot pin is pressed too.
    expect(screen.getByRole("button", { name: "Focus the Product corner" })).toHaveAttribute("aria-pressed", "true");
  });

  it.each([
    ["Data", "Open The operations lens ↗", "operations"],
    ["Product", "Open One small intention ↗", "practice"],
    ["Automation", "Open The useful workflow ↗", "workflow"],
  ])("%s opens its project with the right id", (name, open, id) => {
    const onExplore = vi.fn();
    render(<Workspace3D onExplore={onExplore} />);
    expect(screen.queryByRole("button", { name: /^Open / })).toBeNull();
    fireEvent.click(areaButtons().getByRole("button", { name }));
    fireEvent.click(screen.getByRole("button", { name: open }));
    expect(onExplore).toHaveBeenCalledTimes(1);
    expect(onExplore).toHaveBeenCalledWith(id);
  });

  it("hotspot pins select a corner as well", () => {
    render(<Workspace3D onExplore={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Focus the Automation corner" }));
    expect(areaButtons().getByRole("button", { name: "Automation" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Open The useful workflow ↗" })).toBeInTheDocument();
  });

  it("Reset view clears the selection", () => {
    render(<Workspace3D onExplore={() => {}} />);
    const reset = screen.getByRole("button", { name: "Reset view" });
    expect(reset).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(areaButtons().getByRole("button", { name: "Data" }));
    expect(reset).not.toHaveAttribute("aria-disabled");
    fireEvent.click(reset);
    expect(areaButtons().getByRole("button", { name: "Data" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: /^Open / })).toBeNull();
    expect(reset).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps keyboard focus on Reset view after resetting in still mode", () => {
    render(<Workspace3D onExplore={() => {}} />);
    fireEvent.click(areaButtons().getByRole("button", { name: "Data" }));
    const reset = screen.getByRole("button", { name: "Reset view" });
    reset.focus();
    fireEvent.click(reset);
    expect(reset).toBeInTheDocument();
    expect(document.activeElement).toBe(reset);
  });

  it("renders the status message outside the stage so it cannot cover the pins", () => {
    webgl.available = false;
    const { container } = render(<Workspace3D onExplore={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Explore in 3D ↗" }));
    const status = screen.getByRole("status");
    expect(status.closest(".room-stage")).toBeNull();
    expect(container.querySelector(".room-pins")).not.toContain(status);
  });
});

describe("Workspace3D live view", () => {
  it("loads the canvas only after Explore and returns to the still image", async () => {
    render(<Workspace3D onExplore={() => {}} />);
    expect(canvas.mounts).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Explore in 3D ↗" }));
    expect(screen.getByRole("status")).toHaveTextContent(/3D/);
    expect(await screen.findByTestId("room-canvas")).toBeInTheDocument();
    expect(canvas.mounts).toBe(1);
    // The poster stays in the DOM underneath (it fades out once the canvas is ready).
    expect(screen.getByRole("img", { name: /imaginary miniature workspace/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset view" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use still image" }));
    expect(screen.queryByTestId("room-canvas")).toBeNull();
    expect(screen.getByRole("button", { name: "Explore in 3D ↗" })).toBeInTheDocument();
  });

  it("passes the selected area to the canvas and accepts picks from it", async () => {
    render(<Workspace3D onExplore={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Explore in 3D ↗" }));
    const stage = await screen.findByTestId("room-canvas");
    fireEvent.click(areaButtons().getByRole("button", { name: "Data" }));
    expect(stage).toHaveAttribute("data-area", "operations");
    act(() => canvas.props!.onSelect("workflow"));
    expect(areaButtons().getByRole("button", { name: "Automation" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Reset view" }));
    expect(stage).toHaveAttribute("data-area", "");
  });

  it("falls back cleanly when WebGL2 is unavailable", () => {
    webgl.available = false;
    const onExplore = vi.fn();
    render(<Workspace3D onExplore={onExplore} />);
    fireEvent.click(screen.getByRole("button", { name: "Explore in 3D ↗" }));
    expect(screen.getByRole("status")).toHaveTextContent("3D isn’t available on this device");
    expect(screen.queryByTestId("room-canvas")).toBeNull();
    expect(canvas.mounts).toBe(0);
    expect(screen.getByRole("button", { name: "Explore in 3D ↗" })).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(areaButtons().getByRole("button", { name: "Automation" }));
    fireEvent.click(screen.getByRole("button", { name: "Open The useful workflow ↗" }));
    expect(onExplore).toHaveBeenCalledWith("workflow");
  });

  it("shows a retry when the 3D chunk fails, and the retry loads it", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    canvas.shouldThrow = true;
    render(<Workspace3D onExplore={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Explore in 3D ↗" }));
    const retry = await screen.findByRole("button", { name: "Try 3D again" });
    expect(screen.getByRole("status")).toHaveTextContent("couldn’t load");
    fireEvent.click(areaButtons().getByRole("button", { name: "Data" }));
    expect(screen.getByRole("button", { name: "Open The operations lens ↗" })).toBeInTheDocument();
    canvas.shouldThrow = false;
    fireEvent.click(retry);
    expect(await screen.findByTestId("room-canvas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use still image" })).toBeInTheDocument();
    error.mockRestore();
  });

  it("handles a lost WebGL context and offers a retry once it is restored", async () => {
    render(<Workspace3D onExplore={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Explore in 3D ↗" }));
    await screen.findByTestId("room-canvas");
    act(() => canvas.props!.onContextLost());
    expect(screen.getByRole("status")).toHaveTextContent("graphics context was lost");
    expect(screen.getByRole("button", { name: "Use still image" })).toBeInTheDocument();
    fireEvent.click(areaButtons().getByRole("button", { name: "Product" }));
    expect(screen.getByRole("button", { name: "Open One small intention ↗" })).toBeInTheDocument();
    act(() => canvas.props!.onContextRestored());
    fireEvent.click(screen.getByRole("button", { name: "Try 3D again" }));
    expect(await screen.findByTestId("room-canvas")).toBeInTheDocument();
    expect(canvas.mounts).toBe(2);
  });
});
