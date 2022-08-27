export function getCaretPosition(editableElem: HTMLElement) {
	let caretPos = 0, sel, range;
	sel = activeWindow.getSelection();
	if (sel && sel.rangeCount) {
		range = sel.getRangeAt(0);
		if (range.commonAncestorContainer.parentNode == editableElem) {
			caretPos = range.endOffset;
		}
	}
	return caretPos;
}

/**
 *
 * @param editableElem
 * @param newPos
 */
export function setCaretPosition(editableElem: HTMLElement, newPos: number) {
	let caretPos = 0, sel, range = activeDocument.createRange();
	sel = activeWindow.getSelection();
	if (sel && sel.rangeCount) {
		range.setStart(editableElem.childNodes[0], newPos);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	}
	return caretPos;
}

export function getCaretRect(container: HTMLElement) {
	let caretPos = 0, sel, range;
	sel = activeWindow.getSelection();
	if (sel && sel.rangeCount) {
		range = sel.getRangeAt(0);
		const rect = range.getBoundingClientRect();
		return rect;
	}
	return null;
}
