import {App} from "obsidian";

export interface ColToolBarOptions {
	alignLeft: (e: MouseEvent) => void | Promise<void>,
	alignCenter: (e: MouseEvent) => void | Promise<void>,
	alignRight: (e: MouseEvent) => void | Promise<void>,
	// deleteCol: (e: MouseEvent) => void | Promise<void>,
	// insertColRight: (e: MouseEvent) => void | Promise<void>,
}

export const getColToolBarElement = (options: ColToolBarOptions) => {
	const colToolBarEl = createDiv({ cls: 'ob-table-enhancer-col-toolbar' });
	// add align left button
	const alignLeftButton = colToolBarEl.createDiv('<svg t="1661654390025" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2402" width="200" height="200"><path d="M128 810.667h768V896H128zM128 640h512v85.333H128z m0-170.667h768v85.334H128zM128 128h768v85.333H128z m0 170.667h512V384H128z" p-id="2403" data-spm-anchor-id="a313x.7781069.0.i1"></path></svg>');
	alignLeftButton.onclick = (e) => { options.alignLeft(e) };
	// add align center button
	const alignCenterButton = colToolBarEl.createDiv('<svg t="1661665379942" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1843" width="200" height="200"><path d="M128 810.667h768V896H128zM256 640h512v85.333H256zM128 469.333h768v85.334H128zM128 128h768v85.333H128z m128 170.667h512V384H256z" p-id="1844"></path></svg>');
	alignCenterButton.onclick = (e) => { options.alignCenter(e); }
	// add align right button
	const alignRightButton = colToolBarEl.createDiv('<svg t="1661665414059" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1982" width="200" height="200"><path d="M128 128h768v85.333H128z m0 682.667h768V896H128zM341.333 640H896v85.333H341.333zM128 469.333h768v85.334H128z m213.333-170.666H896V384H341.333z" p-id="1983"></path></svg>');
	alignRightButton.onclick = (e) => { options.alignRight(e); }
}

export class ToolBar {

	containerEl: HTMLElement;

	toolBarEl: HTMLElement;

	constructor(containerEl: HTMLElement) {
		this.containerEl = containerEl;
		this.toolBarEl = createDiv({ cls: 'ob-table-enhancer-toolbar' });
	}

	addButton = (
		svg: string,
		onClick: (e: MouseEvent) => void | Promise<void>
	) => {
		const button = this.toolBarEl.createDiv({
			cls: 'col-action',
			text: svg
		});
		button.onclick = onClick;
		return this;
	}

	show() {
		activeDocument.body.appendChild(this.toolBarEl);
		// 定位于 container 的左上角
		const containerRect = this.containerEl.getBoundingClientRect();
		const toolbarRect = this.toolBarEl.getBoundingClientRect();
		this.toolBarEl.style.top = `${containerRect.top - toolbarRect.height}px`;
		this.toolBarEl.style.left = `${containerRect.left}px`;
	}

	hide() {
		this.containerEl.detach();
	}

}
