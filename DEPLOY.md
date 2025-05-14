# 部署到 Google Cloud Run 指南

本文檔提供將 Agent Chat UI 應用部署到 Google Cloud Run 的步驟。

## 前置條件

1. 安裝 [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. 已啟用的 Google Cloud 項目
3. 啟用 Cloud Run API 和 Container Registry API
4. 本地安裝 Docker

## 環境變量設置

在部署前，您需要設置以下環境變量：

- `NEXT_PUBLIC_API_URL`: LangGraph API 的 URL
- `NEXT_PUBLIC_ASSISTANT_ID`: 助手/圖形 ID
- `GSTUDIO_API`: GStudio API 的 URL

## 部署步驟

### 1. 登錄到 Google Cloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. 構建 Docker 映像

```bash
# 構建映像
docker build -t gcr.io/YOUR_PROJECT_ID/agent-chat-ui .
```

### 3. 推送映像到 Google Container Registry

```bash
# 配置 Docker 使用 gcloud 作為憑證助手
gcloud auth configure-docker

# 推送映像
docker push gcr.io/YOUR_PROJECT_ID/agent-chat-ui
```

### 4. 部署到 Cloud Run

```bash
gcloud run deploy agent-chat-ui \
  --image gcr.io/YOUR_PROJECT_ID/agent-chat-ui \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://your-langgraph-api.run.app,NEXT_PUBLIC_ASSISTANT_ID=agent,GSTUDIO_API=https://your-gstudio-api.run.app"
```

> 注意：請將 `YOUR_PROJECT_ID` 替換為您的 Google Cloud 項目 ID，並將環境變量值替換為實際的 API URL。

### 5. 訪問您的應用

部署完成後，Cloud Run 將提供一個 URL，您可以通過該 URL 訪問您的應用。

```
https://agent-chat-ui-xxxxxxxxxxxx-de.a.run.app
```

## 自動化部署（可選）

您可以使用 Cloud Build 設置持續部署流程。創建一個 `cloudbuild.yaml` 文件：

```yaml
steps:
  # 構建 Docker 映像
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/agent-chat-ui', '.']
  
  # 推送映像到 Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/agent-chat-ui']
  
  # 部署到 Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'agent-chat-ui'
      - '--image'
      - 'gcr.io/$PROJECT_ID/agent-chat-ui'
      - '--platform'
      - 'managed'
      - '--region'
      - 'asia-east1'
      - '--allow-unauthenticated'
      - '--set-env-vars'
      - 'NEXT_PUBLIC_API_URL=https://your-langgraph-api.run.app,NEXT_PUBLIC_ASSISTANT_ID=agent,GSTUDIO_API=https://your-gstudio-api.run.app'

images:
  - 'gcr.io/$PROJECT_ID/agent-chat-ui'
```

然後使用以下命令觸發構建：

```bash
gcloud builds submit --config cloudbuild.yaml
```

## 伺服器狀態檢查功能

本應用包含一個伺服器狀態檢查功能，它會：

1. 每3分鐘檢查一次 LangGraph API 和 GStudio API 的狀態
2. 如果任一伺服器離線，在右下角顯示狀態視窗
3. 當伺服器離線時，每5秒重試一次，直到伺服器恢復在線

這個功能有助於監控您的 Cloud Run 服務，確保它們正常運行。
