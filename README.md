## bangumi-app-image-proxy
本项目是用于自行托管 Bangumi (lain.bgm.tv) 图片到自有 OSS 的镜像用中间件。
需要 OSS 支持镜像存储功能 (OSS 抓取源站并存储)。

含有简单的 NSFW 鉴别功能。

### 结构示意
* lain.bgm.tv -> bangumi-app-image-proxy (本中间件) -> 您的 OSS