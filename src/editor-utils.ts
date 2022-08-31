import {Editor, EditorPosition} from "obsidian";
import {privateDecrypt} from "crypto";

export const hashCode = function(input: string, seed: number = 0): number {
	let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < input.length; i++) {
		ch = input.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
	h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
	return 4294967296 * (2097151 & h2) + (h1>>>0);
};

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
		replaceRangeWithoutScroll(
			editor,
			'',
			getLineEndPos(from - 1, editor),
			getLineEndPos(to, editor),
		);
	} else {
		replaceRangeWithoutScroll(
			editor,
			'',
			getLineStartPos(from),
			getLineStartPos(to),
		);
	}
};

export const deleteLine = (
	editor: Editor,
	line: number
) => {
	deleteLines(editor, line, line + 1);
}

export const getLeadingWhitespace = (lineContent: string) => {
	const indentation = lineContent.match(/^\s+/);
	return indentation ? indentation[0] : '';
};

export const insertLineAbove = (editor: Editor, line: number) => {
	const startOfCurrentLine = getLineStartPos(line);
	replaceRangeWithoutScroll(editor, '\n', startOfCurrentLine);
	return { anchor: startOfCurrentLine };
};

export const insertLineBelow = (editor: Editor, line: number) => {
	const endOfCurrentLine = getLineEndPos(line, editor);
	const indentation = getLeadingWhitespace(editor.getLine(line));
	replaceRangeWithoutScroll(editor, '\n' + indentation, endOfCurrentLine);
	return { anchor: { line: line + 1, ch: indentation.length } };
};

export const insertLineBelowWithText = (editor: Editor, line: number, text: string) => {
	const endOfCurrentLine = getLineEndPos(line, editor);
	const indentation = getLeadingWhitespace(editor.getLine(line));
	const textToInsert = text.split(/\r?\n/).map((s) => indentation + s).join('\n');
	replaceRangeWithoutScroll(editor, '\n' + textToInsert, endOfCurrentLine);
	return { anchor: { line: line + 1, ch: indentation.length } };
}

export const inReadingView = () => {
	if (activeDocument) {
		const el = activeDocument.querySelector('.markdown-reading-view');
		if (el instanceof HTMLElement)
			return el.style.display != 'none';
	}
	return false;
}

function zf(e: any, t: any) {
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
	cm.dispatch({
		changes: {
			from: from2,
			to: to2,
			insert: replacement,
		},
		scrollIntoView: false, // 不滚动！！
	});
}

export const setLineWithoutScroll = (editor: Editor, n: number, text: string) => {
	const cm = (editor as any).cm;
	const state = cm.state.doc;
	const from = zf(state, { line: n, ch: 0 });
	const to = zf(state, { line: n, ch: editor.getLine(n).length });
	cm.dispatch({
		changes: {
			from,
			to,
			insert: text,
		},
		scrollIntoView: false, // 不滚动！！
	});
}
