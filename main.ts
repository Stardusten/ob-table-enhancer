import {MarkdownEditView, MarkdownView, Notice, Plugin} from 'obsidian';
import {TableEditor} from "./src/table-editor";
import {Cell} from "./src/table";
import {getCaretPosition, setCaretPosition} from "./src/html-utils";
import {getRowNum, isSameCell} from "./src/table-utils";
import {text} from "stream/consumers";
import {deleteLine, hashCode, inReadingView} from "./src/editor-utils";
import {ReferenceSuggestionPopper} from "./src/reference-suggest";
import {ToolBar} from "./src/tool-bar";
import {ObTableEnhancerSettingTab} from "./src/setting-tab";
import {Arr} from "tern";

// Remember to rename these classes and interfaces!

interface ObTableEnhancerSettings {
	enableFloatingToolBar: boolean,
	enableInReadingMode: boolean,
}

const DEFAULT_SETTINGS: ObTableEnhancerSettings = {
	enableFloatingToolBar: false,
	enableInReadingMode: false,
}

export default class MyPlugin extends Plugin {

	settings: ObTableEnhancerSettings;
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
		await this.loadSettings();
		this.addSettingTab(new ObTableEnhancerSettingTab(this.app, this));

		this.tableEditor = new TableEditor(this);
		this.editingCell = null;
		this.hoverCell = null;

