import {Editor, MarkdownView, Plugin} from 'obsidian';
import {editingCellClassName, hoveredCellClassName, parseCellId} from "./src/global";
import {TableEditor} from "./src/tableEditor";
import {EditorView} from "@codemirror/view";
import {getTableEditorExt} from "./src/ext";
import {
	getCloneColItem,
	getCloneRowItem, getColAlignItem, getDelColItem,
	getDelRowItem,
	getInsertColRightItem,
	getInsertRowBelowItem, getMoveColLeftItem, getMoveColRightItem, getMoveRowDownItem, getMoveRowUpItem
} from "./src/menuItems";
import {ToolBar} from "./src/toolBar";

export default class TableEnhancer2 extends Plugin {

	/** 表格编辑器，用于将 dom 上的改动持久化到文件 */
	public tableEditor: TableEditor;

	/** 悬浮工具栏 */
	public toolBar: ToolBar;

	async onload() {
		this.tableEditor = new TableEditor(this);
		this.toolBar = new ToolBar(this);

		const tableEditorExt = getTableEditorExt(this);
		this.registerEditorExtension(tableEditorExt);

		this.app.workspace.onLayoutReady(() => {
			this.registerDomEvent(activeDocument, 'keydown', async (e) => {
				if (e.key == 'Escape') {
					e.preventDefault();
					await this.doneEdit(undefined);
					return;
				}
			});
		});

		this.registerEvent(this.app.workspace.on('editor-menu', (menu, view) => {
			// 找到是不是在某个 cell 上触发的菜单
			const hoveredCell = activeDocument.querySelector('.' + hoveredCellClassName);
			if (!(hoveredCell instanceof HTMLTableCellElement)) // 没有 hover 在 cell 上
				return;
			menu.addItem(getInsertRowBelowItem(this, hoveredCell));
			menu.addItem(getInsertColRightItem(this, hoveredCell));
			menu.addItem(getCloneRowItem(this, hoveredCell));
			menu.addItem(getCloneColItem(this, hoveredCell));
			menu.addItem(getDelRowItem(this, hoveredCell));
			menu.addItem(getDelColItem(this, hoveredCell));
			menu.addItem(getMoveColLeftItem(this, hoveredCell));
			menu.addItem(getMoveColRightItem(this, hoveredCell));
			menu.addItem(getMoveRowUpItem(this, hoveredCell));
			menu.addItem(getMoveRowDownItem(this, hoveredCell));
			menu.addItem(getColAlignItem(this, hoveredCell, 'left'));
			menu.addItem(getColAlignItem(this, hoveredCell, 'right'));
			menu.addItem(getColAlignItem(this, hoveredCell, 'center'));
		}));
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

		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!(markdownView instanceof MarkdownView))
			return;
		const editor = markdownView.editor;
		const editorView = (editor as any).cm as EditorView;
		const scrollDom = editorView.scrollDOM;
		const x = scrollDom.scrollLeft
		const y = scrollDom.scrollTop;
		const resetScroll = () => {
			scrollDom.scrollTo(x, y);
			// 编辑器失焦，防止聚焦到光标处
			editor.blur();
		}

		// ---------------------------------------------------------------- disable scroll here
		scrollDom.addEventListener('scroll', resetScroll, true);
		// 提交更改
		const arr = cellEl.id.split('_');
		const { tableLine, i, j } = parseCellId(cellEl.id);
		const table = this.tableEditor.getTable(tableLine);
		if (!table) {
			console.error('Cannot get table when trying to done edit');
			return;
		}
		await this.tableEditor.updateCell(table, i, j, cellEl.innerText.trim());
		scrollDom.removeEventListener('scroll', resetScroll, true);
		// -------------------------------------------------------------- enable scroll here

		// 编辑器失焦，防止聚焦到光标处
		editor.blur();
	}

	isInReadingView() {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		return markdownView instanceof MarkdownView && markdownView.getMode() == "preview";
	}

	onunload() {}
}
