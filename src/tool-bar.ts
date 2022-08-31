import {App, debounce, Notice} from "obsidian";
import {TableEditor} from "./table-editor";
import {Cell} from "./table";
import MyPlugin from "../main";

const insertBelowIcon = `
<svg
	t="1661842034318"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="5688"
	width="16"
	height="16"
>
	<path
		d="M904 768H120c-4.4 0-8 3.6-8 8v80c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-80c0-4.4-3.6-8-8-8zM878.7 160H145.3c-18.4 0-33.3 14.3-33.3 32v464c0 17.7 14.9 32 33.3 32h733.3c18.4 0 33.3-14.3 33.3-32V192c0.1-17.7-14.8-32-33.2-32zM360 616H184V456h176v160z m0-224H184V232h176v160z m240 224H424V456h176v160z m0-224H424V232h176v160z m240 224H664V456h176v160z m0-224H664V232h176v160z" 
		p-id="5689"
		fill="currentColor"
	    stroke="currentColor"
	></path>
</svg>`;

const deleteIcon = `
<svg
	t="1661781161180"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="3242"
	width="16"
	height="16"
>
	<path
		d="M512 471.744l207.424-207.36a28.416 28.416 0 1 1 40.256 40.192L552.256 512l207.36 207.424a28.416 28.416 0 1 1-40.192 40.256L512 552.256l-207.424 207.36a28.416 28.416 0 1 1-40.256-40.192L471.744 512l-207.36-207.424a28.416 28.416 0 0 1 40.192-40.256L512 471.744z"
		p-id="3243"
		fill="currentColor"
	    stroke="currentColor"
	>
	</path>
</svg>`;

const insertRightIcon = `
<svg
	t="1661842059940"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="5924"
	width="16"
	height="16"
>
	<path
		d="M856 112h-80c-4.4 0-8 3.6-8 8v784c0 4.4 3.6 8 8 8h80c4.4 0 8-3.6 8-8V120c0-4.4-3.6-8-8-8zM656 112H192c-17.7 0-32 14.9-32 33.3v733.3c0 18.4 14.3 33.3 32 33.3h464c17.7 0 32-14.9 32-33.3V145.3c0-18.4-14.3-33.3-32-33.3zM392 840H232V664h160v176z m0-240H232V424h160v176z m0-240H232V184h160v176z m224 480H456V664h160v176z m0-240H456V424h160v176z m0-240H456V184h160v176z" 
		p-id="5925"
		fill="currentColor"
	    stroke="currentColor"
	></path>
</svg>`;

const centerAlignedIcon = `
<svg 
	t="1661840940089"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="1722"
	width="16"
	height="16"
>
	<path
	d="M170.666667 224h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM298.666667 394.666667h426.666666a32 32 0 1 1 0 64H298.666667a32 32 0 1 1 0-64zM170.666667 565.333333h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM298.666667 736h426.666666a32 32 0 1 1 0 64H298.666667a32 32 0 1 1 0-64z"
	fill="currentColor"
    stroke="currentColor"
	p-id="1723"
	>
	</path>
</svg>`;

const leftAlignedIcon = `
<svg 
	t="1661841114814"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="4223" width="16" height="16"
>
	<path
		d="M170.666667 224h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM170.666667 394.666667h426.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM170.666667 565.333333h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM170.666667 736h426.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64z"
		fill="currentColor"
    	stroke="currentColor"
		p-id="4224"
	></path>
</svg>
`;

const rightAlignedIcon = `
<svg
	t="1661841218626"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="4438"
	width="16"
	height="16"
>
	<path
		d="M170.666667 224h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM426.666667 394.666667h426.666666a32 32 0 1 1 0 64H426.666667a32 32 0 1 1 0-64zM170.666667 565.333333h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM426.666667 736h426.666666a32 32 0 1 1 0 64H426.666667a32 32 0 1 1 0-64z"
		fill="currentColor"
    	stroke="currentColor"
		p-id="4439"
	></path>
</svg>
`;

export class ToolBar {

	tableEditor: TableEditor;
	rowOpBarEl: HTMLElement;
	colOpBarEl: HTMLElement;
	/** 所有被激活的 toolbar */
	activeOpBars: HTMLElement[];
	/** 隐藏 timeout，若有多个被激活的 toolbar，它们公用同一 timeout */
	hideTimeout: any;
	/** 哪个 cell 触发的 toolbar */
	fromCell: Cell;

