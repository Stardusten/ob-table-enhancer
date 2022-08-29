import {Table} from "./table";
import {App, MarkdownView, Notice, TFile} from "obsidian";
import {deleteLine, deleteLines, hashCode, insertLineBelow, insertLineBelowWithText} from "./editor-utils";

export class TableEditor {

	app: App;
	activeFile: TFile | null;
	tables: Map<string, Table>;
	rows: string[];

	constructor(app: App) {
		this.app = app;
	}

	async parseActiveFile() {
		this.activeFile = this.app.workspace.getActiveFile();
		if (!this.activeFile)
			return;
		// parse 出所有表格，存到 this.tables 里
		// 每个表格是一个二维数组，table[i][j] 就是第 i 行第 j 列 cell 中的内容
		this.tables = new Map<string, Table>();
		const fullText = await this.app.vault.read(this.activeFile);
		this.rows = fullText.split(/\r?\n/);
		// 匹配格式控制行 XXX 性能考虑，所使用的正则十分简单
		const formatRowRegex = /^\s*(\|?)(?:[:\-\s|\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]+)+$/;
		const len = this.rows.length;
		let existNonStandardTable = false;
		let i = 0;
		// 跳过 yaml
		if (this.rows[0].startsWith('---')) {
			while (++i < len) {
				if (this.rows[0].startsWith('---'))
					break;
			}
		}
		while (++i < len) {
			const row = this.rows[i];
			// 不考虑分隔符
			if (row.startsWith('---'))
				continue;
			// 跳过代码块
			if (row.startsWith('```')) {
				while (++i < len) {
					if (this.rows[0].startsWith('```'))
						break;
				}
			}
			// 找到一个表格
			const matchResult = row.match(formatRowRegex);
			if (matchResult) {
				// 格式控制行上一行是表头行
				if (i - 1 < 0) continue; // 没有表头？
				// 如果表格不是标准格式，则先标准化
				if (!matchResult[1]) {
					existNonStandardTable = true;
					await this.standardize(i);
					i = i - 1; // 重新 parse 此行
					continue;
				}
				const table = {
					fromRowIndex: i - 1,
					toRowIndex: i,
					formatRow: this.rows[i].split('|').slice(1, -1),
					cells: [] as string[][],
				};
				const rowAbove = this.rows[i - 1];
				table.cells.push(rowAbove.split('|').slice(1, -1));
				// 下面所有以 | 开头的连续的行构成表格主体
				while (++i < len) {
					const bodyRow = this.rows[i];
					if (bodyRow.trimStart().startsWith('|'))
						table.cells.push(bodyRow.split('|').slice(1, -1));
					else break;
				}
				table.toRowIndex = i;
				this.tables.set(TableEditor.getIdentifier(table), table);
			}
		}
		// 如果存在不标准的表格，则将标准化后的写回文件
		if (existNonStandardTable) {
			const fullTextAfterStandardize = this.rows.join('\n');
			await this.app.vault.modify(this.activeFile, fullTextAfterStandardize);
		}
		// console.log(this.tables);
	}

	/**
	 * 将不符合 parse 标准的语法的表格标准化 (这里指行开头和结尾没有 |)
	 * @param formatRowIndex 第几行是格式控制行
	 * @param rows 所有行
	 */
	async standardize(formatRowIndex: number) {
		this.rows[formatRowIndex - 1] = ['|', this.rows[formatRowIndex - 1], '|'].join('');
		this.rows[formatRowIndex] = ['|', this.rows[formatRowIndex], '|'].join('');
		let i = formatRowIndex;
		const len = this.rows.length;
		while (++i < len) {
			const bodyRow = this.rows[i];
			if (bodyRow.match(/^\s*[^|]*\|/)) {
				this.rows[i] = ['|', this.rows[i], '|'].join('');
			} else break;
		}
	}

