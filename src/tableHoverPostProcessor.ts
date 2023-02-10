import TableEnhancer2 from "../main";
import {MarkdownPostProcessor, MarkdownPostProcessorContext, MarkdownView} from "obsidian";
import {hoveredCellClassName} from "./global";
import {EditorView} from "@codemirror/view";

export function getTableHoverPostProcessor(
	plugin: TableEnhancer2
): MarkdownPostProcessor {
	return (el: HTMLElement) => {
		const tables = el.getElementsByTagName('table');
		for (let i = 0; i < tables.length; i ++) {
			const table = tables[i];
			const headers = table.rows[0].cells;
			for (let i = 0; i < headers.length; i ++) {
				const headerCell = headers[i];
				const oldHtml = headerCell.innerHTML;
				const spaceCnt = oldHtml.match(/ +$/)?.[0].length;
				if (spaceCnt) {
					headerCell.innerHTML = oldHtml.slice(0, -spaceCnt); // 剪掉后面的空格
					headerCell.style.width = String(5 + spaceCnt * 2) + '%';
				}
			}
			for (let i = 0; i < table.rows.length; i ++) {
				const row = table.rows[i];
				for (let j = 0; j < row.cells.length; j ++) {
					const cell = row.cells[j];
					// 鼠标 hover 的单元格加上 hoverCellClass
					cell.addEventListener('mouseenter', () => {
						cell.addClass(hoveredCellClassName);
					});
					cell.addEventListener('mouseleave', () => {
						cell.removeClass(hoveredCellClassName);
					});
				}
			}
		}
	};
}
