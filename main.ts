import {MarkdownView, Notice, Plugin} from 'obsidian';
import {TableEditor} from "./src/table-editor";
import {Cell} from "./src/table";
import {getCaretPosition, setCaretPosition} from "./src/html-utils";
import {getRowNum, isSameCell} from "./src/table-utils";
import {text} from "stream/consumers";
import {hashCode} from "./src/editor-utils";

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

	async onload() {
		this.tableEditor = new TableEditor(this.app);

		this.editingCell = null;
		activeDocument.addEventListener('keydown', async (e) => {
			// 按下 Esc 或 Enter 时，正在编辑的 cell 退出编辑状态，并提交更改
			if ((e.key == 'Enter' || e.key == 'Escape') && this.editingCell)
				await this.doneEdit(this.editingCell);
		});

		// 如果没有 hover 任何 cell，或者正在编辑的 cell 不是 hover 的 cell
		// 正在编辑的 cell 退出编辑状态，并提交更改
		activeDocument.addEventListener('click', async () => {
			if (this.editingCell && !isSameCell(this.hoverCell, this.editingCell)) {
				await this.doneEdit(this.editingCell);
			}
		});

		// 监听 ctrl
		this.ctrl = false;
		activeDocument.addEventListener('keydown', (e) => {
			if (e.key == 'Ctrl') this.ctrl = true;
		});
		activeDocument.addEventListener('keyup', (e) => {
			if (e.key == 'Ctrl') this.ctrl = false;
		});

		this.registerMarkdownPostProcessor((element, context) => {
			const tables = element.querySelectorAll('table');
			tables.forEach((table) => {
				const tableId = this.getIdentifier(table);
				console.log(tableId);
				// 监听当前 hover 的 table
				table.onmouseenter = (e) => this.hoverTableId = tableId;
				// 点击表格不再转换为源码编辑模式
				// 仍可以从左上角按钮转换到源码编辑模式
				table.onclick = (e) => e.preventDefault();
				// 为表格 cell 添加行索引、列索引属性
				for (let j = 0; j < table.rows.length; j++) {
					const row = table.rows[j];
					for (let k = 0; k < row.cells.length; k++) {
						const cell = row.cells[k];
						// 设置 id
						cell.setAttr('id', `${tableId}${j}${k}`);
						// 监听当前 hover 的 cell
						cell.onmouseenter = (e) => this.hoverCell = {
							tableId,
							rowIndex: j,
							colIndex: k,
							cell
						};
						cell.onmouseout = (e) => this.hoverCell = null;
						// 为每个 cell 注册点击事件
						cell.onclick = async (e) => {
							e.preventDefault();
							e.stopPropagation();

							// 按下了 ctrl，则不触发编辑
							if (this.ctrl)
								return;

							// 已经处于编辑模式，防止再次触发
							if (cell.getAttr('contenteditable') == 'true' || !this.hoverTableId)
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
							cell.innerText = text;

							// 使这个 cell 可编辑
							cell.setAttr('contenteditable', true);

							// 聚焦
							cell.focus();

							// 光标移动到最右侧
							if (text != '')
								setCaretPosition(cell, text.length);

							// 高亮显示正在编辑的 cell
							cell.style.backgroundColor = 'var(--bg1)';
							cell.style.filter = 'brightness(1.5)';

							// 将当前点击的 cell 设为正在编辑的 cell
							this.editingCell = { tableId: this.hoverTableId, rowIndex: j, colIndex: k, cell };
						}
						cell.onkeydown = async (e) => {

							// console.log(e);

							if (e.key == 'Enter') {
								e.preventDefault();
								return;
							}

							// 按左键
							if (e.key == 'ArrowLeft' && this.editingCell) {
								e.preventDefault();
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
							if (e.key == 'ArrowRight' && this.editingCell) {
								e.preventDefault();
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
								// console.log('<c-a> detected');
								e.preventDefault();
								const selection = activeWindow.getSelection();
								const range = activeDocument.createRange();
								range.selectNodeContents(cell);
								selection?.removeAllRanges();
								selection?.addRange(range);
								return;
							}

							// 按上键，正在编辑的 cell 退出编辑状态，并提交更改
							// 然后开始编辑这个 cell 上方的 cell （如果存在）
							if (e.key == 'ArrowUp' && this.editingCell) {
								e.preventDefault();
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
							if (e.key == 'ArrowDown' && this.editingCell) {
								e.preventDefault();
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
							if (e.shiftKey && e.key == 'Tab' && this.editingCell) {
								e.preventDefault();
								const { tableId, rowIndex, colIndex } = this.editingCell;
								await this.doneEdit(this.editingCell);
								const cellLeft = activeDocument.querySelector(`#${tableId}${rowIndex}${colIndex - 1}`);
								if (cellLeft instanceof HTMLTableCellElement) {
									cellLeft.click();
								}
								return;
							}

							// 按 Tab，正在编辑的 cell 退出编辑状态，并提交更改
							// 然后开始编辑这个 cell 左侧的 cell （如果存在）
							if (e.key == 'Tab' && this.editingCell) {
								e.preventDefault();
								const { tableId, rowIndex, colIndex } = this.editingCell;
								await this.doneEdit(this.editingCell);
								const cellRight = activeDocument.querySelector(`#${tableId}${rowIndex}${colIndex + 1}`);
								if (cellRight instanceof HTMLTableCellElement) {
									cellRight.click();
								}
								return;
							}
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
					if (hoverCellRowIndex == 0) {
						new Notice('You can\'t add new row under header of table.');
						return;
					}
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

	onunload() {

	}

	/**
	 * 取消一个 cell 的编辑状态
	 * @param cell 操作对象 cell
	 */
	async doneEdit(cell: Cell) {

		const { rowIndex, colIndex, cell: cellElem } = cell;
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
		cellElem.style.backgroundColor = 'initial';
		cellElem.style.filter = 'none';

		// 清空
		this.editingCell = null;
	}

	// 计算表格索引 TODO 是否只取前几行 / 列
	getIdentifier(table: HTMLTableElement) {
		const result = [];
		const rowNum = table.rows.length;
		for (let i = 0; i < rowNum; i ++) {
			const str = table.rows[i].cells[0].textContent;
			if (str && str.trim() != '') {
				result.push(str.trim());
			}
		}
		let i = table.rows[0].cells.length;
		while (i --) {
			const str = table.rows[0].cells[i].textContent;
			if (str && str.trim() != '')
				result.push(str.trim());
		}
		return String.fromCharCode(hashCode(result.join('')));
	}

	async forcePostProcessorReload() {
		this.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;
			if (view.getViewType() === "markdown") {
				if (view instanceof MarkdownView)
					view.previewMode.rerender(true);
			}
		});
	}
}
