import { memo } from 'react';
import { Button } from '@/components/ui/button';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { githubLight } from "@uiw/codemirror-theme-github";

const myFontTheme = EditorView.theme({
  '&': {
    fontFamily: '"Geist Mono", monospace',
    fontSize: '16px',
    lineHeight: '1.6'
  },
  '.cm-content': {
    fontFamily: '"Geist Mono", monospace'
  },
  '.cm-gutters': {
    fontFamily: '"Geist Mono", monospace'
  },
  '.cm-lineNumbers': {
    fontFamily: '"Geist Mono", monospace'
  },
  '.cm-line': {
    fontFamily: '"Geist Mono", monospace'
  },
  '.cm-scroller': {
    fontFamily: '"Geist Mono", monospace'
  },
  '.cm-tooltip': {
    fontFamily: '"Geist Mono", monospace'
  }
});

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  onFormat: () => void;
}

export const JsonEditor = memo<JsonEditorProps>(({
  value,
  onChange,
  isValid,
  onFormat
}) => {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-y-scroll max-h-[400px] hidebar">
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={[json(), myFontTheme]}
          theme={githubLight}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: false,
            tabSize: 2,
            autocompletion: true,
          }}
          style={{
            fontSize: '14px',
            maxHeight: '400px'
          }}
        />
      </div>

      <div className="flex items-center w-full justify-between gap-2">
        {!isValid && (
          <span className="text-red-600 text-sm">Invalid JSON</span>
        )}
        <Button
          variant="outline"
          size="sm"
          className='rounded-[6px]'
          onClick={onFormat}
        >
          Format
        </Button>
      </div>
    </div>
  );
});

JsonEditor.displayName = 'JsonEditor';
