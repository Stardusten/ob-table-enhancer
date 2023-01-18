import TableEnhancer2 from "../main";
import {
	cloneIcon,
	deleteIcon,
	downIcon,
	insertBelowIcon,
	insertRightIcon,
	moveLeftIcon,
	moveRightIcon,
	upwardIcon
} from "./icon";
import {getCellInfo, Table} from "./global";
import {Notice} from "obsidian";

export class ToolBar {

	plugin: TableEnhancer2;
	rowOpBarEl: HTMLElement;
	colOpBarEl: HTMLElement;
	/** 所有被激活的 toolbar */
	activeOpBars: HTMLElement[];
	/** 隐藏 timeout，若有多个被激活的 toolbar，它们公用同一 timeout */
	hideTimeout: any;
	/** 当前为哪个 cell 显示工具栏 */
	cell: { tableLine: number, i: number, j: number };

	constructor(plugin: TableEnhancer2) {
		this.plugin = plugin;
		this.rowOpBarEl = createDiv({cls: 'ob-table-enhancer-row-bar'});
		this.colOpBarEl = createDiv({cls: 'ob-table-enhancer-col-bar'});

		this.rowOpBarEl.createDiv({
			cls: 'ob-table-enhancer-row-bar-button'
		}, (el) => {
			el.innerHTML = upwardIcon;
			el.onclick = async () => {
				if (this.cell.i == 1) {
					new Notice('Current column is already the top row.');
					return;
				}
				const table = await plugin.tableEditor.getTable(this.cell.tableLine);
				if (!table) {
					console.error('Cannot get table.');
					return;
				}
				await this.plugin.tableEditor.swapRows(table, this.cell.i,this.cell.i - 1);
			}
		});

		this.rowOpBarEl.createDiv({
			cls: 'ob-table-enhancer-row-bar-button'
		}, (el) => {
			el.innerHTML = downIcon;
			el.onclick = async () => {
				const table = await plugin.tableEditor.getTable(this.cell.tableLine);
				if (!table) {
					console.error('Cannot get table.');
					return;
				}
				const rowNum = table.cells.length;
				if (this.cell.i == rowNum - 1) {
					new Notice('Current column is already the bottom row.');
					return;
				}
				await this.plugin.tableEditor.swapRows(table, this.cell.i,this.cell.i + 1);
			}
		});

		this.rowOpBarEl.createDiv({
			cls: 'ob-table-enhancer-row-bar-button'
		}, (el) => {
			el.innerHTML = insertBelowIcon;
			el.onclick = async () => {
				const table = await plugin.tableEditor.getTable(this.cell.tableLine);
				if (!table) {
					console.error('Cannot get table.');
					return;
				}
				await this.plugin.tableEditor.insertRowBelow(table, this.cell.i);
			}
		});

		this.colOpBarEl.createDiv({
			cls: 'ob-table-enhancer-col-bar-button'
		}, (el) => {
			el.innerHTML = moveLeftIcon;
			el.onclick = async () => {
				if (this.cell.j == 0) {
					new Notice('Current column is already the leftmost column.');
					return;
				}
				const table = await plugin.tableEditor.getTable(this.cell.tableLine);
				if (!table) {
					console.error('Cannot get table.');
					return;
				}
				await plugin.tableEditor.swapCols(table, this.cell.j, this.cell.j - 1);
			}
		});

		this.colOpBarEl.createDiv({
			cls: 'ob-table-enhancer-col-bar-button'
		}, (el) => {
			el.innerHTML = insertRightIcon;
			el.onclick = async () => {
				const table = await plugin.tableEditor.getTable(this.cell.tableLine);
				if (!table) {
					console.error('Cannot get table.');
					return;
				}
				await this.plugin.tableEditor.insertColRight(table, this.cell.j);
			}
		});

		this.rowOpBarEl.createDiv({
			cls: 'ob-table-enhancer-row-bar-button'
		}, (el) => {
			el.innerHTML = deleteIcon;
			el.onclick = async () => {
				if (this.cell.i == 0) {
					new Notice('You can\'t delete the header of a table.');
					return;
				}
				const table = await plugin.tableEditor.getTable(this.cell.tableLine);
				if (!table) {
					console.error('Cannot get table.');
					return;
				}
				await this.plugin.tableEditor.deleteRow(table, this.cell.i);
			}
		});

		this.colOpBarEl.createDiv({
			cls: 'ob-table-enhancer-col-bar-button'
		}, (el) => {
			el.innerHTML = deleteIcon;
			el.onclick = async () => {
				const table = await plugin.tableEditor.getTable(this.cell.tableLine);
				if (!table) {
					console.error('Cannot get table.');
					return;
				}
				await this.plugin.tableEditor.deleteCol(table, this.cell.j);
			}
		});

		this.colOpBarEl.createDiv({
			cls: 'ob-table-enhancer-col-bar-button'
		}, (el) => {
			el.innerHTML = moveRightIcon;
			el.onclick = async () => {
				const table = await plugin.tableEditor.getTable(this.cell.tableLine);
				if (!table) {
					console.error('Cannot get table.');
					return;
				}
				const colNum = table.formatLine.length;
				if (this.cell.j == colNum - 1) {
					new Notice('Current column is already the rightmost column.');
					return;
				}
				await this.plugin.tableEditor.swapCols(table, this.cell.j, this.cell.j + 1);
			}
		});

		this.colOpBarEl.createDiv({
			cls: 'ob-table-enhancer-col-bar-button'
		}, (el) => {
			el.innerHTML = cloneIcon;
			el.onclick = async () => {
				const table = await plugin.tableEditor.getTable(this.cell.tableLine);
				if (!table) {
					console.error('Cannot get table.');
					return;
				}
				const col = table.cells.map(row => row[this.cell.j]);
				await this.plugin.tableEditor.insertColRight(table, this.cell.j, col);
			}
		});

		this.rowOpBarEl.createDiv({
			cls: 'ob-table-enhancer-row-bar-button'
		}, (el) => {
			el.innerHTML = cloneIcon;
			el.onclick = async () => {
				const table = await plugin.tableEditor.getTable(this.cell.tableLine);
				if (!table) {
					console.error('Cannot get table.');
					return;
				}
				await this.plugin.tableEditor.insertRowBelow(table, this.cell.i, table.cells[this.cell.i]);
			}
		});

		// 滚动时不显示
		plugin.registerDomEvent(activeDocument, 'scroll', (e) => {
			this.colOpBarEl.style.opacity = '0';
			this.rowOpBarEl.style.opacity = '0';
			this.activeOpBars = [];
		}, true);

		if (activeDocument) {
			activeDocument.body.appendChild(this.rowOpBarEl);
			activeDocument.body.appendChild(this.colOpBarEl);
		}
	}

