import {App, PluginSettingTab, Setting} from "obsidian";
import TableEnhancer from "../main";

export class ObTableEnhancerSettingTab extends PluginSettingTab {
	plugin: TableEnhancer;

	constructor(app: App, plugin: TableEnhancer) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Obsidian Table Enhancer Settings'});

		new Setting(containerEl)
			.setName('Enable floating toolbar')
			.addToggle((component) => {
				component.setValue(this.plugin.settings.enableFloatingToolBar);
				component.onChange(async (val) => {
					this.plugin.settings.enableFloatingToolBar = val;
					await this.plugin.saveSettings();
				});
			})
			// .then((setting) => {
			// 	const item = setting.settingEl.createDiv({ cls: 'setting-item' });
			// 	const info = item.createDiv({ cls: 'setting-item-info' });
			// 	info.createDiv({ text: 'Column Buttons', cls: 'setting-item-name'});
			// 	const control = item.createDiv({ cls: 'setting-item-control' });
			// 	for (const icon of )
			// })

	}
}
