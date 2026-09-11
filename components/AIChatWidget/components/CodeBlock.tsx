"use client";

import React, { useState } from "react";

import { CheckIcon, CopyIcon } from "./Icons";
import { copyToClipboard } from "../utils/helpers";

export const codeText = (node: React.ReactNode): string =>
  typeof node === "string" || typeof node === "number"
    ? String(node)
    : Array.isArray(node)
      ? node.map(codeText).join("")
      : React.isValidElement<{ children?: React.ReactNode }>(node)
        ? codeText(node.props.children)
        : "";

const CodeBlock: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-([^\s]+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeContent = codeText(children).replace(/\n$/, "");

  const handleCopy = async () => {
    const success = await copyToClipboard(codeContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="ai-code-block">
      <div className="ai-code-header">
        <span>{language || "code"}</span>
        <button
          type="button"
          className={`ai-code-copy-btn ${copied ? "copied" : ""}`}
          onClick={handleCopy}
        >
          {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="ai-code-pre">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
