import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders UNO header", () => {
  render(<App />);
  expect(screen.getByText("UNO")).toBeInTheDocument();
});
