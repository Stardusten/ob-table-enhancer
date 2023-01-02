import TableEnhancer2 from "../main";
import {ViewPlugin, ViewUpdate} from "@codemirror/view";
import {editingCellClassName, getCell, hoveredCellClassName, setCaretPosition} from "./global";
import test from "node:test";

export const getTableEditorExt = (plugin: TableEnhancer2) => ViewPlugin.fromClass(class {
	constructor() {}
	destroy() {}
	update(update: ViewUpdate) {
		// 阅读模式不使用此插件
		if (plugin.isInReadingView())
			return;
		const dom = update.view.contentDOM;
		const tableEls = dom.querySelectorAll('table');
		tableEls.forEach((tableEl) => {
			if (tableEl.hasClass('intercepted')) // TODO 每次都 query 存在性能问题
				return;
			tableEl.addClass('intercepted');
			const tablePos = update.view.posAtDOM(tableEl);
			const tableLine = update.state.doc.lineAt(tablePos).number - 1;
			for (let i = 0; i < tableEl.rows.length; i ++) {
				const rowEl = tableEl.rows[i];
				for (let j = 0; j < rowEl.cells.length; j ++) {
					const cellEl = rowEl.cells[j];
					const cellId = `cell_${tableLine}_${i}_${j}`;
					cellEl.id = cellId;
					// 为 hover 的 cell 添加 class
					cellEl.addEventListener('mouseenter', (e) => {
						cellEl.addClass(hoveredCellClassName);
						plugin.toolBar?.tryShowFor(cellEl);
					});
					cellEl.addEventListener('mouseleave', (e) => {
						cellEl.removeClass(hoveredCellClassName);
						plugin.toolBar?.tryHide(200);
					});
					cellEl.addEventListener('click', async (e) => {
						// 阅读模式不使用此插件
						if (plugin.isInReadingView())
							return;
						// 如果是点击子元素触发的事件，比如点击链接，则不响应
						if (e.targetNode != cellEl)
							return;
						e.preventDefault();
						e.stopPropagation();
						// 已经处于编辑模式
						if (cellEl.getAttr('contenteditable') == 'true')
							return;
						// 如果之前正在编辑另一个 cell，则取消编辑之前的 cell，转而编辑现在点击的 cell
						const editingCell = activeDocument.querySelector('.' + editingCellClassName);
						if (editingCell instanceof HTMLTableCellElement && !cellEl.isSameNode(editingCell)) {
							await plugin.doneEdit(editingCell);
							// TODO 这里等待 200ms 是为了在 dom 更新后，等 ext 把每个单元格都标上 id（update）
							// TODO 更好的做法是每次 update 完通知继续
							setTimeout(() => {
								const newCellEl = activeDocument.getElementById(cellId);
								if (newCellEl instanceof HTMLTableCellElement) {
									newCellEl.click();
								} else console.error('cannot relocate');
							}, 200);
							return;
						}
						// 将 cell 内替换为 md 源码，并设置光标位置
						// console.log('tableLine=', tableLine);
						const table = plugin.tableEditor.getTable(tableLine);
						if (!table) {
							console.error('Cannot get table of cell ', cellEl);
							return;
						}
						const text = getCell(table, i, j);
						if (text == null)
							return;
						// 聚焦
						cellEl.focus();
						// 添加编辑 class
						cellEl.addClass(editingCellClassName);
						// 使这个 cell 可编辑
						cellEl.setAttr('contenteditable', true);
						if (text == '') {
							cellEl.innerText = ' ';
							setCaretPosition(cellEl, 0);
						} else {
							cellEl.innerText = text!;
							setCaretPosition(cellEl, text!.length);
						}
					});
				}
			}
		})
	}
})