	tryShowFor(cellEl: HTMLTableCellElement) {
		if (this.plugin.isInReadingView())
			return;
		// 清除隐藏计时
		if (this.hideTimeout)
			clearTimeout(this.hideTimeout);
		this.cell = getCellInfo(cellEl, this.plugin)!;
		// cell 为第一列 cell，展示行操作 toolbar
		if (this.cell.j == 0) {
			this.activeOpBars.push(this.rowOpBarEl);
			this.rowOpBarEl.style.opacity = '1';
			this.colOpBarEl.style.zIndex = '99';
			const cellRect = cellEl.getBoundingClientRect();
			const toolBarRect = this.rowOpBarEl.getBoundingClientRect();
			this.rowOpBarEl.style.top = `${cellRect.top}px`;
			this.rowOpBarEl.style.left = `${cellRect.left - toolBarRect.width}px`;
			this.rowOpBarEl.style.height = `${cellRect.height}px`; // 高度保持和 cell 一致
		}
		// cell 为第一行的 cell，展示列操作 toolbar
		if (this.cell.i == 0) {
			this.activeOpBars.push(this.colOpBarEl);
			this.colOpBarEl.style.opacity = '1';
			this.colOpBarEl.style.zIndex = '99';
			const cellRect = cellEl.getBoundingClientRect();
			const toolBarRect = this.colOpBarEl.getBoundingClientRect();
			this.colOpBarEl.style.top = `${cellRect.top - toolBarRect.height}px`;
			this.colOpBarEl.style.left = `${cellRect.left}px`;
			this.colOpBarEl.style.width = `${cellRect.width}px`; // 宽度保持和 cell 一致
		}
	}

	/**
	 * 如果在 200ms 没有移入 toolbar，则隐藏 toolbar
	 *
	 * 否则当鼠标移出 toolbar 200ms 后隐藏 toolbar
	 */
	tryHide(timeout: number) {
		this.hideTimeout = setTimeout(() => {
			this.colOpBarEl.style.opacity = '0';
			this.rowOpBarEl.style.opacity = '0';
			this.colOpBarEl.style.zIndex = '-1';
			this.rowOpBarEl.style.zIndex = '-1';
			this.activeOpBars = [];
		}, timeout);
		const stopHideTimeout = (e: any) => {
			clearTimeout(this.hideTimeout);
			this.activeOpBars.forEach((toolBarEl) => {
				toolBarEl.onmouseout = (e) => {
					// 父级移入自己，不触发移出事件
					if ((e.relatedTarget instanceof Node) && toolBarEl.contains(e.relatedTarget))
						return;
					this.tryHide(500);
				}
			});
		}
		this.activeOpBars.forEach((toolbar) => {
			toolbar.onmouseenter = stopHideTimeout;
		});
	}

	onUnload() {
		this.colOpBarEl.remove();
		this.rowOpBarEl.remove();
	}
}
