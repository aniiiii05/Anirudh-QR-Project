import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OperationsLens from "./OperationsLens";
import SmallIntention from "./SmallIntention";
import UsefulWorkflow from "./UsefulWorkflow";

afterEach(cleanup);

describe("The operations lens", () => {
  it("shows the calculated OTIF and switches sample period with aria-pressed", () => {
    render(<OperationsLens outcome="Outcome text" />);
    expect(screen.getByText("Exploring · demo")).toBeInTheDocument();
    expect(screen.getByTestId("otif-percent")).toHaveTextContent("70%");
    expect(
      screen.getByText("OTIF = orders delivered on time and in full ÷ all orders", { exact: false }),
    ).toBeInTheDocument();
    const a = screen.getByRole("button", { name: "Sample A" });
    const b = screen.getByRole("button", { name: "Sample B" });
    expect(a).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(b);
    expect(b).toHaveAttribute("aria-pressed", "true");
    expect(a).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("otif-percent")).toHaveTextContent("80%");
    const orders = screen.getByRole("list", { name: "Sample B orders" });
    expect(within(orders).getAllByRole("listitem")).toHaveLength(10);
    expect(orders.querySelectorAll("[data-both='true']")).toHaveLength(8);
    expect(screen.getByText(/not Anirudh’s business results/)).toBeInTheDocument();
  });
});

describe("One small intention", () => {
  it("enables the completion toggle only when both inputs have text", () => {
    render(<SmallIntention outcome="A small idea turned into a testable product journey." />);
    const toggle = screen.getByRole("button", { name: "Step done" });
    expect(toggle).toBeDisabled();
    expect(screen.getByText(/Add an intention and one small step/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("One intention"), {
      target: { value: "Read more" },
    });
    expect(toggle).toBeDisabled();
    fireEvent.change(screen.getByLabelText("One small next step"), {
      target: { value: "Pick one article" },
    });
    expect(toggle).toBeEnabled();
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Done\. That’s the whole journey/)).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("resets completion when the step changes and says nothing is stored", () => {
    render(<SmallIntention outcome="x" />);
    fireEvent.change(screen.getByLabelText("One intention"), { target: { value: "A" } });
    fireEvent.change(screen.getByLabelText("One small next step"), { target: { value: "B" } });
    const toggle = screen.getByRole("button", { name: "Step done" });
    fireEvent.click(toggle);
    fireEvent.change(screen.getByLabelText("One small next step"), { target: { value: "C" } });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/nothing is stored or sent, and refreshing clears it/)).toBeInTheDocument();
  });
});

describe("The useful workflow", () => {
  it("turns the sample notes into a checklist and handles empty input", () => {
    render(<UsefulWorkflow outcome="Less copying between tabs. More time to think." />);
    const list = screen.getByRole("list", { name: "Clean checklist" });
    expect(within(list).getAllByRole("checkbox")).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByRole("list", { name: "Clean checklist" })).toBeNull();
    expect(screen.getByText("Nothing to tidy yet.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Paste messy notes"), {
      target: { value: "- one\n\n* two\none" },
    });
    const items = within(screen.getByRole("list", { name: "Clean checklist" })).getAllByRole(
      "checkbox",
    );
    expect(items).toHaveLength(2);
    expect(screen.getByText(/2 clear steps · 2 lines removed/)).toBeInTheDocument();
  });

  it("renders pasted markup as text, never HTML", () => {
    const { container } = render(<UsefulWorkflow outcome="x" />);
    fireEvent.change(screen.getByLabelText("Paste messy notes"), {
      target: { value: "<img src=x onerror=alert(1)>\n<b>bold</b>" },
    });
    expect(container.querySelector(".checklist img")).toBeNull();
    expect(container.querySelector(".checklist b")).toBeNull();
    expect(screen.getByText("<b>bold</b>")).toBeInTheDocument();
  });

  it("shows a visible note when input is over the limit", () => {
    render(<UsefulWorkflow outcome="x" />);
    fireEvent.change(screen.getByLabelText("Paste messy notes"), {
      target: { value: "x".repeat(4100) },
    });
    expect(screen.getByText(/Only the first 4,000 characters were tidied/)).toBeInTheDocument();
  });
});

describe("Demo live regions", () => {
  it("announce only short status lines, never the list or echoed input", () => {
    const { container, unmount } = render(<UsefulWorkflow />);
    const live = container.querySelectorAll("[aria-live]");
    expect(live).toHaveLength(1);
    expect(live[0]).toHaveClass("checklist__summary");
    expect(live[0]).toHaveAttribute("aria-atomic", "true");
    // Whole row is the label, so the hit area is the row, not the 20px box.
    const box = container.querySelector(".checklist__box") as HTMLInputElement;
    expect(box.closest("label")).toHaveClass("checklist__row");
    expect(container.querySelector(".demo__outcome")).toBeNull();
    unmount();

    const intention = render(<SmallIntention />);
    fireEvent.change(screen.getByLabelText("One intention"), { target: { value: "Calm Sundays" } });
    fireEvent.change(screen.getByLabelText("One small next step"), { target: { value: "Plan tonight" } });
    const regions = intention.container.querySelectorAll("[aria-live]");
    expect(regions).toHaveLength(1);
    expect(regions[0]).not.toHaveTextContent("Calm Sundays");
    expect(regions[0]).toHaveTextContent("Not done yet.");
  });
});
