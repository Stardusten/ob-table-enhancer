# Obsidian Table Enhancer

A plugin for improving the experience of using table in Obsidian.

## TOC

- [How to Install](#how-to-install)
- [Key Features](#key-features)
- [About running JS function in table cells](#about-running-js-function-in-table-cells)
    - [Builtin Variables](#builtin-variables)
    - [Builtin Functions](#builtin-functions)
    - [Samples](#samples)

*[点击这里](./README-zh_cn.md)查看中文文档。*

## How to Install

Please Refer: [How to install Obsidian Plugins](https://forum.obsidian.md/t/plugins-mini-faq/7737)

## Key Features

1. You can click a table cell to edit it directly, and the cell being edited will be highlighted. You can press `Enter` or `Esc` or click anywhere outside the table to exit the edit mode.

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252022775.gif)

3. When editing a table cell, content in the table cell will be converted to original Markdown code, and it will be rendered when you exit the edit mode.

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252046274.gif)

4. In the table cell, you can write anything except the format conflicting with Markdown, such as `|`. Try to add HTML\Tags\Img to it.

    ![ob-plugin](https://user-images.githubusercontent.com/38722307/186895602-d3ca0b99-dc99-4e34-8e16-003b3643c4f2.gif)

5. Use `up` and `down` arrow keys to move between cells. And `tab` key can be used to move between cells, while `shift + tab` can be used to move between cells in the opposite direction.

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252049575.gif)

6. Use `left` and `right` arrow keys to move between characters in the cell. And when your cursor is on the front of the table cell or the end of the table cell, you can use `left` and `right` arrow keys to move between cells.

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252052416.gif)

7. In any table cell, you can double-click `[` to call the autocomplete function for files.

    ![ob-plugin](https://user-images.githubusercontent.com/38722307/187054193-bb0e837c-8817-4cf3-9f49-cd231c1d8b71.gif)

8. When mouse float on the table cell, a toolbar will be displayed on the top side of the cell. You can use the toolbar to insert a row or column before or after the current cell. And also center\left\right align the current cell.

    ![ob-plugin](https://user-images.githubusercontent.com/38722307/188337779-8c205194-85d2-47ea-bd6d-79aee1812d93.gif)

9. You can write JS function in table cell, and it will be executed when you exit the edit mode. The function will receive the table cell content as a parameter, and the return value will be used as the new content of the table cell.

    ![ob-plugin](https://user-images.githubusercontent.com/38722307/188336844-a3bcf252-2552-4d42-99a2-bf2a45db6272.gif)

## About running JS function in table cells

### Builtin Variables

You can access the content of table using following variables easily:

- `c`: Get the current column (excluding the header and the cell itself), return a **character array**
- `nc`: Get the current column (excluding the header and the cell itself), return a **number array**
- `t`: Get the current table (see `console.log` for specific content)

### Builtin Functions

- `sum`: Sum of a number array
- `avg`: Average of a number array
- `min`: Minimum of a number array
- `max`: Maximum of a number array

### Samples

| Code | Description |
|--|--|
| `>>> sum(nc)` | Sum of all numbers in the current column |
| `>>> sum(nc.filter(e=>e>0))` | Sum of all positive numbers in the current column |
| `>>> avg(nc)` | Average of the current column |
| `>>> min(nc)` | Minimum of the current column |
| `>>> c.filter(e=>e.contains('TODO')).length` | Sum of all cells in the current column contains TODO task |
