import { parseIframeInput } from "@/lib/parser";

describe("parseIframeInput", () => {
  it("should parse a valid iframe tag", () => {
    const input = `<iframe width="600" height="371" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQ/pubchart?oid=123&format=interactive"></iframe>`;
    const result = parseIframeInput(input);

    expect(result.success).toBe(true);
    expect(result.config?.src).toContain("docs.google.com");
    expect(result.config?.baseWidth).toBe(600);
    expect(result.config?.baseHeight).toBe(371);
    expect(result.errors).toHaveLength(0);
  });

  it("should parse iframe with single quotes", () => {
    const input = `<iframe width='800' height='450' src='https://docs.google.com/spreadsheets/d/test/pubchart?oid=456'></iframe>`;
    const result = parseIframeInput(input);

    expect(result.success).toBe(true);
    expect(result.config?.baseWidth).toBe(800);
    expect(result.config?.baseHeight).toBe(450);
  });

  it("should use defaults when width/height missing", () => {
    const input = `<iframe src="https://docs.google.com/spreadsheets/d/test/pubchart?oid=789"></iframe>`;
    const result = parseIframeInput(input);

    expect(result.success).toBe(true);
    expect(result.config?.baseWidth).toBe(700);
    expect(result.config?.baseHeight).toBe(300);
    expect(result.warnings).toContain(
      "No width attribute found, defaulting to 700px."
    );
  });

  it("should handle URL-only input", () => {
    const input = "https://docs.google.com/spreadsheets/d/test/pubchart?oid=999";
    const result = parseIframeInput(input);

    expect(result.success).toBe(true);
    expect(result.config?.src).toBe(input);
    expect(result.config?.baseWidth).toBe(700);
    expect(result.config?.baseHeight).toBe(300);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("should warn for non-Google domains", () => {
    const input = `<iframe width="600" height="400" src="https://example.com/chart"></iframe>`;
    const result = parseIframeInput(input);

    expect(result.success).toBe(true);
    expect(result.warnings).toContain(
      "The src URL does not appear to be from docs.google.com. This may not work as expected."
    );
  });

  it("should return error for empty input", () => {
    const result = parseIframeInput("");

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Input is empty");
  });

  it("should return error for missing iframe tag", () => {
    const input = "<div>Not an iframe</div>";
    const result = parseIframeInput(input);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("No <iframe> tag found");
  });

  it("should return error for iframe without src", () => {
    const input = `<iframe width="600" height="400"></iframe>`;
    const result = parseIframeInput(input);

    expect(result.success).toBe(false);
    expect(result.errors).toContain("No src attribute found in iframe tag.");
  });

  it("should handle decimal width/height values", () => {
    const input = `<iframe width="600.5" height="371.25" src="https://docs.google.com/test"></iframe>`;
    const result = parseIframeInput(input);

    expect(result.success).toBe(true);
    expect(result.config?.baseWidth).toBe(600.5);
    expect(result.config?.baseHeight).toBe(371.25);
  });
});
