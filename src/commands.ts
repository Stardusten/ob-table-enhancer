import TableEnhancer2 from "../main";
import {
	editingCellClassName,
	getCaretPosition,
	hoveredCellClassName,
	setCaretPosition,
	withEditingCell
} from "./global";

export const getCommands = (plugin: TableEnhancer2) => { return {
	'editor:toggle-bold': () => withEditingCell(cellEl => {
		const selection = activeWindow.getSelection();
		if (!selection) return;
		let selectionStart, selectionEnd;
		if (selection.anchorOffset < selection.focusOffset) {
			selectionStart = selection.anchorOffset;
			selectionEnd = selection.focusOffset;
		} else {
			selectionStart = selection.focusOffset;
			selectionEnd = selection.anchorOffset;
		}
		const prevText = cellEl.innerText.slice(0, selectionStart);
		const selectText = cellEl.innerText.slice(selectionStart, selectionEnd);
		const succText = cellEl.innerText.slice(selectionEnd);
		cellEl.innerText = [prevText, '**', selectText, '**', succText].join('');
		setCaretPosition(cellEl, selectionEnd + 4);
		// TODO keep selection
		// const range = activeDocument.createRange();
		// range.setStart(cellEl, 0);
		// range.setEnd(cellEl, 1);
		// selection.removeAllRanges();
		// selection.addRange(range);
		return true;
	}),
	'editor:toggle-italics': () => withEditingCell(cellEl => {
		const selection = activeWindow.getSelection();
		if (!selection) return;
		let selectionStart, selectionEnd;
		if (selection.anchorOffset < selection.focusOffset) {
			selectionStart = selection.anchorOffset;
			selectionEnd = selection.focusOffset;
		} else {
			selectionStart = selection.focusOffset;
			selectionEnd = selection.anchorOffset;
		}
		const prevText = cellEl.innerText.slice(0, selectionStart);
		const selectText = cellEl.innerText.slice(selectionStart, selectionEnd);
		const succText = cellEl.innerText.slice(selectionEnd);
		cellEl.innerText = [prevText, '*', selectText, '*', succText].join('');
		setCaretPosition(cellEl, selectionEnd + 2);
		return true;
	}),
	'editor:toggle-blockquote': () => withEditingCell(cellEl => {
		const selection = activeWindow.getSelection();
		if (!selection) return;
		let selectionStart, selectionEnd;
		if (selection.anchorOffset < selection.focusOffset) {
			selectionStart = selection.anchorOffset;
			selectionEnd = selection.focusOffset;
		} else {
			selectionStart = selection.focusOffset;
			selectionEnd = selection.anchorOffset;
		}
		const prevText = cellEl.innerText.slice(0, selectionStart);
		const selectText = cellEl.innerText.slice(selectionStart, selectionEnd);
		const succText = cellEl.innerText.slice(selectionEnd);
		cellEl.innerText = ['> ', prevText, selectText, succText].join('');
		setCaretPosition(cellEl, selectionEnd + 2);
		return true;
	}),
	'editor:toggle-bullet-list': () => withEditingCell(cellEl => {
		return true; // do nothing
	}),
	'editor:toggle-checklist-status': () => withEditingCell(cellEl => {
		return true; // do nothing
	}),
	'editor:toggle-code': () => withEditingCell(cellEl => {
		const selection = activeWindow.getSelection();
		if (!selection) return;
		let selectionStart, selectionEnd;
		if (selection.anchorOffset < selection.focusOffset) {
			selectionStart = selection.anchorOffset;
			selectionEnd = selection.focusOffset;
		} else {
			selectionStart = selection.focusOffset;
			selectionEnd = selection.anchorOffset;
		}
		const prevText = cellEl.innerText.slice(0, selectionStart);
		const selectText = cellEl.innerText.slice(selectionStart, selectionEnd);
		const succText = cellEl.innerText.slice(selectionEnd);
		cellEl.innerText = [prevText, '`', selectText, '`', succText].join('');
		setCaretPosition(cellEl, selectionEnd + 2);
		return true;
	}),
	'editor:toggle-highlight': () => withEditingCell(cellEl => {
		const selection = activeWindow.getSelection();
		if (!selection) return;
		let selectionStart, selectionEnd;
		if (selection.anchorOffset < selection.focusOffset) {
			selectionStart = selection.anchorOffset;
			selectionEnd = selection.focusOffset;
		} else {
			selectionStart = selection.focusOffset;
			selectionEnd = selection.anchorOffset;
		}
		const prevText = cellEl.innerText.slice(0, selectionStart);
		const selectText = cellEl.innerText.slice(selectionStart, selectionEnd);
		const succText = cellEl.innerText.slice(selectionEnd);
		cellEl.innerText = [prevText, '==', selectText, '==', succText].join('');
		setCaretPosition(cellEl, selectionEnd + 4);
		return true;
	}),
	'editor:toggle-numbered-list': () => withEditingCell(cellEl => {
		return null; // do nothing
	}),
	'editor:toggle-strikethrough': () => withEditingCell(cellEl => {
		const selection = activeWindow.getSelection();
		if (!selection) return;
		let selectionStart, selectionEnd;
		if (selection.anchorOffset < selection.focusOffset) {
			selectionStart = selection.anchorOffset;
			selectionEnd = selection.focusOffset;
		} else {
			selectionStart = selection.focusOffset;
			selectionEnd = selection.anchorOffset;
		}
		const prevText = cellEl.innerText.slice(0, selectionStart);
		const selectText = cellEl.innerText.slice(selectionStart, selectionEnd);
		const succText = cellEl.innerText.slice(selectionEnd);
		cellEl.innerText = [prevText, '~~', selectText, '~~', succText].join('');
		setCaretPosition(cellEl, selectionEnd + 4);
		return true;
	}),
}}
