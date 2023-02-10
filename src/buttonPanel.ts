import {BaseComponent, ButtonComponent, CloseableComponent, Editor, Menu, MenuItem, Notice} from "obsidian";
import TableEnhancer2 from "../main";
import {getCellInfo, getTableOfCell} from "./global";
import {insertRowBelow, insertColRight, cloneRow, cloneCol, delRow, delCol} from "./icon";
import {EditorView} from "@codemirror/view";

export const addButtons = (
	menu: Menu,
	plugin: TableEnhancer2,
	{ tableLine, i, j }: { tableLine: number, i: number, j: number }
) => {
	const oldOnLoad = menu.onload;
	menu.onload = () => {
		oldOnLoad.call(menu); // dynamic override
		const menuDom = (menu as any).dom as HTMLElement;
		const containerEl = createDiv({ cls: ['ob-table-enhancer', 'button-menu']});
		// Buttons
		new ButtonComponent(containerEl)
			.setTooltip('Insert row below')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit(); // 先保存更改再获取 table，防止取到过时的表格内容
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying to insert row below ');
					return;
				}
				await plugin.tableEditor.insertRowBelow(table, i);
			})
			.then(button => button.buttonEl.innerHTML = insertRowBelow);
		new ButtonComponent(containerEl)
			.setTooltip('Insert column right')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying to insert column below ');
					return;
				}
				await plugin.tableEditor.insertColRight(table, j);
			})
			.then(button => button.buttonEl.innerHTML = insertColRight);
		new ButtonComponent(containerEl)
			.setTooltip('Clone row')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying to copy row below ');
					return;
				}
				await plugin.tableEditor.insertRowBelow(table, i, table.cells[i]);
			})
			.then(button => button.buttonEl.innerHTML = cloneRow);
		new ButtonComponent(containerEl)
			.setTooltip('Clone column')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying to copy row below ');
					return;
				}
				const col = table.cells.map(row => row[j]);
				await plugin.tableEditor.insertColRight(table, j, col);
			})
			.then(button => button.buttonEl.innerHTML = cloneCol);
		new ButtonComponent(containerEl)
			.setTooltip('Delete row')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying to copy row below ');
					return;
				}
				await plugin.tableEditor.deleteRow(table, i);
			})
			.then(button => button.buttonEl.innerHTML = delRow);
		new ButtonComponent(containerEl)
			.setTooltip('Wider')
			.setIcon('chevrons-left-right')
			.setClass('clickable-icon')
			.onClick(async (e) => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying sort table ');
					return;
				}
				e.stopPropagation();
				e.preventDefault();
				const oldContent = table.cells[0][j];
				await plugin.tableEditor.updateCell(table, 0, j, oldContent + ' ');
			});
		new ButtonComponent(containerEl)
			.setTooltip('Delete column')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying to copy row below ');
					return;
				}
				await plugin.tableEditor.deleteCol(table, j);
			})
			.then(button => button.buttonEl.innerHTML = delCol);
		new ButtonComponent(containerEl)
			.setTooltip('Move column left')
			.setIcon('chevron-left')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying to copy row below ');
					return;
				}
				if (j == 0) {
					new Notice('Current column is already the leftmost column.');
					return;
				}
				await plugin.tableEditor.swapCols(table, j, j - 1);
			});
		new ButtonComponent(containerEl)
			.setTooltip('Move column right')
			.setIcon('chevron-right')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying to copy row below ');
					return;
				}
				const colNum = table.formatLine.length;
				if (j == colNum - 1) {
					new Notice('Current column is already the rightmost column.');
					return;
				}
				await plugin.tableEditor.swapCols(table, j, j + 1);
			});
		new ButtonComponent(containerEl)
			.setTooltip('Move row upward')
			.setIcon('chevron-up')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying to copy row below ');
					return;
				}
				if (i == 1) {
					new Notice('Current column is already the top row.');
					return;
				}
				await plugin.tableEditor.swapRows(table, i, i - 1);
			});
		new ButtonComponent(containerEl)
			.setTooltip('Move row down')
			.setIcon('chevron-down')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying to copy row below ');
					return;
				}
				const rowNum = table.cells.length;
				if (i == rowNum - 1) {
					new Notice('Current column is already the bottom row.');
					return;
				}
				await plugin.tableEditor.swapRows(table, i, i + 1);
			});
		new ButtonComponent(containerEl)
			.setTooltip('Narrower')
			.setIcon('chevrons-right-left')
			.setClass('clickable-icon')
			.onClick(async (e) => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying sort table ');
					return;
				}
				e.stopPropagation();
				e.preventDefault();
				const newContent = table.cells[0][j].replace(/ $/, '');
				await plugin.tableEditor.updateCell(table, 0, j, newContent);
			});
		const setColAlign = (aligned: 'left' | 'center' | 'right') => async () => {
			await plugin.doneEdit();
			const table = plugin.tableEditor.getTable(tableLine);
			if (!table) {
				console.error('cannot locate table when trying to copy row below ');
				return;
			}
			await plugin.tableEditor.setColAligned(table, j, aligned);
		};
		new ButtonComponent(containerEl)
			.setTooltip('Center align')
			.setIcon('align-center')
			.setClass('clickable-icon')
			.onClick(setColAlign('center'));
		new ButtonComponent(containerEl)
			.setTooltip('Left align')
			.setIcon('align-left')
			.setClass('clickable-icon')
			.onClick(setColAlign('left'));
		new ButtonComponent(containerEl)
			.setTooltip('Right align')
			.setIcon('align-right')
			.setClass('clickable-icon')
			.onClick(setColAlign('right'));
		new ButtonComponent(containerEl)
			.setTooltip('Sort ascending')
			.setIcon('sort-asc')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying sort table ');
					return;
				}
				await plugin.tableEditor.sortByCol(table, j, 'aes');
			});
		new ButtonComponent(containerEl)
			.setTooltip('Sort descending')
			.setIcon('sort-desc')
			.setClass('clickable-icon')
			.onClick(async () => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying sort table ');
					return;
				}
				await plugin.tableEditor.sortByCol(table, j, 'desc');
			});
		new ButtonComponent(containerEl)
			.setTooltip('Reset Column Width')
			.setIcon('undo-2')
			.setClass('clickable-icon')
			.onClick(async (e) => {
				await plugin.doneEdit();
				const table = plugin.tableEditor.getTable(tableLine);
				if (!table) {
					console.error('cannot locate table when trying sort table ');
					return;
				}
				e.stopPropagation();
				e.preventDefault();
				const newContent = table.cells[0][j].trimRight();
				await plugin.tableEditor.updateCell(table, 0, j, newContent);
			});

		const dividerEl = createDiv({ cls: 'menu-separator' });
		menuDom.prepend(dividerEl);
		menuDom.prepend(containerEl);
	}
}
