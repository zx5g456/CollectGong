# Collect Gong Server

微信云托管 Express 服务，供小程序通过 `wx.cloud.callContainer` 调用。

## 云环境

- 环境 ID：`prod-d8gy5es2o950fb769`
- 服务名：`express-8m4q`

## 数据库集合

需要在云开发数据库中创建这些集合：

- `questionnaire_templates`：问卷模板
- `questionnaire_records`：填写记录
- `counters`：示例计数器，对应 `/api/count`

## 接口

- `GET /api/health`
- `POST /api/count`
- `GET /api/templates`
- `POST /api/templates`
- `GET /api/records/groups`

小程序端统一封装在 `utils/api.js`。
