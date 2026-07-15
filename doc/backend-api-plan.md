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

## 4. 新增计划

```http
POST /api/plans
Content-Type: application/json
```

```json
{
  "title": "下雨的时候",
  "planType": "backup",
  "date": null,
  "scenario": "rainy",
  "scenarioText": "下雨 · 室内",
  "note": "下雨就找个有空调的地方慢慢逛。",
  "items": [
    {
      "id": "item-01",
      "type": "place",
      "sourceId": "place-01",
      "title": "博物馆慢慢逛",
      "image": "https://cdn.example.com/places/place-01.webp",
      "period": "afternoon",
      "note": "先在室内慢慢看展。",
      "order": 0
    },
    {
      "id": "item-02",
      "type": "food",
      "sourceId": "food-01",
      "title": "阿里郎朝鲜烤肉",
      "image": "https://cdn.example.com/foods/food-01.webp",
      "period": "evening",
      "note": "逛完之后去吃烤肉。",
      "order": 0
    }
  ]
}
```

`planType` 取值：

- `active`：本次计划，`date` 必填。
- `backup`：备用计划，`date` 必须为 `null`。

## 5. 计划列表

```http
GET /api/plans
```

为了方便前端直接渲染，接口按“当前计划”和“过去计划”分组返回。

```json
{
  "currentPlans": [
    {
      "id": "plan-01",
      "title": "本次计划",
      "planType": "active",
      "date": "2026-07-20",
      "scenario": "free",
      "scenarioText": "自由安排",
      "note": "希望那天天气刚好。",
      "items": [
        {
          "id": "item-11",
          "type": "place",
          "sourceId": "place-06",
          "title": "798 艺术区",
          "image": "https://cdn.example.com/places/place-06.webp",
          "period": "morning",
          "note": "出去走走，顺便看看天空。",
          "order": 0
        },
        {
          "id": "item-12",
          "type": "food",
          "sourceId": "food-01",
          "title": "阿里郎朝鲜烤肉",
          "image": "https://cdn.example.com/foods/food-01.webp",
          "period": "evening",
          "note": "晚上好好吃一顿。",
          "order": 0
        }
      ]
    },
    {
      "id": "plan-02",
      "title": "下雨的时候",
      "planType": "backup",
      "date": null,
      "scenario": "rainy",
      "scenarioText": "下雨 · 室内",
      "note": "",
      "items": [
        {
          "id": "item-21",
          "type": "place",
          "sourceId": "place-03",
          "title": "商场慢慢逛",
          "image": "https://cdn.example.com/places/place-03.webp",
          "period": "afternoon",
          "note": "下雨就不去户外。",
          "order": 0
        },
        {
          "id": "item-22",
          "type": "food",
          "sourceId": "food-09",
          "title": "蜀九香火锅",
          "image": "https://cdn.example.com/foods/food-09.webp",
          "period": "evening",
          "note": "雨天吃点热的。",
          "order": 0
        }
      ]
    }
  ],
  "pastPlans": [
    {
      "id": "plan-03",
      "title": "公园里的傍晚",
      "planType": "completed",
      "date": "2026-07-06",
      "completedAt": "2026-07-06T14:00:00Z",
      "note": "那天风刚好。",
      "items": [
        {
          "id": "item-31",
          "type": "place",
          "sourceId": "place-02",
          "title": "朝阳公园",
          "image": "https://cdn.example.com/places/place-02.webp",
          "period": "afternoon",
          "note": "躺着看云层变粉。",
          "order": 0
        },
        {
          "id": "item-32",
          "type": "food",
          "sourceId": "food-11",
          "title": "很久以前羊肉串",
          "image": "https://cdn.example.com/foods/food-11.webp",
          "period": "evening",
          "note": "烟火气刚刚好。",
          "order": 0
        }
      ]
    }
  ]
}
```

`currentPlans` 中只允许有一条 `planType = active` 的计划，但可以有多条 `backup`。

## 6. 计划增删改查

| Method   | Path              | 用途                   |
| -------- | ----------------- | ---------------------- |
| `GET`    | `/api/plans/{id}` | 获取计划详情           |
| `PATCH`  | `/api/plans/{id}` | 修改计划信息和安排     |
| `DELETE` | `/api/plans/{id}` | 删除本次计划或备用计划 |

`PATCH` 可以直接提交完整的 `items`，前端暂时不需要再分成多个安排子接口。

PlanItem 数组示例（同一计划可以有多个安排）：

```json
[
  {
    "id": "item-01",
    "type": "place",
    "sourceId": "place-01",
    "title": "颐和园傍晚散步",
    "image": "https://cdn.example.com/places/place-01.webp",
    "period": "afternoon",
    "note": "慢慢走一圈。",
    "order": 0
  },
  {
    "id": "item-02",
    "type": "food",
    "sourceId": "food-01",
    "title": "阿里郎朝鲜烤肉",
    "image": "https://cdn.example.com/foods/food-01.webp",
    "period": "evening",
    "note": "散步结束后去吃烤肉。",
    "order": 0
  }
]
```

`period` 取值：`morning | noon | afternoon | evening`。

## 暂时不写的内容

- OSS 签名上传接口。
- 登录和用户体系。
- 照片、回忆和分享接口。
- 复杂错误码、幂等和分布式事务方案。
