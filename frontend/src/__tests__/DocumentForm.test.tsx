import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentForm from "@/components/DocumentForm";
import { TemplateVariable } from "@/lib/template";

const mockVariables: TemplateVariable[] = [
  { key: "name", label: "Full Name", type: "text", required: true },
  { key: "address", label: "Address", type: "text", required: false },
  { key: "start_date", label: "Start Date", type: "date", required: true },
  {
    key: "years",
    label: "Number of Years",
    type: "number",
    required: true,
    default: 2,
  },
  {
    key: "nda_type",
    label: "NDA Type",
    type: "select",
    required: true,
    options: ["mutual", "one-way"],
    default: "mutual",
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    required: false,
  },
];

const defaultValues: Record<string, string> = {
  name: "",
  address: "",
  start_date: "",
  years: "2",
  nda_type: "mutual",
  description: "",
};

describe("DocumentForm", () => {
  it("renders all variable labels", () => {
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of Years/)).toBeInTheDocument();
    expect(screen.getByLabelText(/NDA Type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
  });

  it("renders the form heading", () => {
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText("Document Details")).toBeInTheDocument();
  });

  it("shows required asterisk for required fields", () => {
    const { container } = render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );

    const asterisks = container.querySelectorAll(".text-red-500");
    // name, start_date, years, nda_type are required (4 fields)
    expect(asterisks.length).toBe(4);
  });

  it("renders text input for text type", () => {
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );
    const input = screen.getByLabelText(/Full Name/) as HTMLInputElement;
    expect(input.type).toBe("text");
  });

  it("renders date input for date type", () => {
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );
    const input = screen.getByLabelText(/Start Date/) as HTMLInputElement;
    expect(input.type).toBe("date");
  });

  it("renders number input for number type", () => {
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );
    const input = screen.getByLabelText(/Number of Years/) as HTMLInputElement;
    expect(input.type).toBe("number");
    expect(input.min).toBe("1");
  });

  it("renders select for select type with correct options", () => {
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );
    const select = screen.getByLabelText(/NDA Type/) as HTMLSelectElement;
    expect(select.tagName).toBe("SELECT");
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(["mutual", "one-way"]);
  });

  it("renders textarea for textarea type", () => {
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );
    const textarea = screen.getByLabelText(/Description/) as HTMLTextAreaElement;
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.rows).toBe(4);
  });

  it("capitalizes select option labels", () => {
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );
    const select = screen.getByLabelText(/NDA Type/) as HTMLSelectElement;
    const labels = Array.from(select.options).map((o) => o.textContent);
    expect(labels).toEqual(["Mutual", "One-way"]);
  });

  it("displays current values in inputs", () => {
    const values = { ...defaultValues, name: "Alice Corp", years: "5" };
    render(
      <DocumentForm
        variables={mockVariables}
        values={values}
        onChange={jest.fn()}
      />
    );
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe(
      "Alice Corp"
    );
    expect(
      (screen.getByLabelText(/Number of Years/) as HTMLInputElement).value
    ).toBe("5");
  });

  it("calls onChange when text input changes", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText(/Full Name/);
    await user.type(input, "A");
    expect(onChange).toHaveBeenCalledWith("name", "A");
  });

  it("calls onChange when select changes", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={onChange}
      />
    );

    const select = screen.getByLabelText(/NDA Type/);
    await user.selectOptions(select, "one-way");
    expect(onChange).toHaveBeenCalledWith("nda_type", "one-way");
  });

  it("calls onChange when textarea changes", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={onChange}
      />
    );

    const textarea = screen.getByLabelText(/Description/);
    await user.type(textarea, "A");
    expect(onChange).toHaveBeenCalledWith("description", "A");
  });

  it("does not submit the form on enter", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );

    const form = container.querySelector("form")!;
    const submitHandler = jest.fn();
    form.addEventListener("submit", submitHandler);

    const input = screen.getByLabelText(/Full Name/);
    await user.type(input, "{enter}");
    expect(submitHandler).not.toHaveBeenCalled();
  });

  it("renders with empty variables array", () => {
    render(<DocumentForm variables={[]} values={{}} onChange={jest.fn()} />);
    expect(screen.getByText("Document Details")).toBeInTheDocument();
  });

  it("sets placeholder on text inputs", () => {
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );
    const input = screen.getByLabelText(/Full Name/) as HTMLInputElement;
    expect(input.placeholder).toBe("Full Name");
  });

  it("sets required attribute on required inputs", () => {
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText(/Start Date/) as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText(/Number of Years/) as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText(/NDA Type/) as HTMLSelectElement).required).toBe(true);
  });

  it("does not set required attribute on optional inputs", () => {
    render(
      <DocumentForm
        variables={mockVariables}
        values={defaultValues}
        onChange={jest.fn()}
      />
    );
    expect((screen.getByLabelText(/Address/) as HTMLInputElement).required).toBe(false);
    expect((screen.getByLabelText(/Description/) as HTMLTextAreaElement).required).toBe(false);
  });
});
