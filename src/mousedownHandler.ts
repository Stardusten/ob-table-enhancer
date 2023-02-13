import TableEnhancer2 from "../main";
import {MarkdownView} from "obsidian";
import {EditorView} from "@codemirror/view";
import {editingCellClassName, getCellEl, getCellText, getCellInfo, setCaretPosition, getTableOfCell} from "./global";
import {TableEditor} from "./tableEditor";

function isClickable(node: Node) {
	if (node instanceof HTMLElement) {
		if (node.tagName == 'A')
			return true;
	}
	return false;
}

function getEditableNode(node: Node | null) {
	if (!(node instanceof HTMLElement))
		return null;
	if (node instanceof HTMLTableCellElement)
		return node;
	// 这个 node 本来可以点击，不编辑
	if (isClickable(node)) return null;
	// 否则遍历这个 node 的所有父 node
	let parent = node.parentNode;
	while (parent) {
		if (parent instanceof HTMLTableCellElement)
			break;
		parent = parent.parentNode;
	}
	// console.log(node, parent);
	// 不是 cell element 的子节点，不编辑
	if (!parent) return null;
	// 否则可以编辑
	return parent;
}

export function getClickHandler(plugin: TableEnhancer2) {
	return async (e: MouseEvent) => {
		// 阅读模式不使用此插件
		if (plugin.isInReadingView())
			return;
		// 获得 editorView
		const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		// 不是点击单元格触发的事件
		const cellEl = getEditableNode(e.targetNode);
		if (!cellEl) return;
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

export function getMousedownHandler(plugin: TableEnhancer2) {
	return async (e: MouseEvent) => {
		// 获得 editorView
		const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		// 不是点击表格触发的事件
		const tableEl = getTableOfCell(e.targetNode);
		if (!tableEl) {
			// 如果存在处于编辑模式的单元格，则此单元格退出编辑模式
			const editingCell = activeDocument.querySelector('.' + editingCellClassName);
			if (editingCell instanceof HTMLTableCellElement) {
				// console.log('done edit ', editingCell);
				await plugin.doneEdit(editingCell);
				editor?.focus(); // 没有点击单元格，因此恢复编辑器焦点
			}
			return;
		}
	}
}
