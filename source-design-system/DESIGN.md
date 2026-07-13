---
# Design System 后台管理规范
name: merchant-admin
version: 1.0
type: backend-dashboard
primaryColor: #f53f3f
secondaryColor: #1677ff
neutral:
  100: #ffffff
  200: #f7f8fa
  300: #e5e6eb
  400: #c9cdd4
  500: #86909c
  600: #4e5969
  700: #272e3b
  800: #1d2129
text:
  title: #1d2129
  regular: #4e5969
  light: #86909c
border: #e5e6eb
radius:
  sm: 2px
  md: 4px
  lg: 6px
space:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
shadow: 0 1px 3px rgba(0,0,0,0.08)
font:
  family: "PingFang SC,Microsoft YaHei,sans-serif"
  size-sm: 12px
  size-md: 14px
  size-lg: 16px
  weight-normal: 400
  weight-bold: 600
button:
  primary-bg: var(--color-primary)
  primary-text: #fff
  default-bg: #fff
  default-border: var(--border)
  danger-text: var(--color-primary)
table:
  header-bg: var(--neutral-200)
  row-hover: #f2f3f5
sidebar:
  bg: #fff
  active-bg: #fff2f2
  active-text: var(--color-primary)
header-bar: #fff
---
# 后台管理系统视觉规范
## 1. 全局基础
页面背景：`var(--neutral-200)`，卡片白色底色，统一圆角 `var(--radius-md)`，基础阴影
字体统一无衬线中文，正文14px，辅助文字12px，标题16px加粗

## 2. 侧边导航栏
- 左侧固定侧边，白色背景
- 选中菜单：浅红底色 + 红色文字
- 一级菜单加粗，二级菜单缩进，hover浅灰底色

## 3. 顶部导航栏
纯白顶栏，标签页横向排列，右侧功能图标、主题切换、通知、下载、用户头像按钮

## 4. 筛选搜索区
白色卡片包裹，多输入框+下拉筛选，右侧「重置」灰色按钮、「查询」红色主按钮
支持收起/展开筛选面板

## 5. 表格列表
表头浅灰底色，单行hover浅灰，操作列文字按钮：修改(蓝)、失效/详情(红)、下载
分页居右，每页条数下拉选择

## 6. 按钮规范
1. 主按钮：红色背景白色字（新增、查询）
2. 普通按钮：白底灰边框灰字（重置）
3. 文字操作按钮：无背景，仅文字颜色区分
4. 危险操作文字：#f53f3f

## 7. 标签&状态
生效中：红色文字标识状态
统计文字：常规灰色数字
分页激活页码：红色边框底色
