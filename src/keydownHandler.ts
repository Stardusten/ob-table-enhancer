import TableEnhancer2 from "../main";
import {editingCellClassName, getCaretPosition, getCellEl, getCellInfo, setCaretPosition} from "./global";
import {MarkdownView} from "obsidian";
import {EditorView, keymap} from "@codemirror/view";

export function getKeydownHandler(plugin: TableEnhancer2) {
	return async (e: KeyboardEvent) => {

		// 获得 editorView TODO performance issue?
		const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!markdownView) return;
		const editor = markdownView.editor;
		const editorView = (editor as any)?.cm as EditorView;

		// 撤回 & 重做
		if (!editor.hasFocus()) {
			if (!e.repeat && e.ctrlKey && e.key == 'z') {
				e.stopPropagation();
				e.preventDefault();
				editor.undo();
				editor.blur();
				return;
			} else if (!e.repeat && e.ctrlKey && e.key == 'Z') {
				e.stopPropagation();
				e.preventDefault();
				editor.redo();
				editor.blur();
				return;
			}
		}

		// 当前没有在编辑 cell，则不处理
		const cellEl = activeDocument.querySelector('.' + editingCellClassName);
		if (!(cellEl instanceof HTMLTableCellElement))
			return;

		// <shift-enter>
		if (!e.repeat && e.key == 'Enter' && e.shiftKey) {
			e.stopPropagation();
			e.preventDefault();
			const prevCaretPos = getCaretPosition(cellEl);
			const text1 = cellEl.innerText.slice(0, prevCaretPos);
			const text2 = cellEl.innerText.slice(prevCaretPos + 1);
			cellEl.innerText = [text1, ' <br> ', text2].join('');
			setCaretPosition(cellEl, prevCaretPos + 6);
			return;
		}

		// <enter>
		// <esc>
		if (!e.repeat && (e.key == 'Enter' || e.key == 'Escape')) {
			e.stopPropagation();
			e.preventDefault();
			await plugin.doneEdit(cellEl);
			return;
		}

		// 确定这个单元格所属的 table
		let tableEl = cellEl.parentNode;
		while (tableEl) {
			if (tableEl instanceof HTMLTableElement)
				break;
			tableEl = tableEl.parentNode;
		}
		if (!tableEl) {
			console.error('Cannot find table of cell', cellEl);
			return;
		}

		// <left>
		if (e.key == 'ArrowLeft') {
			const caretPos = getCaretPosition(cellEl);
			const { tableLine, i, j } = getCellInfo(cellEl, plugin, tableEl)!;
			// 到最左端了，如果左边还有 cell，再按则跳到左边的 cell
			if (cellEl.innerText.length == 0 || caretPos == 0) { // XXX
				e.preventDefault();
				const tablePos = editorView.posAtDOM(tableEl);
				await plugin.doneEdit(cellEl);
				setTimeout(() => {
					const newCellEl = getCellEl(tablePos, i, j - 1, plugin);
					if (newCellEl instanceof HTMLTableCellElement) {
						plugin.setCellEditing(newCellEl, tableLine, i, j - 1);
					}
				}, 50);
			}// 否则光标左移
			e.stopPropagation();
			return;
		}

		// <right>
		if (e.key == 'ArrowRight') {
			const caretPos = getCaretPosition(cellEl);
			const { tableLine, i, j } = getCellInfo(cellEl, plugin, tableEl)!;
			// 到最右端了，如果右边还有 cell，再按则跳到右边的 cell
			if (caretPos >= cellEl.innerText.length) {
				e.preventDefault();
				const tablePos = editorView.posAtDOM(tableEl);
				await plugin.doneEdit(cellEl);
				setTimeout(() => {
					const newCellEl = getCellEl(tablePos, i, j + 1, plugin);
					if (newCellEl instanceof HTMLTableCellElement) {
						plugin.setCellEditing(newCellEl, tableLine, i, j + 1);
					}
				}, 50);
			} // 否则光标右移
			e.stopPropagation();
			return;
		}

		// <up> 移到上一行，如果有
		if (e.key == 'ArrowUp') {
			e.stopPropagation();
			e.preventDefault();
			const { tableLine, i, j } = getCellInfo(cellEl, plugin, tableEl)!;
			const tablePos = editorView.posAtDOM(tableEl);
			await plugin.doneEdit(cellEl);
			setTimeout(() => {
				const newCellEl = getCellEl(tablePos, i - 1, j, plugin);
				if (newCellEl instanceof HTMLTableCellElement) {
					plugin.setCellEditing(newCellEl, tableLine, i - 1, j);
				}
			}, 50);
			return;
		}

		// <down> 移到下一行，如果有
		if (e.key == 'ArrowDown') {
			e.stopPropagation();
			e.preventDefault();
			const { tableLine, i, j } = getCellInfo(cellEl, plugin, tableEl)!;
			const tablePos = editorView.posAtDOM(tableEl);
			await plugin.doneEdit(cellEl);
			setTimeout(() => {
				const newCellEl = getCellEl(tablePos, i + 1, j, plugin);
				if (newCellEl instanceof HTMLTableCellElement) {
					plugin.setCellEditing(newCellEl, tableLine, i + 1, j);
				}
			}, 50);
			return;
		}

		// <c-a> 全选
		if (!e.repeat && e.ctrlKey && e.key == 'a') {
			e.stopPropagation();
			e.preventDefault();
			const selection = activeWindow.getSelection();
			const range = activeDocument.createRange();
			range.selectNodeContents(cellEl);
			selection?.removeAllRanges();
			selection?.addRange(range);
			return;
		}

		// shift-tab
		if (e.shiftKey && e.key == 'Tab') {
			e.stopPropagation();
			e.preventDefault();
			const { tableLine, i, j } = getCellInfo(cellEl, plugin, tableEl)!;
			const rowNum = tableEl.rows.length;
			const colNum = tableEl.rows[0].cells.length;
			const tablePos = editorView.posAtDOM(tableEl);
			let nextI: number, nextJ: number;
			if (i == 0 && j == 0) { // 最后一个单元格
				nextI = rowNum - 1;
				nextJ = colNum - 1;
			} else if (j == 0) { // 回到上一行最后一个元素
				nextI = i - 1;
				nextJ = colNum - 1;
			} else { // 前一列
				nextI = i;
				nextJ = j - 1;
			}
			await plugin.doneEdit(cellEl);
			setTimeout(() => {
				const newCellEl = getCellEl(tablePos, nextI, nextJ, plugin);
				if (newCellEl instanceof HTMLTableCellElement) {
					plugin.setCellEditing(newCellEl, tableLine, nextI, nextJ);
				}
			}, 50);
			return;
		}

		// tab
		if (e.key == 'Tab') {
			e.stopPropagation();
			e.preventDefault();
			const { tableLine, i, j } = getCellInfo(cellEl, plugin, tableEl)!;
			const rowNum = tableEl.rows.length;
			const colNum = tableEl.rows[0].cells.length;
			const tablePos = editorView.posAtDOM(tableEl);
			let nextI: number, nextJ: number;
			if (i == rowNum - 1 && j == colNum - 1) { // 到第一个单元格
				nextI = 0;
				nextJ = 0;
			} else if (j == colNum - 1) { // 下一行第一个元素
				nextI = i + 1;
				nextJ = 0;
			} else { // 下一列
				nextI = i;
				nextJ = j + 1;
			}
			await plugin.doneEdit(cellEl);
			setTimeout(() => {
				const newCellEl = getCellEl(tablePos, nextI, nextJ, plugin);
				if (newCellEl instanceof HTMLTableCellElement) {
					plugin.setCellEditing(newCellEl, tableLine, nextI, nextJ);
				}
			}, 50);
			return;
		}
	}
}
