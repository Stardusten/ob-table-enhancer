import {Editor, MarkdownView, Plugin} from 'obsidian';
import {
	editingCellClassName,
	getCaretPosition,
	hoveredCellClassName,
	parseCellId,
	setCaretPosition
} from "./src/global";
import {TableEditor} from "./src/tableEditor";
import {EditorView} from "@codemirror/view";
import {getTableEditorExt} from "./src/ext";
import {
	getCloneColItem,
	getCloneRowItem, getColAlignItem, getDelColItem,
	getDelRowItem,
	getInsertColRightItem,
	getInsertRowBelowItem, getMoveColLeftItem, getMoveColRightItem, getMoveRowDownItem, getMoveRowUpItem
} from "./src/menuItems";
import {ToolBar} from "./src/toolBar";

export default class TableEnhancer2 extends Plugin {

	/** 表格编辑器，用于将 dom 上的改动持久化到文件 */
	public tableEditor: TableEditor;

	/** 悬浮工具栏 */
	public toolBar: ToolBar;

	async onload() {
		this.tableEditor = new TableEditor(this);
		this.toolBar = new ToolBar(this);

		const tableEditorExt = getTableEditorExt(this);
		this.registerEditorExtension(tableEditorExt);

		// 按键逻辑
		this.app.workspace.onLayoutReady(() => {
			this.registerDomEvent(activeDocument, 'keydown', async (e) => {
				const cellEl = activeDocument.querySelector('.' + editingCellClassName);
				if (!(cellEl instanceof HTMLTableCellElement))
					return;

				// <shift-enter>
				if (!e.repeat && e.key == 'Enter' && e.shiftKey) {
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
					e.preventDefault();
					await this.doneEdit(cellEl);
					return;
				}

				// <left>
				if (e.key == 'ArrowLeft') {
					e.preventDefault();
					e.stopPropagation();
					const caretPos = getCaretPosition(cellEl);
					const { tableLine, i, j } = parseCellId(cellEl.id);
					// 到最左端了，如果左边还有 cell，再按则跳到左边的 cell
					if (caretPos == 0) {
						setTimeout(() => {
							const newCellEl = activeDocument.getElementById(`cell_${tableLine}_${i}_${j - 1}`);
							if (newCellEl instanceof HTMLTableCellElement) {
								newCellEl.click();
							}
						}, 200);
					} else { // 否则光标左移一个字符
						setCaretPosition(cellEl, caretPos - 1);
					}
					return;
				}

				// <right>
				if (e.key == 'ArrowRight') {
					e.preventDefault();
					e.stopPropagation();
					const caretPos = getCaretPosition(cellEl);
					const { tableLine, i, j } = parseCellId(cellEl.id);
					// 到最右端了，如果右边还有 cell，再按则跳到右边的 cell
					if (caretPos >= cellEl.innerText.length) {
						setTimeout(() => {
							const newCellEl = activeDocument.getElementById(`cell_${tableLine}_${i}_${j + 1}`);
							if (newCellEl instanceof HTMLTableCellElement) {
								newCellEl.click();
							}
						}, 200);
					} else { // 否则光标左移一个字符
						setCaretPosition(cellEl, caretPos + 1);
					}
					return;
				}

				// 提供 <c-a> 全选
				if (!e.repeat && e.ctrlKey && e.key == 'a') {
					e.preventDefault();
					e.stopPropagation();
					const selection = activeWindow.getSelection();
					const range = activeDocument.createRange();
					range.selectNodeContents(cellEl);
					selection?.removeAllRanges();
					selection?.addRange(range);
					return;
				}

				// <up>
				if (e.key == 'ArrowUp') {
					e.preventDefault();
					e.stopPropagation();
					const { tableLine, i, j } = parseCellId(cellEl.id);
					setTimeout(() => {
						const newCellEl = activeDocument.getElementById(`cell_${tableLine}_${i - 1}_${j}`);
						if (newCellEl instanceof HTMLTableCellElement) {
							newCellEl.click();
						}
					}, 200);
					return;
				}

				// <down>
				if (e.key == 'ArrowDown') {
					e.preventDefault();
					e.stopPropagation();
					const { tableLine, i, j } = parseCellId(cellEl.id);
					setTimeout(() => {
						const newCellEl = activeDocument.getElementById(`cell_${tableLine}_${i + 1}_${j}`);
						if (newCellEl instanceof HTMLTableCellElement) {
							newCellEl.click();
						}
					}, 200);
					return;
				}

				// <shift-tab>
				if (e.shiftKey && e.key == 'Tab') {
					e.preventDefault();
					e.stopPropagation();
					const { tableLine, i, j } = parseCellId(cellEl.id);
					const table = this.tableEditor.getTable(tableLine);
					if (!table) {
						console.error('Cannot get table when trying to done edit');
						return;
					}
					const rowNum = table.cells.length;
					const colNum = table.formatLine.length;
					let nextCell;
					if (i == 0 && j == 0) {
						nextCell = activeDocument.getElementById(`cell_${tableLine}_${rowNum - 1}_${colNum - 1}`);
					} else if (j == 0) {
						nextCell = activeDocument.getElementById(`cell_${tableLine}_${i - 1}_${colNum - 1}`);
					} else {
						nextCell = activeDocument.getElementById(`cell_${tableLine}_${i}_${j - 1}`);
					}
					if (nextCell instanceof HTMLTableCellElement)
						nextCell.click();
					return;
				}

				// <tab>
				if (e.key == 'Tab') {
					e.preventDefault();
					e.stopPropagation();
					const { tableLine, i, j } = parseCellId(cellEl.id);
					const table = this.tableEditor.getTable(tableLine);
					if (!table) {
						console.error('Cannot get table when trying to done edit');
						return;
					}
					const rowNum = table.cells.length;
					const colNum = table.formatLine.length;
					let nextCell;
					if (i == rowNum - 1 && j == rowNum - 1) {
						nextCell = activeDocument.getElementById(`cell_${tableLine}_0_0`);
					} else if (j == colNum - 1) {
						nextCell = activeDocument.getElementById(`cell_${tableLine}_${i + 1}_0`);
					} else {
						nextCell = activeDocument.getElementById(`cell_${tableLine}_${i}_${j + 1}`);
					}
					if (nextCell instanceof HTMLTableCellElement)
						nextCell.click();
					return;
				}
			});
		});

		this.registerEvent(this.app.workspace.on('editor-menu', (menu, view) => {
			// 找到是不是在某个 cell 上触发的菜单
			const hoveredCell = activeDocument.querySelector('.' + hoveredCellClassName);
			if (!(hoveredCell instanceof HTMLTableCellElement)) // 没有 hover 在 cell 上
				return;
			menu.addItem(getInsertRowBelowItem(this, hoveredCell));
			menu.addItem(getInsertColRightItem(this, hoveredCell));
			menu.addItem(getCloneRowItem(this, hoveredCell));
			menu.addItem(getCloneColItem(this, hoveredCell));
			menu.addItem(getDelRowItem(this, hoveredCell));
			menu.addItem(getDelColItem(this, hoveredCell));
			menu.addItem(getMoveColLeftItem(this, hoveredCell));
			menu.addItem(getMoveColRightItem(this, hoveredCell));
			menu.addItem(getMoveRowUpItem(this, hoveredCell));
			menu.addItem(getMoveRowDownItem(this, hoveredCell));
			menu.addItem(getColAlignItem(this, hoveredCell, 'left'));
			menu.addItem(getColAlignItem(this, hoveredCell, 'right'));
			menu.addItem(getColAlignItem(this, hoveredCell, 'center'));
		}));
	}

	async doneEdit(cellEl?: HTMLTableCellElement) {
		if (!cellEl) {
			const el = activeDocument.querySelector('.' + editingCellClassName);
			if (el instanceof HTMLTableCellElement)
				cellEl = el;
			else return;
		}

		// 停止编辑
		cellEl.setAttr('contenteditable', false);
		// 删除编辑 class
		cellEl.removeClass(editingCellClassName);

		// 提交更改
		const { tableLine, i, j } = parseCellId(cellEl.id);
		const table = this.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('Cannot get table when trying to done edit');
			return;
		}
		await this.tableEditor.updateCell(table, i, j, cellEl.innerText.trim());
	}

	isInReadingView() {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		return markdownView instanceof MarkdownView && markdownView.getMode() == "preview";
	}

	onunload() {}
}
