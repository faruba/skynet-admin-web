import request from '@/utils/request'

export function modeList() {
  return request({
    url: '/serverManager/modeList',
    method: 'get'
  })
}
function obj2query(obj){
    let ret = []
    for (let k in obj){
        ret.push(`${k}=${obj[k]}`)
    }
    return ret.join('&')
}
export function query(data) {
  return request({
    url: '/serverManager/query?'+obj2query(data),
    method: 'get'
  })
}

export function update(path, data, mode) {
  data._pth = path
  data._mode = mode
  const url  = `/serverManager/update?`+obj2query(data)
  delete data._pth,
  delete data._mode
  return request({
    url,
    method: 'get'
  })
}



