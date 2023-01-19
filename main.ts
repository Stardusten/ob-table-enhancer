import {Editor, MarkdownView, Plugin} from 'obsidian';
import {
	editingCellClassName,
	getCaretPosition, getCellText,
	hoveredCellClassName,
	getCellInfo,
	setCaretPosition
} from "./src/global";
import {TableEditor} from "./src/tableEditor";
import {EditorView} from "@codemirror/view";
import {
	getCloneColItem,
	getCloneRowItem, getColAlignItem, getDelColItem,
	getDelRowItem,
	getInsertColRightItem,
	getInsertRowBelowItem, getMoveColLeftItem, getMoveColRightItem, getMoveRowDownItem, getMoveRowUpItem
} from "./src/menuItems";
import {ToolBar} from "./src/toolBar";
import {addButtons} from "./src/buttonPanel";
import {addTableGenerator} from "./src/tableGenerator";
import {DEFAULT_SETTINGS, TableEnhancer2Settings, TableEnhancer2SettingTab} from "./src/settings";
import {getTableHoverPostProcessor} from "./src/tableHoverPostProcessor";
import {getClickHandler} from "./src/clickHandler";
import {getKeydownHandler} from "./src/keydownHandler";

export default class TableEnhancer2 extends Plugin {

	/** 表格编辑器，用于将 dom 上的改动持久化到文件 */
	public tableEditor: TableEditor;

	/** 悬浮工具栏 */
	public toolBar: ToolBar | null;

	/** 设置 */
	public settings: TableEnhancer2Settings;

	async onload() {

		this.tableEditor = new TableEditor(this);

		await this.loadSettings();
		this.addSettingTab(new TableEnhancer2SettingTab(this.app, this));
		if (this.settings.enableFloatingToolbar)
			this.toolBar = new ToolBar(this);

		const tableHoverPostProcessor = getTableHoverPostProcessor(this);
		this.registerMarkdownPostProcessor(tableHoverPostProcessor);

		// 按键逻辑
		this.app.workspace.onLayoutReady(() => {

			// 注册样式
			if (this.settings.adjustTableCellHeight)
				activeDocument.body.addClass('table-height-adjust');

			// 注册到 contentEl 而不是 activeDocument，防止在设置面板等地触发
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!markdownView)
				return;

			// 注册单击事件处理器
			const clickHandler = getClickHandler(this);
			this.registerDomEvent(markdownView.contentEl, 'click', clickHandler);

			// 注册按键事件处理器
			const keydownHandler = getKeydownHandler(this);
			this.registerDomEvent(markdownView.contentEl, 'keydown', keydownHandler);
		});

		this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor) => {
			// 找到是不是在某个 cell 上触发的菜单
			const hoveredCell = activeDocument.querySelector('.' + hoveredCellClassName);
			if (!(hoveredCell instanceof HTMLTableCellElement)) {// 没有 hover 在 cell 上
				// 则可以显示 table generator
				if (this.settings.enableTableGenerator)
					addTableGenerator(menu, this, editor);
				return;
			}
			if (this.settings.enableButtonPanel)
				addButtons(menu, this, hoveredCell);
		}));
	}

	setCellEditing(
		cellEl: HTMLTableCellElement,
		tableLine: number,
		i: number,
		j: number
	) {
		const table = this.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('Cannot get table of cell ', cellEl);
			return;
		}
		const text = getCellText(table, i, j);
		if (text == null)
			return;
		// 加上 class
		cellEl.addClass(editingCellClassName);
		// 聚焦
		cellEl.focus();
		// 使这个 cell 可编辑
		cellEl.contentEditable = 'true';
		// 内容替换
		if (text == '') {
			cellEl.innerText = ' ';
			setCaretPosition(cellEl, 0);
		} else {
			cellEl.innerText = text!;
			setCaretPosition(cellEl, text!.length);
		}
	}

	async doneEdit(cellEl?: HTMLTableCellElement) {
		if (!cellEl) {
			const el = activeDocument.querySelector('.' + editingCellClassName);
			if (el instanceof HTMLTableCellElement)
				cellEl = el;
			else return;
		}

		// 停止编辑
		cellEl.setAttr('contenteditable', false);
		// 删除编辑 class
		cellEl.removeClass(editingCellClassName);

		// 提交更改
		const { tableLine, i, j } = getCellInfo(cellEl, this)!;
		const table = this.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('Cannot get table when trying to done edit');
			return;
		}

		await this.tableEditor.updateCell(table, i, j, cellEl.innerText.trim());
	}

	isInReadingView() {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		return markdownView instanceof MarkdownView && markdownView.getMode() == "preview";
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {}
}
