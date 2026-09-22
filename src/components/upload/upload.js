import http from '@/utils/httpRequest.js'

/**
 * 上传相关的公共逻辑。
 *
 * 这里是 policy.js 的位置，但职责完全不同。改造前是"两步预签名"：
 *   1. PUT /thirdParty/minio/put 拿一个预签名 PUT 地址 → 浏览器 axios.put 直传 MinIO
 *   2. GET /thirdParty/minio/get 再拿一个预签名 GET 地址 → 把这个带 7 天签名的地址
 *      emit 给父表单，直接存进数据库
 * 于是库里存的是会过期的凭证：一周后全站图片 403，而 object key 没被任何地方保留，
 * 事后既不能重新签发，也不能干净地删除。
 *
 * 现在是一条 POST：文件发给后端，后端负责生成路径、按文件头校验类型、落 MinIO，
 * 返回一个不带签名、不会过期的完整 URL。
 */

/** 和后端 minio.max-size 保持一致 */
export const MAX_SIZE_MB = 10

/** 文件选择框的过滤，纯粹是 UX；真正的判定在后端 */
export const accept = '.jpg,.jpeg,.png,.gif,.webp'

export const tip = `只能上传 jpg/png/gif/webp 图片，且不超过 ${MAX_SIZE_MB}MB`

/** 和后端 MediaServiceImpl 的魔数白名单保持一致 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/**
 * 前端预校验，返回错误文案，通过时返回 null。
 *
 * 只为省一次往返和给即时反馈，不是安全边界：
 * file.type 是浏览器按扩展名猜的，可以随便伪造；把 .php 改名成 .jpg 就能过这一关。
 * 后端的判定是按文件头魔数做的，那个才是准的。
 *
 * @param {File} file
 * @returns {string|null}
 */
export function validateFile (file) {
  // file.type 为空说明浏览器没认出来（少见），放行交给后端判断，
  // 否则会把一些明明合法的文件挡在前面
  if (file.type && ALLOWED_MIME_TYPES.indexOf(file.type) === -1) {
    return '只能上传 jpg/png/gif/webp 格式的图片'
  }
  if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
    return `图片大小不能超过 ${MAX_SIZE_MB}MB`
  }
  return null
}

/**
 * 上传单个文件。
 *
 * 注意这里和 policy.js 的一个关键区别：失败时会 reject。
 * 旧的两个函数包在 new Promise 里只有 resolve 没有 reject，也没有 catch，
 * 请求一失败外层的 await 就永远挂着。
 *
 * @param {File} file
 * @returns {Promise<{url: string, name: string, size: number}>}
 */
export function uploadFile (file) {
  const form = new FormData()
  form.append('file', file)

  // 不设 Content-Type：axios 0.17.1 的 xhr adapter 检测到 FormData 会把这个头删掉，
  // 让浏览器自己带上 boundary。手动写死 multipart/form-data 反而会缺 boundary。
  return http.post(http.adornUrl('/thirdParty/file/upload'), form).then(({ data }) => {
    // 后端业务错误也是 HTTP 200，code 在响应体里，必须自己判
    if (data.code !== 0) {
      throw new Error(data.msg || '上传失败')
    }
    return data
  })
}
