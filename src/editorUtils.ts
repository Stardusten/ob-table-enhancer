import {Editor, EditorPosition} from "obsidian";
import {privateDecrypt} from "crypto";
import {TransactionSpec} from "@codemirror/state";
import {EditorView} from "@codemirror/view";

export const getLineStartPos = (line: number): EditorPosition => ({
	line,
	ch: 0,
});

export const getLineEndPos = (
	line: number,
	editor: Editor,
): EditorPosition => ({
	line,
	ch: editor.getLine(line).length,
});

export const deleteLines = (
	editor: Editor,
	from: number, // inclusive
	to: number // exclusive
) => {
	if (to === editor.lastLine() + 1) {
		// 没有下一行
		return replaceRangeWithoutScroll(
			editor,
			'',
			getLineEndPos(from - 1, editor),
			getLineEndPos(to, editor),
		);
	} else {
		return replaceRangeWithoutScroll(
			editor,
			'',
			getLineStartPos(from),
			getLineStartPos(to),
		);
	}
};

export const deleteLine = (editor: Editor, line: number) => {
	return deleteLines(editor, line, line + 1);
}

export const getLeadingWhitespace = (lineContent: string) => {
	const indentation = lineContent.match(/^\s+/);
	return indentation ? indentation[0] : '';
};

export const insertLineAbove = (editor: Editor, line: number) => {
	const startOfCurrentLine = getLineStartPos(line);
	return replaceRangeWithoutScroll(editor, '\n', startOfCurrentLine);
};

export const insertLineBelow = (editor: Editor, line: number) => {
	const endOfCurrentLine = getLineEndPos(line, editor);
	const indentation = getLeadingWhitespace(editor.getLine(line));
	return replaceRangeWithoutScroll(editor, '\n' + indentation, endOfCurrentLine);
};

export const insertLineBelowWithText = (editor: Editor, line: number, text: string) => {
	const endOfCurrentLine = getLineEndPos(line, editor);
	const indentation = getLeadingWhitespace(editor.getLine(line));
	const textToInsert = text.split(/\r?\n/).map((s) => indentation + s).join('\n');
	replaceRangeWithoutScroll(editor, '\n' + textToInsert, endOfCurrentLine);
	return { anchor: { line: line + 1, ch: indentation.length } };
}

export const zf = (e: any, t: any) => {
	if (t.line < 0)
		return 0;
	const n = t.line + 1;
	if (n > e.lines)
		return e.length;
	const i = e.line(n);
	return isFinite(t.ch) ? t.ch < 0 ? i.from + Math.max(0, i.length + t.ch) : i.from + t.ch : i.to
}

export const replaceRangeWithoutScroll = (editor: Editor, replacement: string, from: EditorPosition, to?: EditorPosition) => {
	const cm = (editor as any).cm;
	const state = cm.state.doc;
	const from2 = zf(state, from);
	const to2 = to ? zf(state, to) : from2;
	return {
		changes: {
			from: from2,
			to: to2,
			insert: replacement,
		},
		scrollIntoView: false, // 不滚动！！
		sequential: false, // 防止位置错乱
	} as TransactionSpec;
}

export const setLineWithoutScroll = (editor: Editor, n: number, text: string) => {
	const cm = (editor as any).cm;
	const state = cm.state.doc;
	const from = zf(state, { line: n, ch: 0 });
	const to = zf(state, { line: n, ch: editor.getLine(n).length });
	return {
		changes: {
			from,
			to,
			insert: text,
		},
		scrollIntoView: false, // 不滚动！！
		sequential: false, // 防止位置错乱
	} as TransactionSpec;
}

export function withoutScrollAndFocus(editorView: EditorView, callback: () => any) {
	const contentDom = editorView.contentDOM;
	const scrollDom = editorView.scrollDOM;
	const x = scrollDom.scrollLeft;
	const y = scrollDom.scrollTop;
	scrollDom.addEventListener('scroll', (e) => {
		e.stopImmediatePropagation();
		e.preventDefault();
		scrollDom.scrollTo(x, y);
	}, { once: true, capture: true });
	callback();
	contentDom.blur();
}
