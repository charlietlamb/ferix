import { CodeBlock } from "./code-block";
import { DocCell } from "./doc-components";
import type { CliExample } from "./types";

interface CliExamplesProps {
  examples: readonly CliExample[];
  getTranslation: (key: string) => string;
  colSpan?: 2 | 3;
}

export function CliExamples({
  examples,
  getTranslation,
  colSpan = 2,
}: CliExamplesProps) {
  const colSpanClass = colSpan === 3 ? "lg:col-span-3" : "lg:col-span-2";

  return (
    <>
      {examples.map(({ key, code }) => (
        <DocCell
          className={colSpanClass}
          description={getTranslation(`example_${key}_desc`)}
          key={key}
          title={getTranslation(`example_${key}`)}
        >
          <CodeBlock code={code} />
        </DocCell>
      ))}
    </>
  );
}
