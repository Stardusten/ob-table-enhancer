import {App, prepareFuzzySearch} from "obsidian";
import {create} from "domain";

export class ReferenceSuggestion {

	app: App;
	suggestContainerEl: HTMLDivElement;
	suggestContentEl: HTMLDivElement;
	private candidates: string[];
	private matchResult: any;
	isTriggered: boolean;
	private selectedIndex: number;

	constructor(app: App, contentEl: HTMLElement) {
		this.app = app;
		this.suggestContainerEl = createDiv({ cls: 'ob-table-enhancer-suggestion suggestion '});
		this.suggestContentEl = this.suggestContainerEl.createDiv({ cls: 'suggestion-content' });
		contentEl.appendChild(this.suggestContainerEl);

		// 默认隐藏
		this.isTriggered = false;
		this.hide();
	}

	/**
	 * 更新所有候选
	 * @private
	 */
	private updateCandidates() {
		const markdownFiles = this.app.vault.getMarkdownFiles();
		this.candidates = markdownFiles.map((f) => f.basename);
	}

	hide() {
		// 设置未触发状态
		this.isTriggered = false;
		this.suggestContentEl.style.display = 'none';
	}

	incSelectIndex() {
		const len = this.suggestContentEl.children.length;
		// 移除原有选中样式
		this.suggestContentEl.children[this.selectedIndex]?.classList.remove('is-selected');
		// 循环
		if (this.selectedIndex >= len - 1)
			this.selectedIndex = 0;
		else this.selectedIndex ++;
		// 添加新的选中样式
		this.suggestContentEl.children[this.selectedIndex].classList.add('is-selected');
	}

	decSelectIndex() {
		const len = this.suggestContentEl.children.length;
		// 移除原有选中样式
		this.suggestContentEl.children[this.selectedIndex]?.classList.remove('is-selected');
		// 循环
		if (this.selectedIndex <= 0)
			this.selectedIndex = len - 1;
		else this.selectedIndex --;
		// 添加新的选中样式
		this.suggestContentEl.children[this.selectedIndex].classList.add('is-selected');
	}

	getSelected() {
		return this.matchResult[this.selectedIndex].text;
	}

	/**
	 * 触发补全
	 */
	trigger(queryPattern: string) {
		// 设置触发状态
		this.isTriggered = true;

		// TODO
		if (!this.candidates)
			this.updateCandidates();

		// 先清空所有候选
		this.suggestContentEl.innerHTML = '';

		const fuzzySearchFunc = prepareFuzzySearch(queryPattern);
		this.matchResult = this.candidates
			.map((candidate: string, i: number) => {
				const searchResult = fuzzySearchFunc.call(null, candidate);
				return searchResult == null
					? null
					: { ...searchResult, i };
			})
			.filter((e) => e != null)
			.sort((e1, e2) => e1.score - e2.score)
			.map((e) => { return { text: this.candidates[e.i], matches: e.matches}; });

		// console.log(this.matchResult);

		// 添加候选到弹出的补全窗口
		for (const candidate of this.matchResult) {
			this.suggestContentEl.createDiv({
				text: candidate.text,
				cls: 'suggestion-item',
			});
		}

		// 默认不选中
		this.selectedIndex = -1;

		this.suggestContentEl.style.display = 'block';
		// console.log(this.suggestContentEl);
	}
}