		this.app.workspace.onLayoutReady(() => {

			this.suggestPopper = new ReferenceSuggestionPopper(this);

			if (this.settings.enableFloatingToolBar)
				this.toolBar = new ToolBar(this);

			// 劫持滚动事件
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView instanceof MarkdownView) {
				const cm = (markdownView.editor as any).cm;
				this.registerDomEvent(cm.scrollDOM, 'scroll', (e: Event) => {
					// 如果当前正在编辑表格，则屏蔽默认滚动事件
					// if (this.hoverTableId) {
						e.preventDefault();
						e.stopImmediatePropagation();
					// }
				}, true);
			}

			this.registerDomEvent(activeDocument, 'keydown', async (e) => {

				if (!this.editingCell)
					return;
				const cell = this.editingCell.cellEl;

				// <shift-enter> 单元格内换行，md 语法应该是插入一个 <br> 标签
				if (!e.repeat && e.key == 'Enter' && e.shiftKey && this.editingCell) {
					e.preventDefault();
					const prevCaretPos = getCaretPosition(cell);
					const text1 = cell.innerText.slice(0, prevCaretPos);
					const text2 = cell.innerText.slice(prevCaretPos + 1);
					cell.innerText = [text1, ' <br> ', text2].join('');
					setCaretPosition(cell, prevCaretPos + 6);
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
						// XXX 如果对表格做了修改，则表索引很可能会改变
						// 因此在 doneEdit 触发重新渲染后，原有的 tableId 可能是失效的
						// 但 tab 并不会删除表或者添加表，也就是表在 this.tableEditor 中的下标是不变的
						// 据此得到新的 tableId
						const tableIndex = this.tableEditor.getTableIds().indexOf(tableId);
						await this.doneEdit(this.editingCell);
						const newTableId = this.tableEditor.getTableIds()[tableIndex];
						const cellLeft = activeDocument.querySelector(`#${newTableId}${rowIndex}${colIndex - 1}`);
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
						// XXX 如果对表格做了修改，则表索引很可能会改变
						// 因此在 doneEdit 触发重新渲染后，原有的 tableId 可能是失效的
						// 但 tab 并不会删除表或者添加表，也就是表在 this.tableEditor 中的下标是不变的
						// 据此得到新的 tableId
						const tableIndex = this.tableEditor.getTableIds().indexOf(tableId);
						await this.doneEdit(this.editingCell);
						const newTableId = this.tableEditor.getTableIds()[tableIndex];
						const cellRight = activeDocument.querySelector(`#${newTableId}${rowIndex}${colIndex + 1}`);
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
					// XXX 如果对表格做了修改，则表索引很可能会改变
					// 因此在 doneEdit 触发重新渲染后，原有的 tableId 可能是失效的
					// 但 tab 并不会删除表或者添加表，也就是表在 this.tableEditor 中的下标是不变的
					// 据此得到新的 tableId
					const tableIndex = this.tableEditor.getTableIds().indexOf(tableId);
					await this.doneEdit(this.editingCell);
					const newTableId = this.tableEditor.getTableIds()[tableIndex];
					const cellAbove = activeDocument.querySelector(`#${newTableId}${rowIndex - 1}${colIndex}`);
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
					// XXX 如果对表格做了修改，则表索引很可能会改变
					// 因此在 doneEdit 触发重新渲染后，原有的 tableId 可能是失效的
					// 但 tab 并不会删除表或者添加表，也就是表在 this.tableEditor 中的下标是不变的
					// 据此得到新的 tableId
					const tableIndex = this.tableEditor.getTableIds().indexOf(tableId);
					await this.doneEdit(this.editingCell);
					const newTableId = this.tableEditor.getTableIds()[tableIndex];
					const cellBelow = activeDocument.querySelector(`#${newTableId}${rowIndex + 1}${colIndex}`);
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
					// XXX 如果对表格做了修改，则表索引很可能会改变
					// 因此在 doneEdit 触发重新渲染后，原有的 tableId 可能是失效的
					// 但 tab 并不会删除表或者添加表，也就是表在 this.tableEditor 中的下标是不变的
					// 据此得到新的 tableId
					const tableIndex = this.tableEditor.getTableIds().indexOf(tableId);
					await this.doneEdit(this.editingCell);
					const newTableId = this.tableEditor.getTableIds()[tableIndex];
					const table = this.tableEditor.tables.get(newTableId);
					if (table) {
						const rowNum = table.cells.length;
						const colNum = table.cells[0].length;
						let nextCell;
						if (rowIndex == 0 && colIndex == 0) {
							nextCell = activeDocument.querySelector(`#${newTableId}${rowNum - 1}${colNum - 1}`);
						} else if (colIndex == 0) {
							nextCell = activeDocument.querySelector(`#${newTableId}${rowIndex - 1}${colNum - 1}`);
						} else {
							nextCell = activeDocument.querySelector(`#${newTableId}${rowIndex}${colIndex - 1}`);
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
					// XXX 如果对表格做了修改，则表索引很可能会改变
					// 因此在 doneEdit 触发重新渲染后，原有的 tableId 可能是失效的
					// 但 tab 并不会删除表或者添加表，也就是表在 this.tableEditor 中的下标是不变的
					// 据此得到新的 tableId
					const tableIndex = this.tableEditor.getTableIds().indexOf(tableId);
					await this.doneEdit(this.editingCell);
					const newTableId = this.tableEditor.getTableIds()[tableIndex];
					const table = this.tableEditor.tables.get(newTableId);
					if (table) {
						const rowNum = table.cells.length;
						const colNum = table.cells[0].length;
						let nextCell;
						if (rowIndex == rowNum - 1 && colIndex == colNum - 1) {
							nextCell = activeDocument.querySelector(`#${newTableId}00`);
						} else if (colIndex == colNum - 1) {
							nextCell = activeDocument.querySelector(`#${newTableId}${rowIndex + 1}0`);
						} else {
							nextCell = activeDocument.querySelector(`#${newTableId}${rowIndex}${colIndex + 1}`);
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
			// console.log(element);
			const tables = element.querySelectorAll('table');
			tables.forEach(async (table) => {
				// 忽略 dataview 的表格
				if (table.classList.contains('dataview'))
					return;
				// 忽略 admonition 内的表格
				if (table.parentElement && table.parentElement.classList.contains('admonition-content'))
					return;
				// 计算 tableId
				const tableId = this.getIdentifier(table);
				// 添加 class
				table.classList.add('ob-table-enhancer');
				// 添加 id
				table.setAttr('id', tableId);
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
						// 处理函数
						if (cellEl.innerText.startsWith('>>>')) {
							await this.tableEditor.parseActiveFile();
							// 环境变量
							const t = this.tableEditor?.tables?.get(tableId);
							const c = t?.cells.map(row => row[k]).slice(1, -1);
							const nc: any = t?.cells.map(row => row[k]).slice(1, -1).map(e => parseFloat(e));
							const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0.0);
							const avg = (arr: number[]) => sum(arr) / arr.length;
							const max = (arr: number[]) => Math.max( ...arr );
							const min = (arr: number[]) => Math.min( ...arr );
							try {
								cellEl.innerText = ((str: string) => eval(str)).call({
									t, c, nc, sum, avg, min, max
								}, cellEl.innerText.replace(/^>>>/, ''));
							} catch (err) { console.error(err); }
						}
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
							if (this.ctrl || (!this.settings.enableInReadingMode && inReadingView()))
								return;

							// 已经处于编辑模式，防止再次触发
							if (cellEl.getAttr('contenteditable') == 'true' || !this.hoverTableId)
								return;

							// 如果之前正在编辑 cell，则取消之
							if (this.editingCell && !isSameCell(this.editingCell, this.hoverCell)) {
								// XXX 如果对表格做了修改，则表索引很可能会改变
								// 因此在 doneEdit 触发重新渲染后，原有的 tableId 可能是失效的
								// 但 tab 并不会删除表或者添加表，也就是表在 this.tableEditor 中的下标是不变的
								// 据此得到新的 tableId
								const tableIndex = this.tableEditor.getTableIds().indexOf(tableId);
								await this.doneEdit(this.editingCell);
								// 取消编辑状态后，整个编辑器会重新渲染
								// 因此需要终止当前事件回调
								// 触发渲染后新元素的事件回调
								const newTableId = this.tableEditor.getTableIds()[tableIndex];
								const newCell = activeDocument.querySelector(`#${newTableId}${j}${k}`);
								if (newCell instanceof HTMLTableCellElement)
									newCell.click();
								return;
							}

							// 聚焦
							cellEl.focus();

							// parse
							// 注意：由于 parseActiveFile 做了一致性检查，因此反复调用不会造成额外开销
							await this.tableEditor.parseActiveFile();

							// 使这个 cell 可编辑
							cellEl.setAttr('contenteditable', true);

							// 将 cell 内替换为 md 源码
							const text = this.tableEditor.getCell(this.hoverTableId!, j, k);

							// 避免空串
							if (text == '') {
								cellEl.innerText = ' ';
								setCaretPosition(cellEl, 0);
							} else {
								cellEl.innerText = text;
								setCaretPosition(cellEl, text.length);
							}

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

		this.addCommand({
			id: 'insert2x2table',
			name: 'Insert 2x2 table',
			editorCallback: async (editor, view) => {
				await this.tableEditor.parseActiveFile();
				await this.tableEditor.createMinimalNewTable();
			}
		});

		this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor, view) => {
			if (this.hoverTableId) {
				menu.addItem((item) => {
					item.setTitle('Copy as HTML');
					item.onClick(async (e) => {
						const tableEl = activeDocument.querySelector(`#${this.hoverTableId}`);
						if (!(tableEl instanceof HTMLTableElement))
							return;
						activeWindow.getSelection()?.removeAllRanges();
						const range = activeDocument.createRange();
						range.selectNode(tableEl);
						activeWindow.getSelection()?.addRange(range);
						activeDocument.execCommand('copy');
						activeWindow.getSelection()?.removeAllRanges();
					});
				});

				menu.addItem(async (item) => {
					item.setTitle('Copy as Markdown');
					item.onClick(async (e) => {
						if (!this.hoverTableId)
							return;
						await this.tableEditor.parseActiveFile();
						const table = this.tableEditor.tables.get(this.hoverTableId);
						if (!table)
							return;
						const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (markdownView instanceof MarkdownView) {
							const editor = markdownView.editor;
							const tableMd = [];
							// 单独处理表头
							// 在第一个表头后面加个 /u3000，保证粘贴后与原表格索引不同
							let firstRowCells = table.cells[0];
							firstRowCells = firstRowCells.map(s => `${s}　`);
							const firstRow = TableEditor.rowCells2rowString(firstRowCells);
							tableMd.push(firstRow);
							for (let i = table.fromRowIndex + 1; i < table.toRowIndex; i++)
								tableMd.push(editor.getLine(i));
							await navigator.clipboard.writeText(tableMd.join('\n'));
						}
					})
				});

				menu.addItem(async (item) => {
					item.setTitle('Delete entire table');
					item.onClick(async () => {
						if (!this.hoverTableId)
							return;
						if (this.editingCell) // XXX
							await this.doneEdit(this.editingCell);
						await this.tableEditor.parseActiveFile();
						await this.tableEditor?.deleteEntireTable(this.hoverTableId);
					})
				});
			}
		}));
	}

	onunload() {
		this.suggestPopper?.onUnload();
		this.toolBar?.onUnload();
	}

	/**
	 * 取消一个 cell 的编辑状态
	 * @param cell 操作对象 cell
	 */
	async doneEdit(cell: Cell) {

		const { tableId, rowIndex, colIndex, cellEl: cellElem } = cell;
		if (!this.hoverTableId)
			return;

		// 停止编辑
		cellElem.setAttr('contenteditable', false);

		// 提交更改
		await this.tableEditor.update(
			this.hoverTableId,
			rowIndex,
			colIndex,
			cellElem.innerText.trim(),
		);

		// 编辑器失焦，防止聚焦到光标处
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView instanceof MarkdownView) {
			const editor = markdownView.editor;
			editor.blur();
		}

		// parse
		await this.tableEditor.parseActiveFile();

		// 取消高亮
		cellElem.classList.remove('is-editing');

		// 关闭补全窗口
		if (this.suggestPopper)
			this.suggestPopper.disable();

		// 清空 editingCell
		this.editingCell = null;
	}

	// 计算表格索引 TODO 是否只取前 n 个 cells
	getIdentifier(table: HTMLTableElement) {
		const result = [];
		const rowNum = table.rows.length;
		// 保留 \u3000 不筛去
		for (let i = 0; i < rowNum; i ++) {
			const str = table.rows[i].cells[0].innerHTML
				.replace(/&nbsp;/gi,'');
			// console.log(table.rows[0].cells[i], '' + str);
			// 不考虑空 cell 和含 ! 的 cell（因为可能是图片）和 <、> 的 cell（因为可能是 html 标签）
			if (str != '' && !str.match(/ [!<>*#\[\]`$&=]/)) {
				result.push(str.replace(/[\r\n\t\f\v \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\ufeff]/g, ''));
			}
		}
		let i = table.rows[0].cells.length;
		while (i --) {
			const str = table.rows[0].cells[i].innerHTML.replace(/&nbsp;/gi,'');
			// console.log(table.rows[0].cells[i], '' + str);
			// 不考虑空 cell 和含 ! 的 cell（因为可能是图片）和 <、> 的 cell（因为可能是 html 标签）
			if (str && !str.match(/[!<>*#\[\]`$&=]/))
				result.push(str.replace(/[\r\n\t\f\v \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\ufeff]/g, ''));
		}
		// 保留 \u3000 不筛去
		let resultStr = result.join('');
		// console.log(resultStr);
		if (resultStr.length == 0)
			return '空表';
		// 添加行列数
		resultStr += table.rows.length.toString();
		resultStr += table.rows[0].cells.length.toString();
		// console.log(resultStr);
		// console.log(table);
		return String.fromCharCode(hashCode(resultStr));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// update
		if (!this.settings.enableFloatingToolBar)
			this.toolBar = null;
		else this.toolBar = new ToolBar(this);
	}
}
