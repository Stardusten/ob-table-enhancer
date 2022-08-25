import {Cell, Table} from "./table";

export function isSameCell(c1: Cell | null | undefined, c2: Cell | null | undefined) {
	if (!c1 || !c2) return false;
	return c1.tableId == c2.tableId &&
		c1.rowIndex == c2.rowIndex &&
		c1.colIndex == c2.colIndex;
}

export function getRowNum(table: Table) {
	return table.cells.length;
}

export function getColNum(table: Table) {
	return table.cells[0].length;
}
