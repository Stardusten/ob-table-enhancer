import {App, MarkdownView, prepareFuzzySearch, SearchMatches, SearchResult, TFile} from "obsidian";
import {getCaretPosition, getCaretRect, setCaretPosition} from "./html-utils";
import MyPlugin from "../main";

export interface FuzzySuggestion {
	/** 补全窗口里显示的内容 */
	display: string,
	/** 插入的内容 */
	replaceString: string;
	/** 匹配的部分，一个数组，每个元素是一个长为 2 的数组
	 * 表示匹配 displayString 中的一段子串 */
	matched: SearchMatches;
	/** 匹配得分 */
	score: number,
}

export abstract class SuggestionPopper<T> {

	protected app: App;
	protected plugin: MyPlugin;
	/** 为哪个元素提供补全 */
	protected outerEl: HTMLElement;
	// <suggestion-container>
	//   <suggestion>
	protected containerEl: HTMLElement;
	protected suggestionEl: HTMLElement;
	/** 所有候选 */
	protected candidates: T[];
	/** 所有补全建议 */
	protected fuzzySuggestions: FuzzySuggestion[];
	/** 当前选中的候选下标 */
	protected selectedIndex: number;
	/** 补全是否触发 */
	isTriggered: boolean;

	constructor(plugin: MyPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;
		// 补全窗口直接插入到 <body</body>
		this.containerEl = createDiv({ cls: 'ob-table-enhancer suggestion-container' });
		this.suggestionEl = this.containerEl.createDiv({ cls: 'ob-table-enhancer suggestion' });
	}

	/** 如何从一个候选获得用于匹配的的 string */
	abstract getQueryString(item: T): string;
	/** 如何从一个候选获得补全窗口里显示的 html string */
	abstract getDisplay(item: T, queryString: string, searchResult: SearchResult): string;
	/** 如何从一个候选获得用于替换的 string */
	abstract getReplaceString(item: T): string;
	/** 指定何时更新候选（除了候选为空时会自动调用一次） */
	abstract updateCandidates(): void | Promise<void>;
	/** 指定如何更新候选 */
	abstract onUpdateCandidates(): void | Promise<void>;
	/** 指定何时触发补全 */
	abstract trigger(): void;

	/**
	 * 关闭补全
	 */
	disable() {
		if (this.isTriggered) {
			this.isTriggered = false;
			this.containerEl.detach();
		}
	}

	/**
	 * 绑定要补全的 element
	 * @param outerEl
	 */
	bindOuterEl(outerEl: HTMLElement) {
		this.outerEl = outerEl;
		this.trigger();

		this.plugin.registerDomEvent(this.outerEl, 'keydown', (e) => {
			// 如果补全插件处于触发状态，优先响应补全动作
			if (this.isTriggered) {
				// 按上键选择上一个候选（没有选择候选，或者当前选择第一个候选，则选最最后一个候选）
				if (e.key == 'ArrowUp') {
					e.preventDefault();
					e.stopPropagation();
					this.selectPrev();
					return;
				}
				// 按下键选择下一个候选（没有选择候选，或者当前选择最后一个候选，则选择第一个候选）
				if (e.key == 'ArrowDown') {
					e.preventDefault();
					e.stopPropagation();
					this.selectNext();
					return;
				}
				// 按下 enter 上屏
				if (e.key == 'Enter') {
					e.preventDefault();
					e.stopPropagation();
					this.applySuggestion();
					return;
				}
			}
		});
	}

	/**
	 * 触发补全
	 */
	protected onTrigger = (queryPattern: string) => {

		// 若没有候选，则调用一次更新候选
		if (!this.candidates)
			this.onUpdateCandidates();

		// 设置触发状态
		this.isTriggered = true;

		// 显示补全窗口
		activeDocument.body.appendChild(this.containerEl);

		// 清空所有候选
		this.suggestionEl.innerHTML = '';

		// 计算所有候选与传入模式的匹配程度，得到所有补全建议
		const fuzzySearchFunc = prepareFuzzySearch(queryPattern);
		this.fuzzySuggestions = this.candidates
			.map((c, i): FuzzySuggestion | null => {
				const queryString = this.getQueryString(c);
				const searchResult = fuzzySearchFunc.call(null, queryString);
				return searchResult ?
					{
						display: this.getDisplay(c, queryString, searchResult),
						replaceString: this.getReplaceString(c),
						matched: searchResult.matched,
						score: searchResult.score
					} : null;
			})
			.filter((o): o is FuzzySuggestion => o != null)
			.sort((e1, e2) => e2.score - e1.score);

		// 计算补全窗口弹出位置
		// 由于补全窗口被插入到 body 里面，因此直接使用绝对位置
		// 先计算光标位置
		const caretRect = getCaretRect(this.containerEl)!;
		// 再获得输入框的高度
		const outerRect = this.outerEl.getBoundingClientRect();
		this.containerEl.style.left = `${caretRect.left}px`;
		this.containerEl.style.top = `${caretRect.top + outerRect.height}px`;
		this.containerEl.style.display = 'block'; // TODO detach() better?

		// 添加所有补全建议到补全窗口
		this.fuzzySuggestions.map((suggestion, i) => {
			this.suggestionEl.createDiv({ cls: 'suggestion-item mod-complex'} ,(div) => {
				div.innerHTML = suggestion.display;
				// hover 哪个选项，认为选择哪个
				div.onmouseover = (e) => this.select(i);
				// 点击哪个选项，应用哪个
				div.onclick = (e) => this.applySuggestion();
			});
		});

		// 默认不选中
		this.selectedIndex = -1;
	}

