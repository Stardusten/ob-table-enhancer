# Obsidian Table Enhancer

A plugin for enhance improve the experience of using table in Obsidian.
一个提升 Obsidian 中表格编辑体验的插件。

## How To Install | 如何安装

Please Refer: [How to install Obsidian Plugins](https://forum.obsidian.md/t/plugins-mini-faq/7737)

参考 [如何安装obsdiain插件](https://publish.obsidian.md/chinesehelp/01+2021%E6%96%B0%E6%95%99%E7%A8%8B/%E5%A6%82%E4%BD%95%E5%AE%89%E8%A3%85obsdiain%E6%8F%92%E4%BB%B6)

## Features | 特性

1. You can click a table cell to edit it directly, and the cell being edited will be highlighted. You can press `Enter` or `Esc` or click anywhere outside the table to exit the edit mode.
   点击即可编辑一个单元格的内容，处于编辑状态的单元格将高亮显示。按 Enter、Esc 或点击其他位置以退出编辑状态。

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252022775.gif)

2. When editing a table cell, content in the table cell will be converted to original Markdown code, and it will be rendered when you exit the edit mode.
   编辑单元格时，单元格内是 Markdown 源码，退出编辑模式时会自动渲染。

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252046274.gif)

3. In the table cell, you can write anything except the format conflicting with Markdown, such as `|`. Try to add HTML\Tags\Img to it.
   单元格内可放置任何与表格语法不冲突的元素，比如 html 标签，图片等

	![ob-plugin](https://user-images.githubusercontent.com/38722307/186895602-d3ca0b99-dc99-4e34-8e16-003b3643c4f2.gif)

4. Use `up` and `down` arrow keys to move between cells. And `tab` key can be used to move between cells, while `shift + tab` can be used to move between cells in the opposite direction.
   上 / 下方向键、Tab 和 Shift-Tab 可更改编辑焦点为上 / 下 / 左 / 右侧单元格

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252049575.gif)

5. Use `left` and `right` arrow keys to move between characters in the cell. And when your cursor is on the front of the table cell or the end of the table cell, you can use `left` and `right` arrow keys to move between cells.
   左 / 右方向键可以移动光标，在光标位于开头和结尾时按键将更改编辑焦点为左侧 / 右侧单元格

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252052416.gif)

6. In any table cell, you can double-click `[` to call the autocomplete function for files.
   单元格内支持引用补全，补全使用官方模糊匹配函数，支持高亮匹配子串

	![ob-plugin](https://user-images.githubusercontent.com/38722307/187054193-bb0e837c-8817-4cf3-9f49-cd231c1d8b71.gif)

7. When mouse float on the table cell, a toolbar will be displayed on the top side of the cell. You can use the toolbar to insert a row or column before or after the current cell. And also center\left\right align the current cell.
   鼠标悬浮到行首 / 列首单元格时，会显示一个悬浮工具栏，提供插入 / 删除行 / 列，调整对齐，左右移动列等功能

	![ob-plugin](https://user-images.githubusercontent.com/38722307/188337779-8c205194-85d2-47ea-bd6d-79aee1812d93.gif)

8. You can write JS function in table cell, and it will be executed when you exit the edit mode. The function will receive the table cell content as a parameter, and the return value will be used as the new content of the table cell.
   可以在单元格内写 js 函数，渲染时自动执行，实现表格数据分析

	![ob-plugin](https://user-images.githubusercontent.com/38722307/188336844-a3bcf252-2552-4d42-99a2-bf2a45db6272.gif)

## About running JS function in table cells | 关于单元格内执行 js 函数的说明

- `c`: Get the current column (excluding the header and the cell itself), return a **character array**
- `nc`: Get the current column (excluding the header and the cell itself), return a **number array**
- `t`: Get the current table (see `console.log` for specific content)

- `c`：获得当前列（不包含表头和所在单元格），返回一个**字符数组**
- `nc`：获得当前列（不包含表头和所在单元格），返回一个**数字数组**
- `t`：获得当前表格（具体内容 `console.log` 查看）

Internal functions | 内置函数:

- `sum`: Sum of a number array
- `avg`: Average of a number array
- `min`: Minimum of a number array
- `max`: Maximum of a number array

- `sum`：求一个数字数组的和
- `avg`：求一个数字数组的平均值
- `min`：求一个数字数组的最小值
- `max`：求一个数字数组的最大值

Samples | 几个例子：

```js
>>> sum(nc)	 // 计算当前列所有数的和 | Sum of all numbers in the current column
>>> sum(nc.filter(e=>e>0)) // 计算当前列所有正数的和 | Sum of all positive numbers in the current column
>>> avg(nc) // 计算当前列的均值 | Average of the current column
>>> min(nc) // 计算当前列的最小值 | Minimum of the current column
>>> c.filter(e=>e.contains('TODO')).length // 计算当前列有多少个格子包含 TODO | Sum of all cells in the current column contains TODO task
```
