import TableEnhancer2 from "../main";
import {MarkdownView} from "obsidian";
import {EditorView} from "@codemirror/view";
import {editingCellClassName, getCellEl, getCellText, getCellInfo, setCaretPosition} from "./global";
import {TableEditor} from "./tableEditor";

export function getClickHandler(plugin: TableEnhancer2) {
	return async (e: MouseEvent) => {
		// 阅读模式不使用此插件
		if (plugin.isInReadingView())
			return;
		// 不是点击单元格触发的事件，不处理
		const cellEl = e.targetNode;
		if (!(cellEl instanceof HTMLTableCellElement))
			return;
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
		// 获得 editorView
		const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		const { tableLine, i, j } = getCellInfo(cellEl, plugin, tableEl)!;
		// 已经处于编辑模式
		if (cellEl.isContentEditable)
			return;
		const tablePos = editorView.posAtDOM(tableEl);
		// 结束编辑后，dom 会重绘，因此需要根据 tableLine, i, j 重新找到之前点击的 cell
		const preventFocus = (e: Event) => {
			e.preventDefault();
			e.stopImmediatePropagation();
		}
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