	constructor(plugin: MyPlugin) {
		this.tableEditor = plugin.tableEditor;
		this.activeOpBars = [];

		this.rowOpBarEl = createDiv({
			cls: 'ob-table-enhancer-row-bar'
		});
		this.colOpBarEl = createDiv({
			cls: 'ob-table-enhancer-col-bar'
		});
		this.rowOpBarEl.createDiv({
			cls: 'ob-table-enhancer-row-bar-button'
		}, (el) => {
			el.innerHTML = insertBelowIcon;
			el.onclick = async () => {
				// 先 parse
				await this.tableEditor.parseActiveFile();
				await this.tableEditor.insertRowBelow(this.fromCell.tableId, this.fromCell.rowIndex);
			}
		});
		this.colOpBarEl.createDiv({
			cls: 'ob-table-enhancer-col-bar-button'
		}, (el) => {
			el.innerHTML = insertRightIcon;
			el.onclick = async () => {
				// 先 parse
				await this.tableEditor.parseActiveFile();
				await this.tableEditor.insertColRight(this.fromCell.tableId, this.fromCell.colIndex);
			}
		});
		this.rowOpBarEl.createDiv({
			cls: 'ob-table-enhancer-row-bar-button'
		}, (el) => {
			el.innerHTML = deleteIcon;
			el.onclick = async () => {
				if (this.fromCell.rowIndex == 0) {
					new Notice('You can\'t delete header of a table.');
					return;
				}
				// 先 parse
				await this.tableEditor.parseActiveFile();
				await this.tableEditor.deleteRow(this.fromCell.tableId, this.fromCell.rowIndex);
			}
		});
		this.colOpBarEl.createDiv({
			cls: 'ob-table-enhancer-col-bar-button'
		}, (el) => {
			el.innerHTML = deleteIcon;
			el.onclick = async () => {
				// 先 parse
				await this.tableEditor.parseActiveFile();
				await this.tableEditor.deleteCol(this.fromCell.tableId, this.fromCell.colIndex);
			}
		});
		this.colOpBarEl.createDiv({
			cls: 'ob-table-enhancer-col-bar-button'
		}, (el) => {
			el.innerHTML = centerAlignedIcon
			el.onclick = async () => {
				// 先 parse
				await this.tableEditor.parseActiveFile();
				await this.tableEditor.setColAligned(this.fromCell.tableId, this.fromCell.colIndex, 'center');
			}
		});
		this.colOpBarEl.createDiv({
			cls: 'ob-table-enhancer-col-bar-button'
		}, (el) => {
			el.innerHTML = leftAlignedIcon;
			el.onclick = async () => {
				// 先 parse
				await this.tableEditor.parseActiveFile();
				await this.tableEditor.setColAligned(this.fromCell.tableId, this.fromCell.colIndex, 'left');
			}
		});
		this.colOpBarEl.createDiv({
			cls: 'ob-table-enhancer-col-bar-button'
		}, (el) => {
			el.innerHTML = rightAlignedIcon;
			el.onclick = async () => {
				// 先 parse
				await this.tableEditor.parseActiveFile();
				await this.tableEditor.setColAligned(this.fromCell.tableId, this.fromCell.colIndex, 'right');
			}
		});

		// 滚动时不显示
		plugin.registerDomEvent(activeDocument, 'scroll', (e) => {
			this.colOpBarEl.detach();
			this.rowOpBarEl.detach();
			this.activeOpBars = [];
		}, true);
	}

	/**
	 * 尝试为一个 cell 添加 toolbar，当移入一个 cell 时触发
	 * @param cell
	 */
	tryShowFor(cell: Cell) {
		// 清除隐藏计时
		if (this.hideTimeout)
			clearTimeout(this.hideTimeout);
		// 记录触发 cell
		this.fromCell = cell;
		// 先全都 detach
		this.rowOpBarEl.detach();
		this.colOpBarEl.detach();
		this.activeOpBars = [];
		const cellEl = cell.cellEl;
		// cell 为表头 cell，展示列操作 toolbar
		if (cell.rowIndex == 0) {
			this.activeOpBars.push(this.colOpBarEl);
			activeDocument?.body.appendChild(this.colOpBarEl);
			const cellRect = cellEl.getBoundingClientRect();
			const toolBarRect = this.colOpBarEl.getBoundingClientRect();
			this.colOpBarEl.style.top = `${cellRect.top - toolBarRect.height}px`;
			this.colOpBarEl.style.left = `${cellRect.left}px`;
			this.colOpBarEl.style.width = `${cellRect.width}px`; // 宽度保持和 cell 一致
		}
		// cell 为第一列的 cell，展示行操作 toolbar
		if (cell.colIndex == 0) {
			this.activeOpBars.push(this.rowOpBarEl);
			activeDocument?.body.appendChild(this.rowOpBarEl);
			const cellRect = cellEl.getBoundingClientRect();
			const toolBarRect = this.rowOpBarEl.getBoundingClientRect();
			this.rowOpBarEl.style.top = `${cellRect.top}px`;
			this.rowOpBarEl.style.left = `${cellRect.left - toolBarRect.width}px`;
			this.rowOpBarEl.style.height = `${cellRect.height}px`; // 高度保持和 cell 一致
		}
	}

	/**
	 * 如果在 200ms 没有移入 toolbar，则隐藏 toolbar
	 *
	 * 否则当鼠标移出 toolbar 200ms 后隐藏 toolbar
	 */
	tryHide(timeout: number) {
		this.hideTimeout = setTimeout(() => {
			this.colOpBarEl.detach();
			this.rowOpBarEl.detach();
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
}
