# 前端接口需求（简版）

## 说明

本文档只整理小程序和 H5 前端需要调用的接口。

美食和地点由当前 H5、小程序中的新建页面录入，不再单独依赖后台管理页面。

## 图片建议

美食和地点图片建议上传到 OSS，并通过 CDN 域名访问。数据库只保存图片地址或 OSS `objectKey`，不保存图片二进制内容。

接口给前端返回可直接展示的 `image` URL。后续可以根据使用场景返回缩略图，避免列表页加载原图。

新建内容时，前端先把单张图片上传到 OSS，再将得到的图片 URL 传给新增接口。

## 1. 美食列表

```http
GET /api/foods?page=1&pageSize=20
```

```json
{
  "list": [
    {
      "id": "food-01",
      "name": "阿里郎朝鲜烤肉",
      "type": "烤肉 · 朝鲜风味",
      "comment": "感受一下当太阳的感觉！",
      "image": "https://cdn.example.com/foods/food-01.webp"
    }
  ],
  "total": 1
}
```

## 2. 出去玩的地点列表

```http
GET /api/places?page=1&pageSize=20
```

```json
{
  "list": [
    {
      "id": "place-01",
      "name": "颐和园傍晚散步",
      "type": "公园 · 散步",
      "comment": "想慢慢走完长廊，再看一眼湖面。",
      "image": "https://cdn.example.com/places/place-01.webp"
    }
  ],
  "total": 1
}
```

## 3. 新增美食或地点

美食和地点共用一个接口，通过 `contentType` 区分类型。

```http
POST /api/content-items
Content-Type: application/json
```

新增美食：

```json
{
  "contentType": "food",
  "name": "阿里郎朝鲜烤肉",
  "type": "烤肉 · 朝鲜风味",
  "comment": "想一起去感受一下当太阳的感觉！",
  "image": "https://cdn.example.com/foods/food-new.webp"
}
```

新增地点：

```json
{
  "contentType": "place",
  "name": "颐和园傍晚散步",
  "type": "公园 · 散步",
  "comment": "想慢慢走完长廊，再看一眼湖面。",
  "image": "https://cdn.example.com/places/place-new.webp"
}
```

返回新建后的完整数据：

```json
{
  "id": "food-13",
  "contentType": "food",
  "name": "阿里郎朝鲜烤肉",
  "type": "烤肉 · 朝鲜风味",
  "comment": "想一起去感受一下当太阳的感觉！",
  "image": "https://cdn.example.com/foods/food-new.webp"
}
```

`contentType` 取值：`food | place`。

## 4. 计划数据结构

计划状态统一使用 `status`：

- `active`：本次计划，系统中最多一条。
- `backup`：备用计划，可以有多条。
- `completed`：已完成的历史计划。

```json
{
  "id": "plan-01",
  "title": "下雨的时候",
  "status": "backup",
  "date": null,
  "scenario": "rainy",
  "scenarioText": "下雨 · 室内",
  "note": "下雨就找个有空调的地方慢慢逛。",
  "items": [],
  "sourceBackupId": null,
  "completedAt": null,
  "createdAt": "2026-07-20T08:00:00.000Z",
  "updatedAt": "2026-07-20T08:00:00.000Z"
}
```

状态流转更新原计划记录，计划 ID 和安排项 ID 均保持不变。
过去计划的精选图片不放入 Plan 响应，由照片接口单独查询。

## 5. 新增计划

```http
POST /api/crush-date/plans
Content-Type: application/json
```

```json
{
  "title": "下雨的时候",
  "status": "backup",
  "date": null,
  "scenario": "rainy",
  "scenarioText": "下雨 · 室内",
  "note": "下雨就找个有空调的地方慢慢逛。",
  "items": []
}
```

新建 `active` 计划时 `date` 必填；新建 `backup` 计划时 `date` 为 `null`。

## 6. 计划列表

```http
GET /api/crush-date/plans
```

```json
{
  "activePlan": null,
  "backupPlans": [],
  "completedPlans": []
}
```

同一计划只能出现在与其状态对应的一个分组中。

## 7. 修改计划信息和安排

```http
PATCH /api/crush-date/plans/{id}
Content-Type: application/json
```

该接口只修改标题、日期、场景、备注和完整安排项数组，不负责状态流转。

```json
{
  "title": "新的标题",
  "scenario": "rainy",
  "scenarioText": "下雨 · 室内",
  "note": "记得带伞",
  "items": [
    {
      "id": "item-01",
      "type": "place",
      "sourceId": "place-01",
      "period": "afternoon",
      "note": "慢慢走一圈。",
      "order": 0
    }
  ]
}
```

`period` 取值：`morning | noon | afternoon | evening`。

## 8. 更新计划状态

```http
PATCH /api/crush-date/plans/{id}/status
Content-Type: application/json
```

