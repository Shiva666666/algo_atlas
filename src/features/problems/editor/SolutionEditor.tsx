import Editor from '@monaco-editor/react';

import type { Difficulty, ProblemStatus } from '../../../shared/contracts/index';

import type { useProblemEditor } from './useProblemEditor';

type Model = ReturnType<typeof useProblemEditor>;
export function SolutionEditor({ model }: { model: Model }) {
  const { form, update } = model;
  return (
    <article className="panel code-panel">
      <div className="panel-title">
        <span>02 / PYTHON SOLUTION</span>
        <small>STORED ONLY · NEVER EXECUTED</small>
      </div>
      <Editor
        height="440px"
        theme="vs-dark"
        language="python"
        value={form.python_code}
        onChange={(value) => update('python_code', value ?? '')}
        options={{
          fontSize: 13,
          fontFamily: 'DM Mono, monospace',
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 18 },
          lineNumbersMinChars: 3,
          renderLineHighlight: 'gutter',
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </article>
  );
}