	/**
	 * 选中下一个补全建议
	 */
	protected selectNext = () => {
		const len = this.suggestionEl.children.length;
		// 移除之前选中项的样式
		this.suggestionEl.children[this.selectedIndex]?.classList.remove('is-selected');
		// 循环
		if (this.selectedIndex >= len - 1)
			this.selectedIndex = 0;
		else this.selectedIndex ++;
		// 添加新的选中样式
		// 添加新的选中样式
		const selectedElem = this.suggestionEl.children[this.selectedIndex];
		selectedElem.classList.add('is-selected');
		// 选中元素保持在可见范围
		selectedElem.scrollIntoView(false);
	}

	/**
	 * 选中上一个补全建议
	 */
	protected selectPrev = () => {
		const len = this.suggestionEl.children.length;
		// 移除原有选中样式
		this.suggestionEl.children[this.selectedIndex]?.classList.remove('is-selected');
		// 循环
		if (this.selectedIndex <= 0)
			this.selectedIndex = len - 1;
		else this.selectedIndex --;
		// 添加新的选中样式
		const selectedElem = this.suggestionEl.children[this.selectedIndex];
		selectedElem.classList.add('is-selected');
		// 选中元素保持在可见范围
		selectedElem.scrollIntoView(false);
	}

	/**
	 * 选中指定下标的补全建议
	 * @param selectIndex
	 */
	protected select = (selectIndex: number) => {
		// 移除原有选中样式
		this.suggestionEl.children[this.selectedIndex]?.classList.remove('is-selected');
		this.selectedIndex = selectIndex;
		// 添加新的选中样式
		const selectedElem = this.suggestionEl.children[this.selectedIndex];
		selectedElem.classList.add('is-selected');
		// 选中元素保持在可见范围
		selectedElem.scrollIntoView(false);
	}

	/**
	 * 应用当前选中的补全建议
	 */
	protected applySuggestion = () => {
		const selectSuggestion = this.fuzzySuggestions[this.selectedIndex];
		// 光标位置
		const caretPosition = getCaretPosition(this.outerEl);
		// 从开头到光标位置所在的字串
		const beg2caret = this.outerEl.innerText.slice(0, caretPosition);
		// 从开头位置到结束的字串
		const caret2end = this.outerEl.innerText.slice(caretPosition + 1);
		const afterApply = beg2caret.replace(/\[\[([^\[\]]*)$/, selectSuggestion.replaceString);
		this.outerEl.innerHTML = [afterApply, caret2end].join('');
		// 移动光标
		setCaretPosition(this.outerEl, afterApply.length);
		// 补全完后关闭
		this.disable();
		return;
	}
}

export class ReferenceSuggestionPopper extends SuggestionPopper<TFile> {

	getDisplay(item: TFile, queryString: string, searchResult: SearchResult): string {
		let i = 0;
		const result = [];
		result.push('<div class="suggestion-content">');
		// 标题
		result.push('<div class="suggestion-title">');
		for (const [j1, j2] of searchResult.matches) {
			// [i, j1) 未匹配中
			result.push('<span>');
			result.push(queryString.slice(i, j1));
			result.push('</span>');
			// [j1, j2) 匹配中，添加相应样式
			result.push('<span class="suggestion-highlight">');
			result.push(queryString.slice(j1, j2));
			result.push('</span>');
			i = j2; // 更新 j2
		}
		// 处理最后可能出现的不匹配串
		result.push('<span>');
		result.push(queryString.slice(i));
		result.push('</span>');
		result.push('</div>');
		// 路径提示
		if (item.parent.path != '') {
			result.push('<div class="suggestion-note">');
			result.push(item.parent.path);
			result.push('</div>');
		}
		result.push('<i class="fas fa-align-left"></i>');
		result.push('</div>');
		return result.join('');
	}

	getQueryString(item: TFile): string {
		return item.basename;
	}

	getReplaceString(item: TFile): string {
		const activeFile = this.app.workspace.getActiveFile()!;
		return this.app.fileManager.generateMarkdownLink(item, activeFile.path);
	}

	trigger(): void {
		// 输入时，光标前为 [[ 则触发补全
		this.plugin.registerDomEvent(this.outerEl, 'input', (e) => {
			const caretPosition = getCaretPosition(this.outerEl);
			const text = this.outerEl.innerText.slice(0, caretPosition);
			const matchResult = text.match(/\[\[([^\[\]]*)$/);
			if (matchResult) {
				this.onTrigger(matchResult[1]);
			} else {
				// 不符合触发规则
				this.containerEl.style.display = 'none';
			}
		});
	}

	updateCandidates(): void | Promise<void> {
		this.app.metadataCache.on('resolved', () => {
			this.onUpdateCandidates();
		});
	}

	onUpdateCandidates(): void | Promise<void> {
		this.candidates = this.app.vault.getMarkdownFiles();
	}

	onUnload() {
		this.containerEl.remove();
	}
}
