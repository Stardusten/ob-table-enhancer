import {Editor, EditorPosition} from "obsidian";

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
		editor.replaceRange(
			'',
			getLineEndPos(from - 1, editor),
			getLineEndPos(to, editor),
		);
	} else {
		editor.replaceRange(
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
	editor.replaceRange('\n', startOfCurrentLine);
	return { anchor: startOfCurrentLine };
};

export const insertLineBelow = (editor: Editor, line: number) => {
	const endOfCurrentLine = getLineEndPos(line, editor);
	const indentation = getLeadingWhitespace(editor.getLine(line));
	editor.replaceRange('\n' + indentation, endOfCurrentLine);
	return { anchor: { line: line + 1, ch: indentation.length } };
};
