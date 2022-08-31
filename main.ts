import {MarkdownEditView, MarkdownView, Notice, Plugin} from 'obsidian';
import {TableEditor} from "./src/table-editor";
import {Cell} from "./src/table";
import {getCaretPosition, setCaretPosition} from "./src/html-utils";
import {getRowNum, isSameCell} from "./src/table-utils";
import {text} from "stream/consumers";
import {hashCode, inReadingView} from "./src/editor-utils";
import {ReferenceSuggestionPopper} from "./src/reference-suggest";
import {ToolBar} from "./src/tool-bar";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {

	settings: MyPluginSettings;
	tableEditor: TableEditor;
	/** 当前指针在哪个 table 上 */
	hoverTableId: string | null;
	/** ctrl 是否被按下 */
	ctrl: boolean;
	/** 记录处于编辑状态的 cell */
	editingCell: Cell | null;
	/** 当前指针在哪个 cell 上 */
	hoverCell: Cell | null;
	/** 提供双链补全的组件 */
	suggestPopper: ReferenceSuggestionPopper | null;
	/** 提供悬浮工具栏的组件 */
	toolBar: ToolBar | null;

	async onload() {
		this.tableEditor = new TableEditor(this);

		this.editingCell = null;
		this.hoverCell = null;

		this.app.workspace.onLayoutReady(() => {

			this.suggestPopper = new ReferenceSuggestionPopper(this);
			this.toolBar = new ToolBar(this);

			// 劫持滚动事件
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView instanceof MarkdownView) {
				const cm = (markdownView.editor as any).cm;
				this.registerDomEvent(cm.scrollDOM, 'scroll', (e: Event) => {
					// 如果当前正在编辑表格，则屏蔽默认滚动事件
					if (this.hoverTableId)
						e.stopImmediatePropagation();
				}, true);
			}

			this.registerDomEvent(activeDocument, 'keydown', async (e) => {

				if (!this.editingCell)
					return;
				const cell = this.editingCell.cellEl;

				// <shift-enter> 单元格内换行，md 语法应该是插入一个 <br> 标签
				if (!e.repeat && e.key == 'Enter' && e.shiftKey && this.editingCell) {
					cell.innerText = cell.innerText + '<br>';
					return;
				}

				// 按下 Esc 或 Enter 时，正在编辑的 cell 退出编辑状态，并提交更改
				if (!e.repeat && (e.key == 'Enter' || e.key == 'Escape')) {
					e.preventDefault();
					await this.doneEdit(this.editingCell);
					return;
				}

				// 按左键
				if (e.key == 'ArrowLeft') {
					e.preventDefault();
					e.stopPropagation();
					const caretPos = getCaretPosition(cell);
					const { tableId, rowIndex, colIndex } = this.editingCell;
					// 到最左端了，再按则跳到左边的 cell
					if (caretPos == 0) {
						await this.doneEdit(this.editingCell);
						const cellLeft = activeDocument.querySelector(`#${tableId}${rowIndex}${colIndex - 1}`);
						if (cellLeft instanceof HTMLTableCellElement) {
							cellLeft.click();
						}
					} else { // 否则光标左移一个字符
						setCaretPosition(cell, caretPos - 1);
					}
					return;
				}

				// 按右键
				if (e.key == 'ArrowRight') {
					e.preventDefault();
					e.stopPropagation();
					const caretPos = getCaretPosition(cell);
					const { tableId, rowIndex, colIndex } = this.editingCell;
					// 到最右端了，再按则跳到右边的 cell
					if (caretPos == cell.innerText.length) {
						await this.doneEdit(this.editingCell);
						const cellRight = activeDocument.querySelector(`#${tableId}${rowIndex}${colIndex + 1}`);
						if (cellRight instanceof HTMLTableCellElement) {
							cellRight.click();
						}
					} else { // 否则光标右移一个字符
						setCaretPosition(cell, caretPos + 1);
					}
					return;
				}

				// 提供 <c-a> 全选
				if (!e.repeat && e.ctrlKey && e.key == 'a') {
					e.preventDefault();
					e.stopPropagation();
					const selection = activeWindow.getSelection();
					const range = activeDocument.createRange();
					range.selectNodeContents(cell);
					selection?.removeAllRanges();
					selection?.addRange(range);
					return;
				}

				// 按上键，正在编辑的 cell 退出编辑状态，并提交更改
				// 然后开始编辑这个 cell 上方的 cell （如果存在）
				if (e.key == 'ArrowUp') {
					e.preventDefault();
					e.stopPropagation();
					const { tableId, rowIndex, colIndex } = this.editingCell;
					await this.doneEdit(this.editingCell);
					const cellAbove = activeDocument.querySelector(`#${tableId}${rowIndex - 1}${colIndex}`);
					if (cellAbove instanceof HTMLTableCellElement) {
						cellAbove.click();
					}
					return;
				}

				// 按下键，正在编辑的 cell 退出编辑状态，并提交更改
				// 然后开始编辑这个 cell 下方的 cell （如果存在）
				if (e.key == 'ArrowDown') {
					e.preventDefault();
					e.stopPropagation();
					const { tableId, rowIndex, colIndex } = this.editingCell;
					await this.doneEdit(this.editingCell);
					const cellBelow = activeDocument.querySelector(`#${tableId}${rowIndex + 1}${colIndex}`);
					if (cellBelow instanceof HTMLTableCellElement) {
						cellBelow.click();
					}
					return;
				}

				// 按 Shift + Tab，正在编辑的 cell 退出编辑状态，并提交更改
				// 然后开始编辑这个 cell 右侧的 cell （如果存在）
				// 注意要先捕获组合键
				if (e.shiftKey && e.key == 'Tab') {
					e.preventDefault();
					e.stopPropagation();
					const { tableId, rowIndex, colIndex } = this.editingCell;
					await this.doneEdit(this.editingCell);
					const table = this.tableEditor.tables.get(tableId);
					if (table) {
						const rowNum = table.cells.length;
						const colNum = table.cells[0].length;
						let nextCell;
						if (rowIndex == 0 && colIndex == 0) {
							nextCell = activeDocument.querySelector(`#${tableId}${rowNum - 1}${colNum - 1}`);
						} else if (colIndex == 0) {
							nextCell = activeDocument.querySelector(`#${tableId}${rowIndex - 1}${colNum - 1}`);
						} else {
							nextCell = activeDocument.querySelector(`#${tableId}${rowIndex}${colIndex - 1}`);
						}
						if (nextCell instanceof HTMLTableCellElement)
							nextCell.click();
					}
					return;
				}

				// 按 Tab，正在编辑的 cell 退出编辑状态，并提交更改
				// 然后开始编辑这个 cell 左侧的 cell （如果存在）
				if (e.key == 'Tab') {
					e.preventDefault();
					e.stopPropagation();
					const { tableId, rowIndex, colIndex } = this.editingCell;
					await this.doneEdit(this.editingCell);
					const table = this.tableEditor.tables.get(tableId);
					if (table) {
						const rowNum = table.cells.length;
						const colNum = table.cells[0].length;
						let nextCell;
						if (rowIndex == rowNum - 1 && colIndex == colNum - 1) {
							nextCell = activeDocument.querySelector(`#${tableId}00`);
						} else if (colIndex == colNum - 1) {
							nextCell = activeDocument.querySelector(`#${tableId}${rowIndex + 1}0`);
						} else {
							nextCell = activeDocument.querySelector(`#${tableId}${rowIndex}${colIndex + 1}`);
						}
						if (nextCell instanceof HTMLTableCellElement)
							nextCell.click();
					}
					return;
				}
			})

			// 如果没有 hover 任何 cell，或者正在编辑的 cell 不是 hover 的 cell
			// 正在编辑的 cell 退出编辑状态，并提交更改
			this.registerDomEvent(activeDocument, 'click', async () => {
				if (this.editingCell && !isSameCell(this.hoverCell, this.editingCell)) {
					await this.doneEdit(this.editingCell);
				}
			});

			// 监听 ctrl
			this.ctrl = false;
			this.registerDomEvent(activeDocument, 'keydown', (e) => {
				if (e.key == 'Ctrl') this.ctrl = true;
			});
			this.registerDomEvent(activeDocument, 'keyup', (e) => {
				if (e.key == 'Ctrl') this.ctrl = false;
			});
		});

		this.registerMarkdownPostProcessor((element, context) => {
			const tables = element.querySelectorAll('table');
			tables.forEach((table) => {
				// 忽略 dataview 的表格
				if (table.classList.contains('dataview'))
					return;
				const tableId = this.getIdentifier(table);
				// console.log(tableId);
				// 监听当前 hover 的 table
				table.onmouseenter = (e) => {
					this.hoverTableId = tableId;
					// 为
				}
				// 点击表格不再转换为源码编辑模式
				// 仍可以从左上角按钮转换到源码编辑模式
				table.onclick = (e) => e.preventDefault();

				// 为表格 cell 添加行索引、列索引属性
				for (let j = 0; j < table.rows.length; j++) {
					const row = table.rows[j];
					for (let k = 0; k < row.cells.length; k++) {
						const cellEl = row.cells[k];
						// 设置 id
						cellEl.setAttr('id', `${tableId}${j}${k}`);
						// 监听当前 hover 的 cell
						cellEl.onmouseenter = (e) => {
							this.hoverCell = {
								tableId,
								rowIndex: j,
								colIndex: k,
								cellEl
							};
							this.toolBar?.tryShowFor(this.hoverCell);
						}
						cellEl.onmouseout = (e) => {
							this.hoverCell = null;
							this.toolBar?.tryHide(200);
						}
						// 为每个 cell 注册点击事件
						cellEl.onclick = async (e) => {
							e.preventDefault();
							e.stopPropagation();

							// 按下了 ctrl，或处于 reading 模式，则不触发编辑
							if (this.ctrl || inReadingView())
								return;

							// 已经处于编辑模式，防止再次触发
							if (cellEl.getAttr('contenteditable') == 'true' || !this.hoverTableId)
								return;

							// 如果之前正在编辑 cell，则取消之
							if (this.editingCell && !isSameCell(this.editingCell, this.hoverCell)) {
								await this.doneEdit(this.editingCell);
								// 取消编辑状态后，整个编辑器会重新渲染
								// 因此需要终止当前事件回调
								// 触发渲染后新元素的事件回调
								const newCell = activeDocument.querySelector(`#${tableId}${j}${k}`);
								if (newCell instanceof HTMLTableCellElement)
									newCell.click();
								return;
							}

							// 先 parse
							await this.tableEditor.parseActiveFile();

							// 将 cell 内替换为 md 源码
							const text = this.tableEditor.getCell(this.hoverTableId!, j, k);
							cellEl.innerText = text;

							// 使这个 cell 可编辑
							cellEl.setAttr('contenteditable', true);

							// 聚焦
							cellEl.focus();

							// 光标移动到最右侧
							if (text != '')
								setCaretPosition(cellEl, text.length);

							// 为正在编辑的 cell 添加 class
							cellEl.classList.add('is-editing');

							// 将当前点击的 cell 设为正在编辑的 cell
							this.editingCell = { tableId: this.hoverTableId, rowIndex: j, colIndex: k, cellEl: cellEl };

							// 绑定补全
							this.suggestPopper?.bindOuterEl(cellEl);
						}
					}
				}
			});
		});

		this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor, view) => {

			menu.addItem((item) => {
				item.setTitle('Create 2x2 table');
				item.onClick(async () => {
					// 先 parse
					await this.tableEditor.parseActiveFile();
					await this.tableEditor.createMinimalNewTable();
				})
			});

			if (!this.hoverCell || !this.hoverTableId)
				return;

			// 点选 menu 中的选项时，很可能会移出 cell，因此这里将触发时所在 cell 的 rowIndex 和 colIndex，还有 hoverTableId 先记录下来
			const hoverCellRowIndex = this.hoverCell.rowIndex;
			const hoverCellColIndex = this.hoverCell.colIndex;
			const hoverTableId = this.hoverTableId;

			menu
			  .addItem((item) => {
				item.setTitle('Delete row');
				item.onClick(async () => {
					if (hoverCellRowIndex == 0) {
						new Notice('You can\'t delete header of a table.');
						return;
					}
					// 先 parse
					await this.tableEditor.parseActiveFile();
					await this.tableEditor.deleteRow(hoverTableId, hoverCellRowIndex);
				})
			}).addItem((item) => {
				item.setTitle('Delete column');
				item.onClick(async () => {
					// 先 parse
					await this.tableEditor.parseActiveFile();
					await this.tableEditor.deleteCol(hoverTableId, hoverCellColIndex);
				})
			}).addItem((item) => {
				item.setTitle('Insert row below');
				item.onClick(async () => {
					// 先 parse
					await this.tableEditor.parseActiveFile();
					await this.tableEditor.insertRowBelow(hoverTableId, hoverCellRowIndex);
				})
			}).addItem((item) => {
				item.setTitle('Insert column right (left aligned)');
				item.onClick(async () => {
					// 先 parse
					await this.tableEditor.parseActiveFile();
					await this.tableEditor.insertColRight(hoverTableId, hoverCellColIndex);
				})
			});
		}));
	}

	onunload() {}

	/**
	 * 取消一个 cell 的编辑状态
	 * @param cell 操作对象 cell
	 */
	async doneEdit(cell: Cell) {

		const { rowIndex, colIndex, cellEl: cellElem } = cell;
		if (!this.hoverTableId)
			return;

		// 停止编辑
		cellElem.setAttr('contenteditable', false);

		// 提交更改
		await this.tableEditor.update(
			this.hoverTableId,
			rowIndex,
			colIndex,
			cellElem.innerText, // 加个空格以触发重新渲染
		);

		// 取消高亮
		cellElem.classList.remove('is-editing');

		// 清空
		this.editingCell = null;

		// 关闭补全窗口
		if (this.suggestPopper)
			this.suggestPopper.disable();
	}

	// 计算表格索引 TODO 是否只取前 n 个 cells
	getIdentifier(table: HTMLTableElement) {
		const result = [];
		const rowNum = table.rows.length;
		for (let i = 0; i < rowNum; i ++) {
			const str = table.rows[i].cells[0].innerHTML.replace(/&nbsp;/gi,'');
			// console.log(table.rows[0].cells[i], '' + str);
			// 不考虑空 cell 和含 ! 的 cell（因为可能是图片）和 <、> 的 cell（因为可能是 html 标签）
			if (str && str.trim() != '' && !str.match(/[!<>*#\[\]`$=]/)) {
				result.push(str.trim());
			}
		}
		let i = table.rows[0].cells.length;
		while (i --) {
			const str = table.rows[0].cells[i].innerHTML.replace(/&nbsp;/gi,'');
			// console.log(table.rows[0].cells[i], '' + str);
			// 不考虑空 cell 和含 ! 的 cell（因为可能是图片）和 <、> 的 cell（因为可能是 html 标签）
			if (str && str.trim() != '' && !str.match(/[!<>*#\[\]`$=]/))
				result.push(str.trim());
		}
		// 添加行列数
		result.push(table.rows.length.toString());
		result.push(table.rows[0].cells.length.toString());
		// 筛去 md 标记符号
		const resultStr = result.join('');
		// console.log(resultStr);
		if (resultStr.length == 0)
			return '空表';
		return String.fromCharCode(hashCode(resultStr));
	}
}
