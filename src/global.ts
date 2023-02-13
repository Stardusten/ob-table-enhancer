import {TableEditor} from "./tableEditor";
import TableEnhancer2 from "../main";
import {MarkdownView} from "obsidian";
import {EditorView} from "@codemirror/view";
import {off} from "codemirror";

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

export function getCellText(table: Table, i: number, j: number) {
	let result = null;
	try {
		result = table.cells[i][j];
	} catch (err) {
		result = null;
		console.error('Cannot get cell i=', i, ', j=', j, ' from table=', table);
	}
	return result;
}

export function getCellInfo(
	cellEl: HTMLTableCellElement,
	plugin: TableEnhancer2,
	tableEl?: HTMLTableElement,
	editorView?: EditorView
) {
	if (!tableEl)
		// 确定这个单元格所属的 table
		tableEl = getTableOfCell(cellEl);
	if (!tableEl) {
		console.error('Cannot get table element of cell ', cellEl);
		return;
	}
	// 获得 editorView
	if (!editorView) {
		const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		editorView = (editor as any)?.cm as EditorView;
	}
	// 计算这个表格在第几行
	const tablePos = editorView.posAtDOM(tableEl);
	const tableLine = editorView.state.doc.lineAt(tablePos).number - 1;
	// 计算这个单元格在第几行第几列
	const trEl = cellEl.closest('tr');
	const i = trEl!.rowIndex;
	const j = cellEl.cellIndex;
	return { tableLine, i, j };
}

export function getTableOfCell(cellEl: Node | null) {
	if (!cellEl) return;
	// 确定这个单元格所属的 table
	let parent = cellEl.parentNode;
	while (parent) {
		if (parent instanceof HTMLTableElement)
			break;
		parent = parent.parentNode;
	}
	if (parent) return parent;
}

export function getCellEl(tablePos: number, i: number, j: number, plugin: TableEnhancer2) {
	const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	const editor = markdownView?.editor;
	const editorView = (editor as any)?.cm as EditorView;
	const { node, offset } = editorView.domAtPos(tablePos);
	const el = node.childNodes[offset];
	if (!(el instanceof HTMLElement))
		return null;
	const tables = el.getElementsByTagName('table');
	if (tables.length > 1) {
		console.error('More than 1 tables were found');
		return null;
	}
	const table = tables[0];
	return table?.rows[i]?.cells[j];
}

export function throttle(func: any, timeFrame: number) {
	let lastTime = 0;
	return function () {
		const now = new Date().getTime();
		if (now - lastTime >= timeFrame) {
			func();
			lastTime = now;
		}
	};
}

export function withEditingCell<T>(callback: (cellEl: HTMLTableCellElement) => T) {
	// 当前没有在编辑 cell，则不处理
	const cellEl = activeDocument.querySelector('.' + editingCellClassName);
	if (!(cellEl instanceof HTMLTableCellElement))
		return null;
	return callback(cellEl);
}

export function withHoveredCell<T>(callback: (cellEl: HTMLTableCellElement) => T) {
	// 当前没有在编辑 cell，则不处理
	const cellEl = activeDocument.querySelector('.' + hoveredCellClassName);
	if (!(cellEl instanceof HTMLTableCellElement))
		return null;
	return callback(cellEl);
}
