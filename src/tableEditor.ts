import {App, MarkdownView, Notice, TFile} from "obsidian";
import TableEnhancer from "../main";
import {Table} from "./global";
import {
	deleteLine, deleteLines,
	insertLineBelow,
	insertLineBelowWithText,
	replaceRangeWithoutScroll,
	setLineWithoutScroll, withoutScrollAndFocus
} from "./editorUtils";
import TableEnhancer2 from "../main";
import {EditorView} from "@codemirror/view";
import { TransactionSpec } from "@codemirror/state";

export class TableEditor {

	plugin: TableEnhancer2;

	constructor(plugin: TableEnhancer) {
		this.plugin = plugin;
	}

	getTable(tableLine: number) {
		const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView instanceof MarkdownView && markdownView.editor) {
			const editor = markdownView.editor;
			const lineCount = editor.lineCount();
			const cells = [];
			let match;
			let notStandard = false;
			// parse 表头控制行
			let formatLine = editor.getLine(tableLine + 1);
			const formatRowRegex = /^\s*(\|)?(?:\s*:?\s*?-+\s*:?\s*\|?){2,}/;
			match = formatRowRegex.exec(formatLine);
			if (!match) { // 格式控制行的位置不对
				for (let i = 1; ; i++) {
					const down = tableLine + 1 + i; // 向后找
					const up = tableLine + 1 - i; // 向前找
					if (up >= lineCount && down < 0)
						break;
					if (down >= 0) {
						match = formatRowRegex.exec(editor.getLine(down));
						if (match) {
							tableLine = down - 1; // 找到了
							break;
						}
					}
					if (up < lineCount) {
						match = formatRowRegex.exec(editor.getLine(up));
						if (match) {
							tableLine = down - 1; // 找到了
							break;
						}
					}
				}
				if (!match) return null;
			}
			formatLine = editor.getLine(tableLine + 1); // 找到了
			if (!match[1]) { // 用的是两边没有 | 的表格语法，改成两边有 | 的表格语法后写回文件
				formatLine = `| ${formatLine} |`;
				editor.setLine(tableLine + 1, formatLine);
				notStandard = true;
			}
			const parsedFormatLine = formatLine.split(/(?<!\\)\|/).slice(1, -1);
			// parse 表头
			let headerLine = editor.getLine(tableLine);
			if (notStandard) {
				headerLine = `| ${headerLine} |`;
				editor.setLine(tableLine, headerLine);
			}
			const parsedHeaderLine = headerLine.split(/(?<!\\)\|/).slice(1, -1);
			cells.push(parsedHeaderLine);
			// parse 表格体
			let i = tableLine + 1;
			const notStandardRegex = /^\s*[^|]*\|/;
			while (++i < lineCount) {
				let bodyLine = editor.getLine(i);
				if (notStandard) { // 如果用的是两边没有 | 的表格语法
					if (notStandardRegex.exec(bodyLine)) {
						bodyLine = `| ${bodyLine} |`;
						editor.setLine(i, bodyLine);
						const parsedBodyLine = bodyLine.split(/(?<!\\)\|/).slice(1, -1);
						cells.push(parsedBodyLine);
					} else break;
				} else {
					if (bodyLine.trimStart().startsWith('|')) {
						const parsedBodyLine = bodyLine.split(/(?<!\\)\|/).slice(1, -1);
						cells.push(parsedBodyLine);
					} else break;
				}
			}
			return {
				fromLine: tableLine,
				toLine: i,
				formatLine: parsedFormatLine,
				cells,
			} as Table;
		}
		return null;
	}

	/**
	 * 获得给定 table 第 i 行的行号（在 this.rows 中的索引）
	 */
	private static getLineNumber(table: Table, line: number) {
		return table!.fromLine + (line == 0 ? 0 : line + 1); // 处理格式控制行
	}

	/**
	 * 更新表格中某个 cell 的内容，会对比之前的内容，如果不变，则什么也不做
	 * @param table
	 * @param i 哪一行
	 * @param j 哪一列
	 * @param newContent 新的内容
	 */
	async updateCell(table: Table, i: number, j: number, newContent: string) {
		if (!table) return;
		const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		if (!editor || !editorView) {
			console.error('Cannot get editor');
			return;
		}
		// 没有改变，加一个空格，保证 dom 会更新
		if (newContent == table.cells[i][j])
			newContent += ' ';
		table.cells[i][j] = newContent; // update cell
		const rowLineNumber = TableEditor.getLineNumber(table, i);
		const newLine = TableEditor.rowCells2rowString(table.cells[i]);
		withoutScrollAndFocus(editorView, () => {
			editorView.dispatch(setLineWithoutScroll(editor, rowLineNumber, newLine));
		});
	}

	// /**
	//  * 通过在表头后插入 \u3000 修改列宽
	//  */
	// async changeColWidth(tableLine: number, colIndex: number, delta: 1 | -1) {
	// 	const table = this.getTable(tableLine);
	// 	if (!table) return;
	// 	if (delta == -1)
	// 		table.cells[0][colIndex] = table.cells[0][colIndex].replace(/ $/, '');
	// 	else // delta == 1
	// 		table.cells[0][colIndex] = [table.cells[0][colIndex], ' '].join('');
	// 	const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
	// 	if (markdownView instanceof MarkdownView) {
	// 		// 使用 editor transaction 更新，性能更好
	// 		const editor = markdownView.editor;
	// 		const rowLineNumber = this.getLineNumber(table, 0);
	// 		const newLine = TableEditor.rowCells2rowString(table.cells[0]);
	// 		// 防止没有对文本做修改，导致不触发重新渲染
	// 		if (editor.getLine(rowLineNumber).length == newLine.length)
	// 			setLineWithoutScroll(editor, rowLineNumber, newLine + ' ');
	// 		else setLineWithoutScroll(editor, rowLineNumber, newLine);
	// 		await markdownView.save(); // 写到文件里，防止 parse 的时候读到错误的内容
	// 	}
	// }
	//
	// /**
	//  * 删除表格的指定行
	//  * @param tableLine
	//  * @param rowIndex 要删除哪一行
	//  */
	// async deleteRow(tableLine: number, rowIndex: number) {
	// 	const table = this.getTable(tableLine);
	// 	if (!table) return;
	// 	const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
	// 	// 如果要删除的行是表头
	// 	if (rowIndex == 0) {
	// 		// TODO 应该删除整个表
	// 		return;
	// 	}
	// 	const rowLineNumber = this.getLineNumber(table, rowIndex);
	// 	if (markdownView instanceof MarkdownView) {
	// 		// 使用 editor transaction 更新，性能更好
	// 		const editor = markdownView.editor;
	// 		deleteLine(editor, rowLineNumber);
	// 		await markdownView.save(); // 写到文件里，防止 parse 的时候读到错误的内容
	// 	}
	// }
	//
	// /**
	//  * 删除表格指定列
	//  * @param tableLine
	//  * @param colIndex 要删除哪一列
	//  */
	// async deleteCol(tableLine: number, colIndex: number) {
	// 	const table = this.getTable(tableLine);
	// 	if (!table) return;
	// 	// 表头、格式控制行、表格体都删去一列
	// 	table.formatRow.splice(colIndex, 1);
	// 	for (const row of table.cells)
	// 		row.splice(colIndex, 1);
	// 	// TODO 整合成一个 transaction，不然撤回的时候要好几步
	// 	const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
	// 	if (markdownView instanceof MarkdownView) {
	// 		// 使用 editor transaction 更新，性能更好
	// 		const editor = markdownView.editor;
	// 		// 单列表，直接删掉整个表
	// 		if (table.formatRow.length == 1) {
	// 			deleteLines(editor, table.fromLine, table.toLine);
	// 		} else {
	// 			setLineWithoutScroll(editor, table.fromLine + 1, TableEditor.rowCells2rowString(table.formatRow));
	// 			for (let i = 0; i < table.cells.length; i++) {
	// 				const lineNumber = this.getLineNumber(table, i);
	// 				setLineWithoutScroll(editor, lineNumber, TableEditor.rowCells2rowString(table.cells[i]));
	// 			}
	// 		}
	// 		await markdownView.save(); // 写到文件里，防止 parse 的时候读到错误的内容
	// 	}
	// }
	//
	/**
	 * 在表格某一列右边插入新列
	 * @param table
	 * @param colIndex 在哪一列后插入
	 * @param col
	 */
	async insertColRight(table: Table, colIndex: number, col?: string[]) {
		if (!table) return;
		const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		if (!editor || !editorView) {
			console.error('Cannot get editor');
			return;
		}
		// 添加格式
		const textAlignment = this.plugin.settings.defaultAlignmentWhenInsertNewCol == 'left' 	? ':--'
			: this.plugin.settings.defaultAlignmentWhenInsertNewCol == 'center'					? ':-:'
			: this.plugin.settings.defaultAlignmentWhenInsertNewCol == 'right'					? '--:'
			: this.plugin.settings.defaultAlignmentWhenInsertNewCol == 'follow'   				? table.formatLine[colIndex]
			: null /* IMPOSSIBLE */;
		table.formatLine.splice(colIndex + 1, 0, textAlignment!);
		table.cells.forEach((row, idx) => {
			const newCell = col ? col[idx] : '   ';
			row.splice(colIndex + 1, 0, newCell);
		});
		const transactionSpecs: TransactionSpec[] = [];
		// 修改格式控制行
		transactionSpecs.push(
			setLineWithoutScroll(editor, table.fromLine + 1, TableEditor.rowCells2rowString(table.formatLine)));
		// 修改表格体
		for (let i = 0; i < table.cells.length; i++) {
			const lineNumber = TableEditor.getLineNumber(table, i);
			transactionSpecs.push(
				setLineWithoutScroll(editor, lineNumber, TableEditor.rowCells2rowString(table.cells[i])));
		}
		withoutScrollAndFocus(editorView, () => {
			editorView.dispatch(...transactionSpecs);
		});
	}

	/**
	 * 在指定表格的指定行下方插入新行
	 * @param table
	 * @param rowIndex 在哪一行后插入
	 * @param row
	 */
	async insertRowBelow(table: Table, rowIndex: number, row?: string[]) {
		if (!table) return;
		const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		if (!editor || !editorView) {
			console.error('Cannot get editor');
			return;
		}
		if (!row) {
			row = [];
			let i = table.formatLine.length;
			while (i--) {
				row.push('  ');
			}
		}
		if (rowIndex == 0) {
			const rowLineNumber = table.fromLine + 1;
			withoutScrollAndFocus(editorView, () => {
				editorView.dispatch(insertLineBelow(editor, rowLineNumber));
				editorView.dispatch(setLineWithoutScroll(editor, rowLineNumber + 1, TableEditor.rowCells2rowString(row as string[])));
			});
		} else {
			const rowLineNumber = TableEditor.getLineNumber(table, rowIndex);
			withoutScrollAndFocus(editorView, () => {
				editorView.dispatch(insertLineBelow(editor, rowLineNumber));
				editorView.dispatch(setLineWithoutScroll(editor, rowLineNumber + 1, TableEditor.rowCells2rowString(row as string[])));
			});
		}
	}

	/**
	 * 设置一列为居中 / 居左 / 居右对齐
	 */
	async setColAligned(table: Table, colIndex: number, aligned: 'left' | 'center' | 'right') {
		if (!table) return;
		const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		if (!editor || !editorView) {
			console.error('Cannot get editor');
			return;
		}
		table.formatLine[colIndex] = aligned == 'left' 	? ':--'
			: aligned == 'right' 						? '--:'
			: aligned == 'center' 						?':-:'
			: null /* IMPOSSIBLE */!;
		withoutScrollAndFocus(editorView, () => {
			editorView.dispatch(setLineWithoutScroll(editor, table.fromLine + 1, TableEditor.rowCells2rowString(table.formatLine)));
		});
	}

	/**
	 * 交换两列
	 * @param table
	 * @param colIndex1 第一列下标
	 * @param colIndex2 第二列下标
	 */
	async swapCols(table: Table, colIndex1: number, colIndex2: number) {
		if (!table) return;
		const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		if (!editor || !editorView) {
			console.error('Cannot get editor');
			return;
		}
		const colNum = table.cells[0].length;
		if (colIndex1 < 0 || colIndex2 < 0 || colIndex1 >= colNum || colIndex2 >= colNum) {
			console.error('Move out of range');
			return;
		}
		const transactionSpecs: TransactionSpec[] = [];
		// 先处理格式控制行
		[ table.formatLine[colIndex1], table.formatLine[colIndex2] ]
			= [ table.formatLine[colIndex2], table.formatLine[colIndex1]];
		transactionSpecs.push(
			setLineWithoutScroll(editor, table.fromLine + 1, TableEditor.rowCells2rowString(table.formatLine)));
		for (let i = 0; i < table.cells.length; i++) {
			const lineNumber = TableEditor.getLineNumber(table, i);
			[ table.cells[i][colIndex1], table.cells[i][colIndex2] ]
				= [ table.cells[i][colIndex2], table.cells[i][colIndex1]];
			transactionSpecs.push(
				setLineWithoutScroll(editor, lineNumber, TableEditor.rowCells2rowString(table.cells[i])));
		}
		withoutScrollAndFocus(editorView, () => {
			editorView.dispatch(...transactionSpecs);
		});
	}

	/**
	 * 交换两行
	 * @param table
	 * @param rowIndex1 第一行下标
	 * @param rowIndex2 第二行下标
	 */
	async swapRows(table: Table, rowIndex1: number, rowIndex2: number) {
		if (!table) return;
		const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		if (!editor || !editorView) {
			console.error('Cannot get editor');
			return;
		}
		const rowNum = table.cells.length;
		if (rowIndex1 < 1 || rowIndex2 < 1 || rowIndex1 >= rowNum || rowIndex2 >= rowNum) {
			console.error('Move out of range');
			return;
		}
		const transactionSpecs: TransactionSpec[] = [];
		[ table.cells[rowIndex1], table.cells[rowIndex2] ]
			= [ table.cells[rowIndex2], table.cells[rowIndex1] ];
		const lineNumber1 = TableEditor.getLineNumber(table, rowIndex1);
		const row1String = TableEditor.rowCells2rowString(table.cells[rowIndex1]);
		transactionSpecs.push(
			setLineWithoutScroll(editor, lineNumber1, row1String));
		const lineNumber2 = TableEditor.getLineNumber(table, rowIndex2);
		const row2String = TableEditor.rowCells2rowString(table.cells[rowIndex2]);
		transactionSpecs.push(
			setLineWithoutScroll(editor, lineNumber2, row2String));
		withoutScrollAndFocus(editorView, () => {
			editorView.dispatch(...transactionSpecs);
		});
	}

	// /**
	//  * 删除整个表
	//  * @param tableLine 待删除表的 id
	//  */
	// async deleteEntireTable(tableLine: number) {
	// 	const table = this.getTable(tableLine);
	// 	if (!table) return;
	// 	const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
	// 	if (markdownView instanceof MarkdownView) {
	// 		// 使用 editor transaction 更新，性能更好
	// 		const editor = markdownView.editor;
	// 		replaceRangeWithoutScroll(editor, '',
	// 			{line: table.fromLine, ch: 0},
	// 			{line: table.toLine, ch: 0});
	// 		await markdownView.save(); // 写到文件里，防止 parse 的时候读到错误的内容
	// 	}
	// }

	/**
	 * 删除表格的指定行
	 * @param table
	 * @param rowIndex 要删除哪一行
	 */
	async deleteRow(table: Table, rowIndex: number) {
		if (!table) return;
		const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		if (!editor || !editorView) {
			console.error('Cannot get editor');
			return;
		}
		// 如果要删除的行是表头
		if (rowIndex == 0) {
			// TODO 应该删除整个表
			return;
		}
		const rowLineNumber = TableEditor.getLineNumber(table, rowIndex);
		withoutScrollAndFocus(editorView, () => {
			editorView.dispatch(deleteLine(editor, rowLineNumber));
		});
	}

	/**
	 * 删除表格指定列
	 * @param table
	 * @param colIndex 要删除哪一列
	 */
	async deleteCol(table: Table, colIndex: number) {
		if (!table) return;
		// 表头、格式控制行、表格体都删去一列
		table.formatLine.splice(colIndex, 1);
		for (const row of table.cells)
			row.splice(colIndex, 1);
		const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		if (!editor || !editorView) {
			console.error('Cannot get editor');
			return;
		}
		// 单列表，直接删掉整个表
		if (table.formatLine.length == 1) {
			editorView.dispatch(deleteLines(editor, table.fromLine, table.toLine));
		} else {
			const transactionSpecs: TransactionSpec[] = [];
			transactionSpecs.push(
				setLineWithoutScroll(editor, table.fromLine + 1, TableEditor.rowCells2rowString(table.formatLine)));
			for (let i = 0; i < table.cells.length; i++) {
				const lineNumber = TableEditor.getLineNumber(table, i);
				transactionSpecs.push(
					setLineWithoutScroll(editor, lineNumber, TableEditor.rowCells2rowString(table.cells[i])));
			}
			withoutScrollAndFocus(editorView, () => {
				editorView.dispatch(...transactionSpecs);
			});
		}
	}

	/**
	 * 按某一列排序
	 * @param table
	 * @param colIndex
	 * @param order 升序还是降序 (默认升序)
	 */
	async sortByCol(table: Table, colIndex: number, order?: 'aes' | 'desc') {
		if (!table) return;
		const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		if (!editor || !editorView) {
			console.error('Cannot get editor');
			return;
		}
		// 排序后的表格体
		const sortedBody = table.cells.slice(1).sort((row1, row2) => {
			const cell1 = row1[colIndex].toUpperCase();
			const cell2 = row2[colIndex].toUpperCase();
			// 升序排序
			if (!order || order == 'aes')
				return cell1 < cell2 ? -1 : cell1 > cell2 ? 1 : 0;
			else // 降序排序
				return cell1 < cell2 ? 1 : cell1 > cell2 ? -1 : 0;
		});
		const bodyString = sortedBody.map(TableEditor.rowCells2rowString).join('\n');
		// console.log(bodyString);
		editor.replaceRange(
			bodyString,
			{ line: table.fromLine + 2, ch: 0 },
			{ line: table.toLine, ch: 0 }
		);
	}

	async createEmptyTable(i: number, j: number, fill?: boolean) {
		if (j < 1 || i < 1) {
			console.error('Cannot create an empty table');
			return;
		}
		const markdownView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = markdownView?.editor;
		const editorView = (editor as any)?.cm as EditorView;
		if (!editor || !editorView) {
			console.error('Cannot get editor');
			return;
		}
		const cursor = editor.getCursor();
		const cursorLine = editor.getLine(cursor.line);
		const bodyString = '|' + '  |'.repeat(j);
		const formatString = this.plugin.settings.defaultAlignmentForTableGenerator == 'left' 	? '|' + ':--|'.repeat(j)
			: this.plugin.settings.defaultAlignmentForTableGenerator == 'center'				? '|' + ':-:|'.repeat(j)
			: this.plugin.settings.defaultAlignmentForTableGenerator == 'right'					? '|' + '--:|'.repeat(j)
			: null /* IMPOSSIBLE */;
		const tableArr = [
			cursorLine, '\n',
			bodyString, '\n',
			formatString, '\n'
		];
		while (i--) tableArr.push(bodyString, '\n');
		editor.setLine(cursor.line, tableArr.join(''));
	}

	static rowCells2rowString(cells: string[]) {
		const result = ['|'];
		try {
			for (const cell of cells) {
				// 至少留两个空格，防止产生非法表头
				result.push(cell.length == 0 ? '  ' : cell);
				result.push('|');
			}
		} catch (err) {
			console.error(err);
			console.error(cells);
			throw err;
		}
		return result.join('');
	}
}
