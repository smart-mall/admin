import http from '@/utils/httpRequest.js'

export function putFile (bucketName, objectName) {
  return new Promise((resolve, reject) => {
    http({
      url: http.adornUrl('/thirdParty/minio/put'),
      method: 'put',
      params: http.adornParams({
        bucketName,
        objectName
      })
    }).then(({data}) => {
      console.log(data)
      resolve(data)
    })
  })
}

export function getFilePath (bucketName, objectName) {
  return new Promise((resolve, reject) => {
    http({
      url: http.adornUrl('/thirdParty/minio/get'),
      method: 'get',
      params: http.adornParams({
        bucketName,
        objectName
      })
    }).then(({data}) => {
      console.log(data)
      resolve(data)
    })
  })
}
