# 测试需求

## 测试 1：简单列表查询页

```text
我要生成余额分账规则设置查询页，菜单在交易中心-余额分账-余额分账规则设置。查询条件包括交易单号、规则名称、状态。表格列包括规则名称、商户名称、执行分账时间、创建时间、分账模式。行操作包括修改、失效。
```

## 测试 2：列表页 + 新增弹窗

```text
在余额分账规则设置页面增加新增分账规则按钮，点击后弹窗出现表单。字段包括账户类型、结算方式、法人结算卡、账户名称、银行账户开户行、银行账户号码，其中账户类型、结算方式、账户名称、银行账户号码必填。
```

## 测试 3：完整组合流程

```text
我要做一个余额分账规则设置页面，支持查询和新增。菜单在交易中心-余额分账-余额分账规则设置。查询条件有交易单号、规则名称、状态、规则状态。结果列有规则名称、商户名称、执行分账时间、规则创建时间、创建时间、分账模式。点击新增分账规则打开弹窗表单，表单字段包括账户类型、结算方式、法人结算卡、账户名称、银行账户开户行、银行账户号码，其中账户类型、结算方式、账户名称、银行账户号码必填。提交成功后展示内容创建成功页，提供返回列表和创建应用两个按钮。
```

## 建议给 OpenDesign 的完整指令

```text
请使用当前项目中的 skills/admin-query-flow/SKILL.md、design-system/DESIGN.md、shell/app-shell.html 和 templates 目录生成高保真 HTML 原型。

要求：
1. 先把我的自然语言需求转换成 Page Spec。
2. 再根据 Page Spec 生成单文件 HTML。
3. 页面必须符合老板管账后台视觉规范。
4. 不要重新设计左侧菜单、顶部栏、页脚。
5. 主内容区需要包含列表查询页、新增弹窗和成功结果页。

我的需求是：
我要做一个余额分账规则设置页面，支持查询和新增。菜单在交易中心-余额分账-余额分账规则设置。查询条件有交易单号、规则名称、状态、规则状态。结果列有规则名称、商户名称、执行分账时间、规则创建时间、创建时间、分账模式。点击新增分账规则打开弹窗表单，表单字段包括账户类型、结算方式、法人结算卡、账户名称、银行账户开户行、银行账户号码，其中账户类型、结算方式、账户名称、银行账户号码必填。提交成功后展示内容创建成功页，提供返回列表和创建应用两个按钮。
```

## 第二轮验证：只生成内容区

```text
请使用当前工作目录中的这些文件：

- design-system/DESIGN.md
- design-system/tokens.css
- design-system/components.css
- shell/app-shell.html
- shell/menu.config.yaml
- templates/page-content.template.html
- templates/list.template.html
- templates/detail.template.html
- templates/modal-form.template.html
- templates/result.template.html
- skills/admin-query-flow/SKILL.md
- specs/page-spec-rules.md

这次请严格只生成 #page-content 内容区作为 page-content.html，不要在 page-content.html 中输出完整 HTML，不要输出 body/head，不要输出左侧菜单、顶部栏、页脚。

同时请生成一个 preview.html 用于预览。preview.html 必须复用 shell/app-shell.html，并引入或内联 design-system/tokens.css 和 design-system/components.css。preview.html 只能把 page-content.html 注入 #page-content，不能重画左侧菜单、顶部栏、页脚。

输出必须包含：
1. Page Spec
2. page-content.html 片段
3. preview.html 预览文件
4. 自检清单

我的需求是：
我要做一个余额分账规则设置页面，支持查询和新增。菜单在交易中心-余额分账-余额分账规则设置。查询条件有交易单号、规则名称、状态、规则状态。结果列有规则名称、商户名称、执行分账时间、规则创建时间、创建时间、分账模式。点击新增分账规则打开弹窗表单，表单字段包括账户类型、结算方式、法人结算卡、账户名称、银行账户开户行、银行账户号码，其中账户类型、结算方式、账户名称、银行账户号码必填。提交成功后展示内容创建成功页，提供返回列表和创建应用两个按钮。
```

## 第三轮验证：详情页内容区

```text
请使用当前工作目录中的这些文件：

- design-system/DESIGN.md
- design-system/tokens.css
- design-system/components.css
- shell/app-shell.html
- shell/menu.config.yaml
- templates/page-content.template.html
- templates/detail.template.html
- templates/result.template.html
- skills/admin-query-flow/SKILL.md
- specs/page-spec-rules.md

这次请生成详情页内容区。page-content.html 只能包含 #page-content 内容区，不要输出完整 HTML，不要输出 body/head，不要输出左侧菜单、顶部栏、页脚。

同时请生成 preview.html 用于预览。preview.html 必须复用 shell/app-shell.html，并引入或内联 design-system/tokens.css 和 design-system/components.css。preview.html 只能把 page-content.html 注入 #page-content，不能重画左侧菜单、顶部栏、页脚。

输出必须包含：
1. Page Spec
2. page-content.html 片段
3. preview.html 预览文件
4. 自检清单

我的需求是：
我要做一个商户资料详情页，菜单在交易中心-余额分账-余额分账规则设置，页面用于查看商户完整资料。详情页包含四个白色信息卡片：基本信息、产品信息、结算信息、返佣信息。

基本信息卡片中包含这些分组：
1. 基本信息：主体类型、商户编号、商户名称、行业分类、商户简称、商户证件有效期至、商户证件编号、商户实际经营地址。
2. 法人/经营人信息：法人姓名、法人证件人像面照片、法人证件有效期、行业分类、商户简称、商户证件有效期至、法人证件号、法人非人像面。
3. 联系人信息：法人姓名、联系人证件号码、客服电话、联系人联系邮箱、商户简称、商户证件有效期至。
4. 资质证照信息：门头照、场景照、MCC码。

产品信息卡片包含：主体类型、商户编号、商户名称、行业分类、商户简称、商户证件有效期至、商户证件编号、商户实际经营地址。

结算信息卡片包含：主体类型、商户编号、商户名称、行业分类、商户简称、商户证件有效期至、商户证件编号、商户实际经营地址。

返佣信息卡片包含：主体类型、商户编号、商户名称、行业分类、商户简称、商户证件有效期至、商户证件编号、商户实际经营地址，并在卡片底部展示退款明细表格。退款明细表格列包括：退款请求时间、退款请求号、退款完成时间、退款完成时间、退款金额(元)、退款说明、账备注、退款状态。退款状态用绿色圆点加“成功”展示。

请使用以下样例数据：主体类型为个体，商户编号为10092099981，商户名称为许昌市建安区漆酒行(个体工商户)，行业分类为其他行业/其他，商户简称为老板管账测试账户，商户证件有效期至为长期，商户证件编号为92411023MAD24F2QOE，商户实际经营地址为河南许昌市建安区昌盛路西段88号(许昌国际发制品交易市场1号号楼7层701-194室)，法人姓名为杨东桑，法人证件有效期为2026-2-9，法人证件号为身份证140302199809083375，联系人证件号码为130681199309110621，客服电话为13522916133，联系人联系邮箱为peishan.wang@yeepay.com，门头照和场景照均为已上传，MCC码为百货商店(5311)。退款表格展示3行样例数据，金额分别为26,293.99、3,223.99、3,662.00。
```
