import {App, PluginSettingTab, Setting} from "obsidian";
import MyPlugin from "../main";

export class ObTableEnhancerSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
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
			});

		new Setting(containerEl)
			.setName('Enable in reading mode')
			.addToggle((component) => {
				component.setValue(this.plugin.settings.enableInReadingMode);
				component.onChange(async (val) => {
					this.plugin.settings.enableInReadingMode = val;
					await this.plugin.saveSettings();
				});
			});
	}
}
