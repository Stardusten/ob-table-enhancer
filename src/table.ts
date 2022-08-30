export interface Table {
	/**
	 * 列表起始行，inclusive
	 */
	fromRowIndex: number,
	/**
	 * 列表结束行，exclusive
	 */
	toRowIndex: number,
	/**
	 * 格式控制行
	 */
	formatRow: string[],
	/**
	 * 所有 cell，cells[i][j] 是第 i 行第 j 列的 cell
	 */
	cells: string[][],
}

export interface Cell {
	tableId: string,
	rowIndex: number,
	colIndex: number,
	cellEl: HTMLTableCellElement,
}
