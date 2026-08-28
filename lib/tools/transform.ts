export interface TransformOption {
  key: string;
  label: string;
  type: 'select' | 'toggle' | 'text' | 'number';
  choices?: { value: string; label: string }[];
  defaultValue: string | boolean | number;
}

export interface TransformDef {
  run?: (input: string, opts: Record<string, string | boolean | number>) => string | Promise<string>;
  execution?: 'client' | 'server';
  /** 只依赖选项产出结果、不读取输入的工具，界面上不显示输入框 */
  generator?: boolean;
  reverse?: (input: string, opts: Record<string, string | boolean | number>) => string | Promise<string>;
  options?: TransformOption[];
  inputLabel?: string;
  outputLabel?: string;
  inputPlaceholder?: string;
  samples?: { label: string; value: string }[];
  outputLanguage?: 'json' | 'javascript' | 'html' | 'plain';
  warning?: string;
}
