# FlightMonitor (NestJS)

一个基于 **NestJS + Schedule + ntfy** 的机票价格监控项目。

## 功能

- 按项目配置监控机票价格：
  - 起点机场代码（from）
  - 终点机场代码（to）
  - 阈值价格（thresholdPrice）
- 每个项目支持多个日期配置：
  - 单程（oneway）
  - 往返（roundtrip）
- 每小时自动执行一次查询任务。
- 查询结果写入本地 JSON（`data/flight-history.json`）。
- 如果价格低于阈值，立即推送 ntfy 通知。
- 每 5 小时生成一张包含所有历史数据的价格趋势图并推送到 ntfy。

## 0 配置通知（推荐）

1. 手机上安装 ntfy App（iOS/Android）。
2. 在 App 里订阅一个 topic，例如：`flight-monitor-your-random-topic`。
3. 在 `.env` 设置相同 topic。

> 不需要 Telegram Bot、不需要 SMTP 账号。

## 快速开始

```bash
npm install
cp .env.example .env
npm run start:dev
```

## 配置说明

### 1) 项目配置

文件：`data/search-projects.json`

示例：

```json
[
  {
    "id": "sha_to_hkg",
    "enabled": true,
    "from": "SHA",
    "to": "HKG",
    "thresholdPrice": 1000,
    "currency": "CNY",
    "times": [
      { "type": "oneway", "departDate": "2026-04-01" },
      { "type": "roundtrip", "departDate": "2026-04-01", "returnDate": "2026-04-05" }
    ]
  }
]
```

### 2) ntfy 配置

```env
NTFY_SERVER=https://ntfy.sh
NTFY_TOPIC=flight-monitor-your-random-topic
NOTIFY_ENABLED=true
```

- `NTFY_SERVER`：默认公共服务 `https://ntfy.sh`
- `NTFY_TOPIC`：你在手机订阅的 topic，建议用随机字符串避免被猜到
- `NOTIFY_ENABLED=false`：可关闭通知，仅本地记录

### 3) 航司/平台查询来源

默认使用 mock 模式（随机价格，用于先跑通流程）：

```env
FLIGHT_PROVIDER=mock
```

如接入真实供应商 API：

```env
FLIGHT_PROVIDER=your_provider
FLIGHT_PROVIDER_ENDPOINT=https://your-provider.example.com/search
FLIGHT_PROVIDER_TOKEN=xxx
```

接口需返回：

```json
{ "price": 899 }
```

## 定时策略

- 每小时任务：`CronExpression.EVERY_HOUR`
- 每 5 小时趋势图任务：`0 */5 * * *`

## 常用命令

```bash
npm run check
npm run build
npm run start
```
