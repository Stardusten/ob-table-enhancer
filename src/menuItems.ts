import {MenuItem, Notice} from "obsidian";
import TableEnhancer2 from "../main";
import {getCellInfo} from "./global";
import {TableEditor} from "./tableEditor";

export const getInsertRowBelowItem = (plugin: TableEnhancer2, cellEl: HTMLTableCellElement) =>
(item: MenuItem) => {
	item.setTitle('Insert Row Below');
	item.onClick(async (e) => {
		const { tableLine, i, j } = getCellInfo(cellEl, plugin)!;
		const table = plugin.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('cannot locate table when trying to insert row below ', cellEl);
			return;
		}
		await plugin.tableEditor.insertRowBelow(table, i);
	});
}

export const getInsertColRightItem = (plugin: TableEnhancer2, cellEl: HTMLTableCellElement) =>
(item: MenuItem) => {
	item.setTitle('Insert Column Right');
	item.onClick(async (e) => {
		const { tableLine, i, j } = getCellInfo(cellEl, plugin)!;
		const table = plugin.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('cannot locate table when trying to insert column below ', cellEl);
			return;
		}
		await plugin.tableEditor.insertColRight(table, i);
	});
}

export const getCloneRowItem = (plugin: TableEnhancer2, cellEl: HTMLTableCellElement) =>
(item: MenuItem) => {
	item.setTitle('Clone Row');
	item.onClick(async (e) => {
		const { tableLine, i, j } = getCellInfo(cellEl, plugin)!;
		const table = plugin.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('cannot locate table when trying to copy row below ', cellEl);
			return;
		}
		await plugin.tableEditor.insertRowBelow(table, i, table.cells[i]);
	});
}

export const getCloneColItem = (plugin: TableEnhancer2, cellEl: HTMLTableCellElement) =>
(item: MenuItem) => {
	item.setTitle('Clone Column');
	item.onClick(async (e) => {
		const { tableLine, i, j } = getCellInfo(cellEl, plugin)!;
		const table = plugin.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('cannot locate table when trying to copy row below ', cellEl);
			return;
		}
		const col = table.cells.map(row => row[j]);
		await plugin.tableEditor.insertColRight(table, j, col);
	});
}

export const getDelRowItem = (plugin: TableEnhancer2, cellEl: HTMLTableCellElement) =>
(item: MenuItem) => {
	item.setTitle('Delete Row');
	item.onClick(async (e) => {
		const { tableLine, i, j } = getCellInfo(cellEl, plugin)!;
		const table = plugin.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('cannot locate table when trying to copy row below ', cellEl);
			return;
		}
		await plugin.tableEditor.deleteRow(table, i);
	});
}

export const getDelColItem = (plugin: TableEnhancer2, cellEl: HTMLTableCellElement) =>
(item: MenuItem) => {
	item.setTitle('Delete Column');
	item.onClick(async (e) => {
		const { tableLine, i, j } = getCellInfo(cellEl, plugin)!;
		const table = plugin.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('cannot locate table when trying to copy row below ', cellEl);
			return;
		}
		await plugin.tableEditor.deleteCol(table, j);
	});
}

export const getMoveColRightItem = (plugin: TableEnhancer2, cellEl: HTMLTableCellElement) =>
(item: MenuItem) => {
	item.setTitle('Move Column Right');
	item.onClick(async (e) => {
		const { tableLine, i, j } = getCellInfo(cellEl, plugin)!;
		const table = plugin.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('cannot locate table when trying to copy row below ', cellEl);
			return;
		}
		const colNum = table.formatLine.length;
		if (j == colNum - 1) {
			new Notice('Current column is already the rightmost column.');
			return;
		}
		await plugin.tableEditor.swapCols(table, j, j + 1);
	});
}

export const getMoveColLeftItem = (plugin: TableEnhancer2, cellEl: HTMLTableCellElement) =>
(item: MenuItem) => {
	item.setTitle('Move Column Left');
	item.onClick(async (e) => {
		const { tableLine, i, j } = getCellInfo(cellEl, plugin)!;
		const table = plugin.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('cannot locate table when trying to copy row below ', cellEl);
			return;
		}
		if (j == 0) {
			new Notice('Current column is already the leftmost column.');
			return;
		}
		await plugin.tableEditor.swapCols(table, j, j - 1);
	});
}

export const getMoveRowDownItem = (plugin: TableEnhancer2, cellEl: HTMLTableCellElement) =>
(item: MenuItem) => {
	item.setTitle('Move Row Downward');
	item.onClick(async (e) => {
		const { tableLine, i, j } = getCellInfo(cellEl, plugin)!;
		const table = plugin.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('cannot locate table when trying to copy row below ', cellEl);
			return;
		}
		const rowNum = table.cells.length;
		if (i == rowNum - 1) {
			new Notice('Current column is already the bottom row.');
			return;
		}
		await plugin.tableEditor.swapRows(table, i, i + 1);
	});
}

export const getMoveRowUpItem = (plugin: TableEnhancer2, cellEl: HTMLTableCellElement) =>
(item: MenuItem) => {
	item.setTitle('Move Row Upward');
	item.onClick(async (e) => {
		const { tableLine, i, j } = getCellInfo(cellEl, plugin)!;
		const table = plugin.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('cannot locate table when trying to copy row below ', cellEl);
			return;
		}
		if (i == 1) {
			new Notice('Current column is already the top row.');
			return;
		}
		await plugin.tableEditor.swapRows(table, i, i - 1);
	});
}

export const getColAlignItem = (plugin: TableEnhancer2, cellEl: HTMLTableCellElement, aligned: 'left' | 'center' | 'right') =>
	(item: MenuItem) => {
		item.setTitle('Set Column ' + aligned.toUpperCase() + ' Aligned');
		item.onClick(async (e) => {
			const { tableLine, i, j } = getCellInfo(cellEl, plugin)!;
			const table = plugin.tableEditor.getTable(tableLine);
			if (!table) {
				console.error('cannot locate table when trying to copy row below ', cellEl);
				return;
			}
			await plugin.tableEditor.setColAligned(table, j, aligned);
		});
	}
