import TableEnhancer2 from "../main";
import {MarkdownPostProcessor, MarkdownPostProcessorContext} from "obsidian";
import {hoveredCellClassName} from "./global";

export function getTableHoverPostProcessor(
	plugin: TableEnhancer2
): MarkdownPostProcessor {
	return (el: HTMLElement) => {
		const tables = el.getElementsByTagName('table');
		for (let i = 0; i < tables.length; i ++) {
			const table = tables[i];
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
