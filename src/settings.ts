import { App, PluginSettingTab, Setting } from "obsidian";
import TableEnhancer2 from "../main";

export interface TableEnhancer2Settings {
	enableButtonPanel: boolean,
	enableTableGenerator: boolean,
	enableFloatingToolbar: boolean,
	adjustTableCellHeight: boolean,
	removeEditBlockButton: boolean
}

export const DEFAULT_SETTINGS: TableEnhancer2Settings = {
	enableButtonPanel: true,
	enableTableGenerator: true,
	enableFloatingToolbar: false,
	adjustTableCellHeight: true,
	removeEditBlockButton: false
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
			.setName('Enable Button Panel')
			.addToggle(c => c
				.setValue(this.plugin.settings.enableButtonPanel)
				.onChange(async (val) => {
					this.plugin.settings.enableButtonPanel = val;
					await this.plugin.saveSettings();
				}));
		new Setting(this.containerEl)
			.setName('Enable Table Generator')
			.addToggle(c => c
				.setValue(this.plugin.settings.enableTableGenerator)
				.onChange(async (val) => {
					this.plugin.settings.enableTableGenerator = val;
					await this.plugin.saveSettings();
				}));
		new Setting(this.containerEl)
			.setName('Enable Floating Panel')
			.addToggle(c => c
				.setValue(this.plugin.settings.enableFloatingToolbar)
				.onChange(async (val) => {
					this.plugin.settings.enableFloatingToolbar = val;
					await this.plugin.saveSettings();
				}));
		new Setting(this.containerEl)
			.setName('Remove the edit this block button next to a table')
			.addToggle(c =>c
				.setValue(this.plugin.settings.removeEditBlockButton)
				.onChange(async (val) => {
					if (val == true) {
						activeDocument?.body?.addClass("remove-edit-button")
					} else {
						activeDocument?.body?.removeClass("remove-edit-button")
					}
					this.plugin.settings.removeEditBlockButton = val;
					this.display()
					await this.plugin.saveSettings();
				}))
		new Setting(this.containerEl)
			.setName('Adjust Height of Table Cells')
			.setDesc('The default height of an empty cell is very short. Activate this to increase the cell height and make it easier to click.')
			.addToggle(c => c
				.setValue(this.plugin.settings.adjustTableCellHeight)
				.onChange(async (val) => {
					if (val == true) {
						activeDocument?.body?.addClass('table-height-adjust');

					} else {
						activeDocument?.body?.removeClass('table-height-adjust');
					}
					this.plugin.settings.adjustTableCellHeight = val;
					this.display()
					await this.plugin.saveSettings();
				}));
	}
}
