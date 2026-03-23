# 任务三：课表导出教程

## 需求概述
引导用户从教务系统导出课表并导入平台。

## 页面路由
- `/guide/export-schedule` - 课表导出教程页

## 教程内容
1. 登录教务系统：http://jw.sdcit.edu.cn/jwglxt/xtgl/login_slogin.html
2. 点击个人课表查询
3. 选择学年学期
4. 输出 PDF 保存
5. 返回平台导入 PDF

## 入口位置
- `src/app/schedule/page.tsx` - 课表页添加帮助入口
- `src/app/schedule/import/page.tsx` - 导入页添加教程链接
- `src/components/MobileNavbar.tsx` - 移动端导航添加入口

## 组件
- `src/components/guide/ScheduleExportCard.tsx` - 快捷帮助卡片

## 验收标准
- [ ] 教程页面可访问
- [ ] 包含 5 步操作流程
- [ ] 有教务系统直达链接
- [ ] 相关页面有入口

## 预计工作量：3 小时
