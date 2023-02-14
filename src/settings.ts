import {App, PluginSettingTab, Setting} from "obsidian";
import TableEnhancer2 from "../main";

export interface TableEnhancer2Settings {
	enableButtonPanel: boolean,
	enableTableGenerator: boolean,
	enableFloatingToolbar: boolean,
	adjustTableCellHeight: boolean,
	removeEditBlockButton: boolean,
	defaultAlignmentForTableGenerator: 'right' | 'left' | 'center',
	defaultAlignmentWhenInsertNewCol: 'right' | 'left' | 'center' | 'follow',
	enableColumnWidthAdjust: boolean,
}

export const DEFAULT_SETTINGS: TableEnhancer2Settings = {
	enableButtonPanel: true,
	enableTableGenerator: true,
	enableFloatingToolbar: false,
	adjustTableCellHeight: true,
	removeEditBlockButton: false,
	defaultAlignmentForTableGenerator: 'left',
	defaultAlignmentWhenInsertNewCol: 'follow',
	enableColumnWidthAdjust: true,
}
export class TableEnhancer2SettingTab extends PluginSettingTab {

	private plugin: TableEnhancer2;

	constructor(app: App, plugin: TableEnhancer2) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		this.containerEl.empty();
		// 标题
		this.containerEl.createEl('h2', { text: 'Table Enhancer Settings' });
		// 设置项
		new Setting(this.containerEl)
			.setName('Enable button panel')
			.addToggle(c => c
				.setValue(this.plugin.settings.enableButtonPanel)
				.onChange(async (val) => {
					this.plugin.settings.enableButtonPanel = val;
					await this.plugin.saveSettings();
				}));
		new Setting(this.containerEl)
			.setName('Enable table generator')
			.addToggle(c => c
				.setValue(this.plugin.settings.enableTableGenerator)
				.onChange(async (val) => {
					this.plugin.settings.enableTableGenerator = val;
					await this.plugin.saveSettings();
				}));
		new Setting(this.containerEl)
			.setName('Enable floating panel')
			.addToggle(c => c
				.setValue(this.plugin.settings.enableFloatingToolbar)
				.onChange(async (val) => {
					this.plugin.settings.enableFloatingToolbar = val;
					await this.plugin.saveSettings();
				}));
		new Setting(this.containerEl)
			.setName('Adjust height of cells')
			.setDesc('The default height of an empty cell is very short. Activate this to increase the cell height and make it easier to click.')
			.addToggle(c => c
				.setValue(this.plugin.settings.adjustTableCellHeight)
				.onChange(async (val) => {
					if (val)
						activeDocument?.body?.addClass('table-height-adjust');
					else activeDocument?.body?.removeClass('table-height-adjust');
					this.plugin.settings.adjustTableCellHeight = val;
					await this.plugin.saveSettings();
				}));
		new Setting(this.containerEl)
			.setName('Default alignment for new created table')
			.setDesc('Choose if you want to align the text in a cell to the right, left or in the middle.')
			.addDropdown(d => d
				.addOption('left', 'left')
				.addOption('center', 'center')
				.addOption('right', 'right')
				.setValue(this.plugin.settings.defaultAlignmentForTableGenerator)
				.onChange(async (val) => {
					this.plugin.settings.defaultAlignmentForTableGenerator = (val as ('left' | 'center' | 'right'));
					await this.plugin.saveSettings();
				}));
		new Setting(this.containerEl)
			.setName('Default alignment for new inserted column')
			.setDesc('Choose if you want to align the text in a cell to the right, left, in the middle, or follow other columns.')
			.addDropdown(d => d
				.addOption('left', 'left')
				.addOption('center', 'center')
				.addOption('right', 'right')
				.addOption('follow', 'follow')
				.setValue(this.plugin.settings.defaultAlignmentWhenInsertNewCol)
				.onChange(async (val) => {
					this.plugin.settings.defaultAlignmentWhenInsertNewCol = (val as ('left' | 'center' | 'right' | 'follow'));
					await this.plugin.saveSettings();
				}));
	}
}
