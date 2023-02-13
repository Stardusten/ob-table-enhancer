# Obsidian Table Enhancer

Manipulate markdown tables **_without touching the source code_** in Obsidian.

## TOC

- [Quick Demo](#quick-demo)
- [How to Install](#how-to-install)
- [Key Features](#key-features)
- [FAQ](#faq)
- [Implementation Notes](#implementation-notes)

## Quick Demo

![table-enhancer-demo](https://user-images.githubusercontent.com/38722307/212839879-d5a86622-7f8a-433e-84f1-a78fa3c2735a.gif)

## How to Install

Please Refer: [How to install Obsidian Plugins](https://forum.obsidian.md/t/plugins-mini-faq/7737)

#### Steps to Install
Note: the plugin is not in the community plugins tab just yet and needs to be manually installed

1. Create a folder called `ob-table-enhancer`
2. Go to the [releases](https://github.com/Stardusten/ob-table-enhancer/releases/) and download `main.js`, `manifest.json` and `styles.css` of the latest version
3. Put the downloaded files into the folder
4. Put the folder in `YourVault/.obsidian/plugins`
5. Reload the plugins in Obsidian settings or restart the program
6. Plugin can now be enabled in the plugins menu

## Key Features

1. You can open a *table generator* by clicking the `Create new table` command in a right-click menu, which allows you to swiftly create an empty table with the specified shape under current cursor.

	![](https://user-images.githubusercontent.com/38722307/212823688-e3281939-1d03-48a2-b319-9aa86b9ec42e.gif)

2. You can click a table cell to edit it directly, and the cell being edited will be highlighted. You can press `Enter` or `Esc` or click anywhere outside the table to exit the edit mode.

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252022775.gif)

3. When editing a table cell, content in the table cell will be converted to original Markdown code, and it will be rendered when you exit the edit mode.

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252046274.gif)

4. In the table cell, you can write anything except the format conflicting with Markdown, such as `|`. Try to add HTML\Tags\Img to it.

    ![ob-plugin](https://user-images.githubusercontent.com/38722307/186895602-d3ca0b99-dc99-4e34-8e16-003b3643c4f2.gif)

5. Use `up` and `down` arrow keys to move between cells. And `tab` key can be used to move between cells, while `shift + tab` can be used to move between cells in the opposite direction.

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252049575.gif)

6. Use `left` and `right` arrow keys to move between characters in the cell. And when your cursor is on the front of the table cell or the end of the table cell, you can use `left` and `right` arrow keys to move between cells.

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252052416.gif)
   
 7. Right-click on any table cell, and you will see a panel of buttons at the top of the pop-out menu. Try hovering your mouse over a button, and you will see a tooltip that tells you what the button does.

	![image](https://user-images.githubusercontent.com/38722307/212823667-3074341f-88ed-4a41-85c2-ec45e76319aa.gif)
	
# FAQ

# Implementation Notes

The implementation of this plugin is actually quite simple. Just intercept any click event, when any click on table cell is intercepted, then set the cell "contenteditable", allowing people to edit the cell in wyswyg way. When any click is intercepted elsewhere (or other events such as esc being pressed), persist all the editing cells (set "content editable").

Q: How do we know which cell in which table is editing by a intercepted click event? And how do we persist a changed table element to the editor?

A: When we click a table cell, we can use `evt.targetNode` to get the clicked cell. And we can also get it's parent table element. Using `EditorView.posAtDom(tableEl)` provided by CM6, we can get the start line number of a table element. This allows us to build a mapping between table elements and  their markdown source code: using `editor.getLine()`, we can get the markdown source code of the table, then do some parse and replace, we can calculate the markdown source code after the changes.


## By Me a Coffee

<a href="https://www.buymeacoffee.com/stardust007" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
