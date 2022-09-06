# Obsidian Table Enhancer

一个提升 Obsidian 中表格编辑体验的插件。

## TOC

- [如何安装](#如何安装)
- [核心特性](#核心特性)
- [关于单元格内执行 js 函数的一些说明](#关于单元格内执行-js-函数的一些说明)
   - [内置变量](#内置变量)
   - [内置函数](#内置函数)
   - [示例](#示例)

*[Click here](./README.md) for English version.*

## 如何安装

参考 [如何安装obsdiain插件](https://publish.obsidian.md/chinesehelp/01+2021%E6%96%B0%E6%95%99%E7%A8%8B/%E5%A6%82%E4%BD%95%E5%AE%89%E8%A3%85obsdiain%E6%8F%92%E4%BB%B6)

## 核心特性

1. 点击即可编辑一个单元格的内容，处于编辑状态的单元格将高亮显示。按 Enter、Esc 或点击其他位置以退出编辑状态。

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252022775.gif)

2. 编辑单元格时，单元格内是 Markdown 源码，退出编辑模式时会自动渲染。

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252046274.gif)

3. 单元格内可放置任何与表格语法不冲突的元素，比如 html 标签，图片等

   ![ob-plugin](https://user-images.githubusercontent.com/38722307/186895602-d3ca0b99-dc99-4e34-8e16-003b3643c4f2.gif)

4. 按上 / 下方向键、Tab 和 Shift-Tab 可更改编辑焦点为上 / 下 / 左 / 右侧单元格

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252049575.gif)

5. 按左 / 右方向键可以移动光标，在光标位于开头和结尾时按键将更改编辑焦点为左侧 / 右侧单元格

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208252052416.gif)

6. 单元格内支持引用补全，补全使用官方模糊匹配函数，支持高亮匹配子串

   ![ob-plugin](https://user-images.githubusercontent.com/38722307/187054193-bb0e837c-8817-4cf3-9f49-cd231c1d8b71.gif)

7. 鼠标悬浮到行首 / 列首单元格时，会显示一个悬浮工具栏，提供插入 / 删除行 / 列，调整对齐，左右移动列等功能

   ![ob-plugin](https://user-images.githubusercontent.com/38722307/188337779-8c205194-85d2-47ea-bd6d-79aee1812d93.gif)

8. 可以在单元格内写 js 函数，渲染时自动执行，实现表格数据分析

   ![ob-plugin](https://user-images.githubusercontent.com/38722307/188336844-a3bcf252-2552-4d42-99a2-bf2a45db6272.gif)

## 关于单元格内执行 js 函数的一些说明

### 内置变量

- `c`：获得当前列（不包含表头和所在单元格），返回一个**字符数组**
- `nc`：获得当前列（不包含表头和所在单元格），返回一个**数字数组**
- `t`：获得当前表格（具体内容 `console.log` 查看）

### 内置函数

- `sum`：求一个数字数组的和
- `avg`：求一个数字数组的平均值
- `min`：求一个数字数组的最小值
- `max`：求一个数字数组的最大值

### 示例

| 代码 | 说明 |
|--|--|
| `>>> sum(nc)` | 计算当前列所有数的和 |
| `>>> sum(nc.filter(e=>e>0))` | 计算当前列所有正数的和 |
| `>>> avg(nc)` | 计算当前列的均值 |
| `>>> min(nc)` | 计算当前列的最小值 |
| `>>> c.filter(e=>e.contains('TODO')).length` | 计算当前列有多少个格子包含 TODO |
