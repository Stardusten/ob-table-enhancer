import TableEnhancer2 from "../main";
import {MarkdownView} from "obsidian";
import {EditorView} from "@codemirror/view";
import {editingCellClassName, getCellEl, getCellText, getCellInfo, setCaretPosition} from "./global";
import {TableEditor} from "./tableEditor";

export function getMousedownHandler(plugin: TableEnhancer2) {
	return async (e: MouseEvent) => {
		// 阅读模式不使用此插件
		if (plugin.isInReadingView())
			return;
		// 获得 editorView
		const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		// 不是点击单元格触发的事件
		const cellEl = e.targetNode;
		if (!(cellEl instanceof HTMLTableCellElement)) {
			// 如果存在处于编辑模式的单元格，则此单元格退出编辑模式
			const editingCell = activeDocument.querySelector('.' + editingCellClassName);
			if (editingCell instanceof HTMLTableCellElement) {
				// console.log('done edit ', editingCell);
				await plugin.doneEdit(editingCell);
				editor?.focus(); // 没有点击单元格，因此恢复编辑器焦点
			}
			return;
		}
		// 否则是点击了某个单元格
		e.stopImmediatePropagation();
		e.preventDefault();
		// 确定这个单元格所属的 table
		let tableEl = cellEl.parentNode;
		while (tableEl) {
			if (tableEl instanceof HTMLTableElement)
				break;
			tableEl = tableEl.parentNode;
		}
		if (!tableEl) {
			console.error('Cannot get table element of cell ', cellEl);
			return;
		}
		// 忽略 dataview 创建的表格
		if (tableEl.hasClass('dataview'))
			return;
		const { tableLine, i, j } = getCellInfo(cellEl, plugin, tableEl)!;
		// 已经处于编辑模式
		if (cellEl.isContentEditable) {
			// console.log('already in editing mode ', cellEl);
			return;
		}
		const tablePos = editorView.posAtDOM(tableEl);
		// 如果存在处于编辑模式的单元格，则此单元格先退出编辑模式
		const editingCell = activeDocument.querySelector('.' + editingCellClassName);
		if (editingCell instanceof HTMLTableCellElement) {
			// console.log('done edit ', editingCell);
			await plugin.doneEdit(editingCell);
		}
		// 等一会儿，再将点击的单元格置为编辑模式
		setTimeout(() => {
			const newCellEl = getCellEl(tablePos, i, j, plugin);
			if (!(newCellEl instanceof HTMLTableCellElement)) {
				console.error('Cannot relocate table cell');
				return;
			}
			// 找到了，将其置为编辑模式
			plugin.setCellEditing(newCellEl, tableLine, i, j);
		}, 50);
	}
}
