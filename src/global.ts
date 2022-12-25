import {TableEditor} from "./tableEditor";

export const editingCellClassName = 'editing-cell';
export const hoveredCellClassName = 'hovered-cell';

export function getCaretPosition(editableElem: HTMLElement) {
	let caretPos = 0, sel, range;
	sel = activeWindow.getSelection();
	if (sel && sel.rangeCount) {
		range = sel.getRangeAt(0);
		if (range.commonAncestorContainer.parentNode == editableElem) {
			caretPos = range.endOffset;
		}
	}
	return caretPos;
}

export function setCaretPosition(editableElem: HTMLElement, newPos: number) {
	let caretPos = 0, sel, range = activeDocument.createRange();
	sel = activeWindow.getSelection();
	if (sel && sel.rangeCount) {
		range.setStart(editableElem.childNodes[0], newPos);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	}
	return caretPos;
}

export function getCaretRect(container: HTMLElement) {
	let caretPos = 0, sel, range;
	sel = activeWindow.getSelection();
	if (sel && sel.rangeCount) {
		range = sel.getRangeAt(0);
		const rect = range.getBoundingClientRect();
		return rect;
	}
	return null;
}


export interface Table {
	/**
	 * 列表起始行，inclusive
	 */
	fromLine: number,
	/**
	 * 列表结束行，exclusive
	 */
	toLine: number,
	/**
	 * 格式控制行
	 */
	formatLine: string[],
	/**
	 * 所有 cell，cells[i][j] 是第 i 行第 j 列的 cell
	 */
	cells: string[][],
}

export function getCell(table: Table, i: number, j: number) {
	let result = null;
	try {
		result = table.cells[i][j];
	} catch (err) {
		result = null;
		console.log('Cannot get cell i=', i, ', j=', j, ' from table=', table);
	}
	return result;
}

export function parseCellId(cellId: string) {
	const arr = cellId.split('_');
	return {
		tableLine: parseInt(arr[1]),
		i: parseInt(arr[2]),
		j: parseInt(arr[3]),
	}
}