	// private async writeBackActiveFile() {
	// 	if (!this.activeFile || this.tables.size == 0) { // 没有表格
	// 		return;
	// 	}
	// 	let fullTextRows = [] as string[];
	// 	let i = 0;
	// 	for (const [tableId, table] of this.tables.entries()) {
	// 		for (let j = i; j < table.fromRowIndex; j++)
	// 			fullTextRows.push(this.rows[j]);
	// 		// 跳过整个空表
	// 		if (table.formatRow.length == 1) {
	// 			i = table.toRowIndex;
	// 			continue;
	// 		}
	// 		// 添加表头行
	// 		fullTextRows.push(TableEditor.rowCells2rowString(table.cells[0]));
	// 		// 添加格式控制行
	// 		fullTextRows.push(TableEditor.rowCells2rowString(table.formatRow));
	// 		// 添加表格主体行
	// 		for (let j = 1; j < table.cells.length; j++) {
	// 			const row = table.cells[j];
	// 			// 跳过单列表
	// 			if (row.length < 1)
	// 				continue;
	// 			fullTextRows.push(TableEditor.rowCells2rowString(row));
	// 		}
	// 		i = table.toRowIndex;
	// 	}
	// 	// 如果不是以表格结尾，还要加上表格后面的文本
	// 	for (let j = i; j < this.rows.length; j ++)
	// 		fullTextRows.push(this.rows[j]);
	// 	const fullText = fullTextRows.join('\n');
	// 	// console.log(fullText);
	// 	await this.app.vault.modify(this.activeFile, fullText);
	// }

	/**
	 * 返回指定表格指定位置的内容
	 * @param tableId 表格的 Id
	 * @param rowIndex 哪一行
	 * @param colIndex 哪一列
	 * @return 出现任何错误将返回空串 ''
	 */
	getCell(tableId: string, rowIndex: number, colIndex: number) {
		try {
			return this.tables.get(tableId)!.cells[rowIndex][colIndex].trim();
		} catch (e) { return ''; }
	}

	/**
	 * 获得给定 table 第 i 行的行号（在 this.rows 中的索引）
	 * @param tableId must valid
	 * @param rowIndex
	 * @private
	 */
	private getLineNumber(table: Table, rowIndex: number) {
		return table!.fromRowIndex + (rowIndex == 0 ? rowIndex : rowIndex + 1); // 处理格式控制行
	}