### 备用计划设为本次计划

```json
{
  "status": "active",
  "date": "2026-07-26"
}
```

`date` 必填，格式为 `YYYY-MM-DD`，且不能早于当前日期。系统中存在其他 `active` 计划时返回 `409`。

### 本次计划放回备用计划

```json
{
  "status": "backup"
}
```

不得传 `date`。后端会将 `date`、`completedAt` 和 `sourceBackupId` 清空。

### 完成本次计划

```json
{
  "status": "completed"
}
```

不得传 `date`。`completedAt` 由后端生成。

三种状态更新均返回更新后的完整 Plan，且不会创建新的计划 ID。

旧的独立“激活计划”和“完成计划”接口已删除，所有原记录状态流转统一使用本接口。

## 9. 过去计划再计划一次

```http
POST /api/crush-date/plans/{id}/replan
Content-Type: application/json
```

```json
{
  "date": "2026-07-26"
}
```

该接口保留原 `completed` 计划，并创建一条新的 `active` 计划。

## 10. 查询过去计划精选图片

```http
GET /api/crush-date/plans/{id}/photos
```

仅 `completed` 计划允许查询。照片按 `sortOrder`、`createdAt` 和 `id` 正序返回：

```json
{
  "list": [
    {
      "id": "photo-01",
      "url": "https://cdn.example.com/plan-photos/photo-01.webp",
      "sortOrder": 0,
      "createdAt": "2026-07-24T08:30:00.000Z"
    }
  ]
}
```

## 11. 上传过去计划精选图片

```http
POST /api/crush-date/plans/{id}/photos
Content-Type: multipart/form-data
```

文件字段名为 `file`。支持 JPG、PNG、WebP，单张最大 5MB，每次请求上传一张，每个计划最多
9 张。前端多选时按选择顺序逐张调用。

成功返回 `201` 和新增的完整照片对象：

```json
{
  "id": "photo-02",
  "url": "https://cdn.example.com/plan-photos/photo-02.webp",
  "sortOrder": 1,
  "createdAt": "2026-07-24T08:35:00.000Z"
}
```

## 12. 删除单张过去计划精选图片

```http
DELETE /api/crush-date/plans/{planId}/photos/{photoId}
```

不传 Query 参数或 Body。仅 `completed` 计划允许删除，照片必须属于指定计划。成功返回
`204 No Content`，后端自动将剩余照片的 `sortOrder` 整理为连续数字并清理 OSS 文件。
计划或照片不存在、照片不属于计划时返回 `404`；计划不是 `completed` 时返回 `409`。

## 13. 调整过去计划精选图片顺序

```http
PATCH /api/crush-date/plans/{id}/photos/order
Content-Type: application/json
```

```json
{
  "photoIds": ["photo-03", "photo-01", "photo-02"]
}
```

`photoIds` 必须无重复并完整包含当前计划的全部照片 ID，数组顺序即最终顺序。成功返回与查询
接口相同的 `{ "list": [...] }`。当前前端仅展示“调整顺序（即将支持）”占位，尚未调用该接口。

## 14. 删除计划

```http
DELETE /api/crush-date/plans/{id}
```

`active`、`backup`、`completed` 三种状态均允许删除，成功返回 `204 No Content`，没有响应体。
删除 `completed` 计划时，后端同时永久删除该计划的全部精选照片，前端不调用任何单张照片删除
接口。

## 15. 其他计划接口

| Method   | Path                                          | 用途                     |
| -------- | --------------------------------------------- | ------------------------ |
| `GET`    | `/api/crush-date/plans/{id}`                  | 获取计划详情             |
| `DELETE` | `/api/crush-date/plans/{id}`                  | 删除任意状态的计划       |
| `PATCH`  | `/api/crush-date/plans/{id}`                  | 修改计划信息和完整安排项 |
| `PATCH`  | `/api/crush-date/plans/{id}/status`           | 更新计划状态             |
| `POST`   | `/api/crush-date/plans/{id}/replan`           | 过去计划再计划一次       |
| `GET`    | `/api/crush-date/plans/{id}/photos`           | 查询过去计划精选图片     |
| `POST`   | `/api/crush-date/plans/{id}/photos`           | 上传过去计划精选图片     |
| `DELETE` | `/api/crush-date/plans/{id}/photos/{photoId}` | 删除单张精选图片         |

## 16. 错误响应

- `400`：请求体、日期、文件或照片排序 ID 不合法。
- `404`：计划不存在。
- `409`：当前状态不允许操作、系统中已有本次计划或精选照片已达到 9 张。
- `500`：服务器、OSS 或其他内部操作失败。

错误响应中的 `message` 应直接展示给用户。

## 暂时不写的内容

- OSS 签名上传接口。
- 登录和用户体系。
- 回忆和分享接口。
- 复杂错误码、幂等和分布式事务方案。
