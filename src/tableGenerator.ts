import {Editor, Menu, MarkdownView} from "obsidian";
import TableEnhancer2 from "../main";

const calcCursorCoord = (editor: Editor) => {
	const cursor = editor.getCursor('from');
	const editor2 = editor as any;
	let coord: any;
	if (editor2.coordsAtPos) {
		const offset = editor.posToOffset(cursor);
		coord = editor2.cm.coordsAtPos?.(offset) ?? editor2.coordsAtPos(offset);
	} else {
		console.error('Cannot get cursor coordinate');
		return null;
	}

	return coord;
};

const openTableGenerator = (plugin: TableEnhancer2, etr?: Editor) => {
	const editor =
		etr ?? plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
	if (!editor || editor === null) {
		console.error('Cannot get active editor');
		return;
	}

	// 在光标位置打开 tableGenerator
	const coord = calcCursorCoord(editor);
	const tableGenerator = new TableGenerator(plugin);
	tableGenerator.showAtPosition({ x: coord.left, y: coord.bottom });
};

export const addTableGeneratorMenuItem = (
	menu: Menu,
	plugin: TableEnhancer2,
	editor: Editor
) => {
	menu.addItem(menuItem => {
		menuItem.setTitle('Create new table');
		menuItem.setIcon('table');
		menuItem.onClick(async e => {
      openTableGenerator(plugin, editor);
		});
	});
}

export const addTableGeneratorCommand = (plugin: TableEnhancer2) => {
	plugin.addCommand({
		id: 'create-table-with-table-generator',
		name: 'Create table with table generator',
		checkCallback: (checking) => {
			// checking if the command should appear in the Command Palette
			if (checking) {
				// make sure the active view is a MarkdownView.
				return !!plugin.app.workspace.getActiveViewOfType(MarkdownView);
			}

			openTableGenerator(plugin);
		},
	});
};

class TableGenerator extends Menu {

	private plugin: TableEnhancer2;

	constructor(plugin: TableEnhancer2) {
		super();
		this.plugin = plugin;
		this.addItem(item => item.setDisabled(true)); // 添加一个空 item，防止不显示
	}

	onload() {
		super.onload();
		const menuDom = (this as any).dom as HTMLElement;
		const frag = activeDocument.createDocumentFragment();
		const containerEl = frag.createDiv({ cls: 'table-generator-container' });
		// 行列计数器加上 menu-item，使样式和 menu 更搭
		const counter = frag.createDiv({ cls: ['table-generator-counter', 'menu-item'] });
		// TODO 行列数如何确定 j 列对应的格子 el
		for (let i = 0; i < 7; i ++) {
			for (let j = 0; j < 7; j ++) {
				const gridEl = createDiv({ cls: 'table-generator-grid' });
				gridEl.setAttr('i', i);
				gridEl.setAttr('j', j);
				// 点击格子时，创建对应大小的表格
				gridEl.addEventListener('click', async () => {
					// i + 1 行，j + 1 列
					await this.plugin.tableEditor.createEmptyTable(i + 1, j + 1);
				});
				// 鼠标进入格子时，更新格子高亮
				gridEl.addEventListener('mouseenter', async () => {
					containerEl.querySelectorAll('.table-generator-grid').forEach(gridEl => {
						const i2 = parseInt(gridEl.getAttr('i')!);
						const j2 = parseInt(gridEl.getAttr('j')!);
						if (i2 > i || j2 > j) gridEl.removeClass('select');
						else gridEl.addClass('select');
					});
					counter.innerText = `${i + 1} rows ${j + 1} columns`;
				})
				containerEl.append(gridEl);
			}
		}
		menuDom.append(frag);
	}
}
