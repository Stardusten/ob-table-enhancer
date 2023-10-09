import {Editor, MarkdownView, Plugin} from 'obsidian';
import {
	editingCellClassName,
	getCaretPosition, getCellText,
	hoveredCellClassName,
	getCellInfo,
	setCaretPosition
} from "./src/global";
import {TableEditor} from "./src/tableEditor";
import {EditorView, placeholder} from "@codemirror/view";
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
import {getClickHandler, getMousedownHandler} from "./src/mousedownHandler";
import {getKeydownHandler} from "./src/keydownHandler";
import {around} from "monkey-around";
import {getCommands} from "./src/commands";

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

			const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
			const editor = markdownView?.editor;
			const editorView = (editor as any)?.cm as EditorView;

			// 注册样式
			if (this.settings.adjustTableCellHeight)
				activeDocument.body.addClass('table-height-adjust');

			// 注册点击事件处理器
			const mousedownHandler = getMousedownHandler(this);
			this.registerDomEvent(window, 'mousedown', mousedownHandler, true);

			const clickHandler = getClickHandler(this);
			this.registerDomEvent(window, 'click', clickHandler, true);

			// 注册按键事件处理器
			const keydownHandler = getKeydownHandler(this);
			this.registerDomEvent(window, 'keydown', keydownHandler, true);

			this.register(
				around((app as any).commands, {
					executeCommand(next) {
						return function (command: any) {
							const commands = getCommands(this) as any;
							const callback = commands[command.id];
							if (callback?.call(this)) {
								return;
							}
							return next.call(this, command);
						}
					}
				})
			)
		});

		// obsidian 1.4+ set table contenteditable=true
		this.registerEvent(this.app.workspace.on("layout-change", ()=> {
			const view: HTMLElement = this.app.workspace.getActiveViewOfType(MarkdownView).contentEl;
    		view.querySelectorAll("div.cm-embed-block.cm-table-widget").forEach(el => {
    	    	// @ts-ignore
        		el.attributes.getNamedItem("contenteditable").value = "true";
    		});
		}));

		this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor) => {
			// 要求不使用原生 menu
			menu.setUseNativeMenu(false);
			// 找到是不是在某个 cell 上触发的菜单
			const hoveredCell = activeDocument.querySelector('.' + hoveredCellClassName);
			if (!(hoveredCell instanceof HTMLTableCellElement)) {// 没有 hover 在 cell 上
				// 则可以显示 table generator
				if (this.settings.enableTableGenerator)
					addTableGenerator(menu, this, editor);
				return;
			}
			// 先获得行列信息，而不是先保存更改，因为保存更改会触发重绘，导致 posAtDom 没法用
			const cellInfo = getCellInfo(hoveredCell, this)!;
			if (this.settings.enableButtonPanel)
				addButtons(menu, this, cellInfo);
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

		await this.tableEditor.updateCell(table, i, j, cellEl.innerText);
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