	/**
	 * 更新表格中某个 cell 的内容
	 * @param tableId
	 * @param rowIndex 哪一行
	 * @param colIndex 哪一列
	 * @param newContent 新的内容
	 */
	async update(tableId: string, rowIndex: number, colIndex: number, newContent: string) {
		const table = this.tables.get(tableId);
		if (!table) return;
		table.cells[rowIndex][colIndex] = newContent; // update cell
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView instanceof MarkdownView) {
			// 使用 editor transaction 更新，性能更好
			const editor = markdownView.editor;
			const rowLineNumber = this.getLineNumber(table, rowIndex);
			const newLine = TableEditor.rowCells2rowString(table.cells[rowIndex]);
			// 防止没有对文本做修改，导致不触发重新渲染
			if (editor.getLine(rowLineNumber).length == newLine.length)
				editor.setLine(rowLineNumber, newLine + ' ');
			editor.setLine(rowLineNumber, newLine);
			await markdownView.save(); // 写到文件里，防止 parse 的时候读到错误的内容
		}
	}

	/**
	 * 删除表格的指定行
	 * @param tableId
	 * @param rowIndex 要删除哪一行
	 */
	async deleteRow(tableId: string, rowIndex: number) {
		const table = this.tables.get(tableId);
		if (!table) return;
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 如果要删除的行是表头
		if (rowIndex == 0) {
			// TODO 应该删除整个表
			return;
		}
		const rowLineNumber = this.getLineNumber(table, rowIndex);
		if (markdownView instanceof MarkdownView) {
			// 使用 editor transaction 更新，性能更好
			const editor = markdownView.editor;
			deleteLine(editor, rowLineNumber);
			await markdownView.save(); // 写到文件里，防止 parse 的时候读到错误的内容
		}
	}

	/**
	 * 删除表格指定列
	 * @param tableId
	 * @param colIndex 要删除哪一列
	 */
	async deleteCol(tableId: string, colIndex: number) {
		const table = this.tables.get(tableId);
		if (!table) return;
		// 表头、格式控制行、表格体都删去一列
		table.formatRow.splice(colIndex, 1);
		for (const row of table.cells)
			row.splice(colIndex, 1);
		// TODO 整合成一个 transaction，不然撤回的时候要好几步
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView instanceof MarkdownView) {
			// 使用 editor transaction 更新，性能更好
			const editor = markdownView.editor;
			// 单列表，直接删掉整个表
			if (table.formatRow.length == 1) {
				deleteLines(editor, table.fromRowIndex, table.toRowIndex);
			} else {
				editor.setLine(table.fromRowIndex + 1, TableEditor.rowCells2rowString(table.formatRow));
				for (let i = 0; i < table.cells.length; i++) {
					const lineNumber = this.getLineNumber(table, i);
					editor.setLine(lineNumber, TableEditor.rowCells2rowString(table.cells[i]));
				}
			}
			await markdownView.save(); // 写到文件里，防止 parse 的时候读到错误的内容
		}
	}

	/**
	 * 在表格某一列右边插入新列
	 * @param tableId
	 * @param colIndex 在哪一列后插入
	 */
	async insertColRight(tableId: string, colIndex: number) {
		const table = this.tables.get(tableId);
		if (!table) return;
		// 添加格式，默认为居左对齐
		table.formatRow.splice(colIndex + 1, 0, '---');
		for (const row of table.cells)
			row.splice(colIndex + 1, 0, '   ');
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView instanceof MarkdownView) {
			// 使用 editor transaction 更新，性能更好
			const editor = markdownView.editor;
			editor.setLine(table.fromRowIndex + 1, TableEditor.rowCells2rowString(table.formatRow));
			for (let i = 0; i < table.cells.length; i++) {
				const lineNumber = this.getLineNumber(table, i);
				editor.setLine(lineNumber, TableEditor.rowCells2rowString(table.cells[i]));
			}
			await markdownView.save(); // 写到文件里，防止 parse 的时候读到错误的内容
		}
	}

	/**
	 * 在表格的某一行后插入新行
	 * @param tableId
	 * @param rowIndex 在哪一行后插入
	 */
	async insertRowBelow(tableId: string, rowIndex: number) {
		const table = this.tables.get(tableId);
		if (!table) return;
		if (rowIndex == 0) {
			// TODO 不能在表头下方插入新行
			return;
		}
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView instanceof MarkdownView) {
			// 使用 editor transaction 更新，性能更好
			const editor = markdownView.editor;
			const row = [] as string[];
			let i = table.formatRow.length;
			while (i--) {
				row.push('  ');
			}
			const rowText = TableEditor.rowCells2rowString(row);
			const rowLineNumber = this.getLineNumber(table, rowIndex);
			insertLineBelow(editor, rowLineNumber);
			editor.setLine(rowLineNumber + 1, rowText);
			await markdownView.save(); // 写到文件里，防止 parse 的时候读到错误的内容
		}
	}

	/**
	 * 创建一个一行两列（还有一行表头）的新表
	 */
	async createMinimalNewTable() {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView instanceof MarkdownView) {
			const editor = markdownView.editor;
			const rowIndex = editor.getCursor().line;
			if (this.tables)
				for (const table of this.tables.values()) {
					if (table.fromRowIndex <= rowIndex && rowIndex <= table.toRowIndex) {
						new Notice('Can\'t create table within another table.');
						return;
					}
				}
			const text = '| Col 1 | Col 2 |\n|---|---|\n| xxxx | xxxx |\n';
			insertLineBelowWithText(editor, rowIndex, text);
			await markdownView.save(); // 写到文件里，防止 parse 的时候读到错误的内容
		}
	}

	private static getIdentifier(table: Table) {
		const result = [];
		const rowNum = table.cells.length;
		for (let i = 0; i < rowNum; i ++) {
			const str = table.cells[i][0];
			// console.log('' + str);
			// 不考虑空 cell 和含 md 标记的 cell
			if (str && str.trim() != '' && !str.match(/[!<>*#\[\]`$=]/))
				result.push(str.trim());
		}
		let i = table.cells[0].length;
		while (i --) {
			const str = table.cells[0][i];
			// console.log('' + str);
			// 不考虑空 cell 和含 md 标记的 cell
			if (str && str.trim() != '' && !str.match(/[!<>*#\[\]`$=]/))
				result.push(str.trim());
		}
		const resultStr = result.join('');
		// console.log(resultStr);
		return String.fromCharCode(hashCode(resultStr));
	}

	private static rowCells2rowString(cells: string[]) {
		const result = ['|'];
		for (const cell of cells) {
			result.push(cell);
			result.push('|');
		}
		return result.join('');
	}
}
