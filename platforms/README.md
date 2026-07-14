# Platforms

未来用于承载多端框架。

当前 PC 后台 PoC 仍放在仓库根目录，方便 OpenDesign 直接读取。等根目录这套链路稳定后，再迁移为：

```text
platforms/admin-pc/
```

后续可扩展：

- `platforms/admin-pc/`
- `platforms/mobile-h5/`
- `platforms/mini-program/`
- `platforms/app-native/`

平台之间共享业务词汇、Feature Spec 的业务字段、资产登记和 QA 流程；不共享 Shell、控件结构、尺寸、导航和交互契约。

- 当前根目录 PC PoC 平台：`admin-pc-ant`，组件规则见 `design-system/ANT-PC-COMPONENT-CONTRACT.md`。
- 未来移动 H5 平台可使用 `mobile-h5-vant` 或经确认的其他规范，并维护自己的组件契约与模板目录。
