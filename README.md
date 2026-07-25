# 收集工 / CollectGong

**纯 Agent 项目 / Agent-only Project**

本项目采用纯 Agent 工作流完成，产品功能设计、微信小程序前端、服务端、数据库逻辑、界面迭代和项目文档均由 AI Agent 协作实现。

This project is built through an agent-only workflow. Product design, the WeChat Mini Program frontend, backend services, database logic, UI iterations, and documentation are implemented collaboratively by AI agents.

收集工是一款用于创建、分享和管理信息收集问卷的微信小程序。问卷发起人可以配置模板并分享给填写人，在小程序中查看提交结果、删除无效数据，并将完整结果导出为 Excel。

CollectGong is a WeChat Mini Program for creating, sharing, and managing information-collection forms. Form owners can configure reusable templates, share them with respondents, review or delete submissions, and export complete results to Excel.

## Features

### WeChat Login

- Identifies the current user through headers provided by WeChat Cloud Hosting.
- Users can manage only the templates and submissions they own.

### Template Creation

- Set a template name.
- Add, remove, and edit form fields.
- Support number, text, and phone-number inputs.
- Configure titles, descriptions, placeholders, and required fields.
- Preview the respondent-facing form while editing.
- Import an existing template and edit it as a new copy without changing the original.
- Return to the home page with a success message after creation.

### Template Preview and Sharing

- View existing templates, submission counts, and update times.
- Open a template in read-only preview mode.
- Share forms through WeChat with the CollectGong logo as the share image.
- Respondents can open shared links and submit information.
- Swipe a template to the left to reveal the delete action.
- Deleting a template requires confirmation and permanently removes all related submissions.

### Form Submission

- Validate required fields before submission.
- Prevent repeated submission while a request is in progress.
- Show a persistent success screen after submission and tell the respondent that the page can be closed.

### Submission Management

- Group submissions by template and show counts and latest activity.
- Sort submissions by creation time in descending order.
- Show the latest three submissions by default, with an option to reveal older records.
- Show the first three fields of each submission by default, with an option to expand all fields.
- Delete individual submissions after confirmation.
- Display all server times in China Standard Time (UTC+8).

### Excel Export

- Export submissions for a template as an `.xlsx` workbook.
- Include all fields and all non-deleted records, regardless of the collapsed UI state.
- Exclude deleted submissions from future exports.

## 技术架构 / Architecture

- 小程序前端 / Mini Program: WeChat Mini Program, Skyline, Glass Easel
- 服务端 / Backend: Node.js, Express
- 数据库 / Database: MySQL, Sequelize
- Excel: ExcelJS
- 部署 / Deployment: WeChat Cloud Hosting, Docker

```text
pages/                 小程序页面 / Mini Program pages
components/            公共组件 / Shared components
utils/api.js           云托管接口封装 / Cloud API client
assets/                图片资源 / Image assets
server/index.js        Express API
server/db.js           Sequelize 模型和数据库初始化
Dockerfile             云托管容器镜像
```

## 配置与运行 / Configuration and Running

### 1. 配置微信云环境 / Configure WeChat Cloud

在 `utils/api.js` 中设置云环境和云托管服务名称：

Set the cloud environment and Cloud Hosting service name in `utils/api.js`:

```js
const cloudEnv = 'your-cloud-environment-id'
const cloudService = 'your-cloud-service-name'
```

### 2. 配置数据库 / Configure MySQL

服务端读取以下环境变量：

The server reads the following environment variables:

```text
MYSQL_USERNAME
MYSQL_PASSWORD
MYSQL_ADDRESS
PORT
```

`MYSQL_ADDRESS` 使用 `host:port` 格式。服务启动时会创建并同步 `collect_gong` 数据库。

`MYSQL_ADDRESS` uses the `host:port` format. The server creates and synchronizes the `collect_gong` database during startup.

### 3. 启动服务端 / Start the Server

```bash
cd server
npm install
npm start
```

也可以使用项目根目录的 `Dockerfile` 部署到微信云托管。

The root-level `Dockerfile` can also be used to deploy the service to WeChat Cloud Hosting.

### 4. 运行小程序 / Run the Mini Program

使用微信开发者工具打开项目根目录，确认 AppID、云环境和云托管服务配置正确后编译运行。

Open the project root in WeChat DevTools, verify the AppID, cloud environment, and Cloud Hosting service settings, then compile the Mini Program.

## 数据与删除说明 / Data and Deletion Notes

- 删除单条提交记录后，该记录将不会出现在页面或 Excel 导出中。
- 删除模板会永久删除模板及其全部提交记录。
- 删除操作目前不可撤销，请在确认后执行。

- Deleting a submission removes it from both the UI and future Excel exports.
- Deleting a template permanently removes the template and all related submissions.
- Deletion is currently irreversible and should be confirmed carefully.

## License

Apache-2.0
