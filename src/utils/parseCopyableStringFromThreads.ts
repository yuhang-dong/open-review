import * as vscode from "vscode";

function normalizeBody(body: string | vscode.MarkdownString): string {
  return typeof body === "string" ? body : (body.value ?? "");
}

function escapeCodeFence(text: string) {
  // 避免评论里本身出现 ``` 破坏 fence（简单处理足够用）
  return text.replace(/```/g, "``\\`");
}

function formatRange(range: vscode.Range): { startLine1: number; endLine1: number } {
  return { startLine1: range.start.line + 1, endLine1: range.end.line + 1 };
}

function threadLocationLinkAbs(uri: vscode.Uri, range?: vscode.Range): string {
  // 绝对路径（mac/linux: /Users/...）
  const absPath = uri.fsPath;

  const line = range ? range.start.line + 1 : 1;
  const col = range ? range.start.character + 1 : 1;

  // vscode://file/<absolute path>:line:col
  // path 里需要 URI 编码（空格等）
  const encoded = encodeURI(absPath);
  return `vscode://file/${encoded}:${line}:${col}`;
}

export function exportThreadsAsMarkdown(allThreads: vscode.CommentThread[]): string {
  // 1) 按文件分组（用 fsPath 作为 key）
  const byFile = new Map<string, { uri: vscode.Uri; threads: vscode.CommentThread[] }>();
  for (const t of allThreads) {
    const key = t.uri.fsPath;
    const item = byFile.get(key);
    if (item) item.threads.push(t);
    else byFile.set(key, { uri: t.uri, threads: [t] });
  }

  const files = [...byFile.values()].sort((a, b) =>
    a.uri.fsPath.localeCompare(b.uri.fsPath)
  );

  const out: string[] = [];

  for (const file of files) {
    out.push(`## File: ${file.uri.fsPath}`);

    const threads = file.threads.sort(
      (a, b) => (a.range?.start.line ?? 0) - (b.range?.start.line ?? 0)
    );

    for (const thread of threads) {
      const rangeText = thread.range
        ? (() => {
            const { startLine1, endLine1 } = formatRange(thread.range);
            return startLine1 === endLine1 ? `L${startLine1}` : `L${startLine1}-L${endLine1}`;
          })()
        : "Unknown range";

      const link = threadLocationLinkAbs(thread.uri, thread.range);
      const label = thread.label ? ` — ${thread.label}` : "";

      // Thread 标题行：带可点击链接
      out.push(`\n### Thread @ [${rangeText}](${link})${label}`);

      const comments = thread.comments ?? [];
      if (comments.length === 0) {
        out.push(`- (no comments)`);
        continue;
      }

      comments.forEach((c, idx) => {
        const author = c.author?.name ? ` (${c.author.name})` : "";
        const raw = normalizeBody(c.body).trim() || "(empty)";
        const safe = escapeCodeFence(raw);

        // 方案 A：comment 用 fenced code block，并缩进到 list item 下
        out.push(
          `- Comment ${idx + 1}${author}:`,
          `  \`\`\`md`,
          // code block 内容同样要缩进两格以归属到 list item
          safe.split(/\r?\n/).map(line => `  ${line}`).join("\n"),
          `  \`\`\``
        );
      });
    }

    out.push(""); // 文件之间空行
  }

  return out.join("\n").trim() + "\n";
}

// 使用：
// const text = exportThreadsAsMarkdown(allThreads);
// await vscode.env.clipboard.writeText(text);
