import store from 'storejs'
import { isEmpty } from 'lodash'
const forge = require('node-forge') // rsa加密
const aesjs = require('aes-js')
const entitiesRegexp = /[&"'<>]/g
const entityMap = {
  '&': '&amp;',
  '"': '&quot;',
  "'": '&apos;',
  '<': '&lt;',
  '>': '&gt;'
}
const utils = {
  /**
   *
   *
   * @param {object} obj
   * @param {string} oldName
   * @param {string} newName
   * @returns
   */
  renameProperty (obj, oldName, newName) {
    if (oldName === newName) {
      return obj
    }
    if (Object.prototype.hasOwnProperty.call(obj, oldName)) {
      obj[newName] = obj[oldName]
      delete obj[oldName]
    }
    return obj
  },
  /**
   *
   *
   * @param {object} obj
   * @returns
   */
  isOwnEmpty (obj) {
    for (const name in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, name)) {
        return false
      }
    }
    return true
  },
  /*
  属性分割
  * @param  {object}           obj 修改的对象
  * @param  {array,string}     props 要分割的属性["ports","config_paths","command"]
  * @param  {string}           character 分隔符
  * @return {object}           newObj 新对象, prop, character
  */
  propCut (obj, props, character) {
    const newObj = {}
    if (typeof obj === 'object') {
      for (const i in obj) {
        newObj[i] = obj[i]
        if (props.indexOf(i) > -1) {
          if (i === 'ports') {
            const portsArray = obj[i].split(character)
            newObj[i] = portsArray.map(function (j) {
              return Number(j)
            })
          } else {
            newObj[i] = obj[i].split(character)
          }
        }
      }
      return newObj
    }
  },
  /* // Speed up calls to hasOwnProperty
     const hasOwnProperty = Object.prototype.hasOwnProperty; */
  isEmpty,
  /**
   *
   * 深拷贝
   * @param {object} obj
   * @returns
   */
  cloneObj (obj) {
    let str
    let newobj = obj.constructor === Array ? [] : {}
    if (typeof obj !== 'object') {
      return
    } else if (window.JSON) {
      str = JSON.stringify(obj)
      newobj = JSON.parse(str)
    } else {
      for (const i in obj) {
        newobj[i] = typeof obj[i] === 'object' ? cloneObj(obj[i]) : obj[i]
      }
    }
    return newobj
  },
  /*
  时间戳转换
  * @param  {number}           unix 时间戳
  * @param  {string}           时间格式
  * @return {object}           指定格式的时间
  */
  convertTimestamp (timestamp, string) {
    if (timestamp) {
      // Convert the passed timestamp to milliseconds
      const d = new Date(timestamp * 1000)
      const yyyy = d.getFullYear()
      // Months are zero based. Add leading 0.
      const mm = ('0' + (d.getMonth() + 1)).slice(-2)
      // Add leading 0.
      const dd = ('0' + d.getDate()).slice(-2)
      const hh = ('0' + d.getHours()).slice(-2)
      const h = hh
      // Add leading 0.
      const min = ('0' + d.getMinutes()).slice(-2)
      const ss = ('0' + d.getSeconds()).slice(-2)
      let time
      if (string === 'yyyy-mm-dd') {
        time = yyyy + '-' + mm + '-' + dd
      } else if (string === 'yyyy-mm-dd-ss') {
        time = yyyy + '-' + mm + '-' + dd + ' ' + h + ':' + min + ':' + ss + ' '
      } else {
        time = yyyy + '-' + mm + '-' + dd + ' ' + h + ':' + min + ' '
      }

      return time
    } else {
      return '*'
    }
  },
  /*
  获取状态颜色
  * @param  {string}           状态字符串
  * @return {string}           状态 css class name
  */
  _getStatusColor (status) {
    if (status && status !== '') {
      if (status === 'Running') {
        return 'status-running'
      } else if (status === 'Succeeded') {
        return 'status-running'
      } else {
        return 'service-not-running'
      }
    } else {
      return 'service-not-running'
    }
  },
  /*   秒格式化
  * @param  {number}           秒数
  * @return {string}           x分x秒|*
  */
  timeFormat (sec) {
    if (!isNaN(sec)) {
      if (sec < 60) {
        return Math.floor(sec) + ' 秒'
      } else if (sec >= 60) {
        let min = 0
        let second = 0
        min = parseInt(sec / 60)
        second = Math.floor(sec % 60)
        if (second === 0) {
          return min + ' 分 ' + '0 秒'
        } else {
          return min + ' 分 ' + second + ' 秒'
        }
      }
    } else {
      return '*'
    }
  },
  /*   秒格式化
  * @param  {number}           秒数
  * @return {string}           XmYs|*
  */
  timeFormatEn (sec) {
    if (!isNaN(sec)) {
      if (sec < 60) {
        return Math.floor(sec) + 's'
      } else if (sec >= 60) {
        let min = 0
        let second = 0
        min = parseInt(sec / 60)
        second = Math.floor(sec % 60)
        if (second === 0) {
          return min + 'm' + '0s'
        } else {
          return min + 'm' + second + 's'
        }
      }
    } else {
      return '*'
    }
  },
  /**
   *
   *
   * @param {array} arr
   * @returns
   */
  unique (arr) {
    const unique = {}
    arr.forEach(function (item) {
      unique[JSON.stringify(item)] = item
    })
    arr = Object.keys(unique).map(function (u) {
      return JSON.parse(u)
    })
    return arr
  },
  /**
   *
   *深排序
   * @param {array} arr
   * @param {string} arg
   * @returns
   */
  deepSortOn (arr, arg) {
    const result_arr = arr.sort((a, b) => {
      const nameA = a[arg].toLowerCase()
      const nameB = b[arg].toLowerCase()
      // sort string ascending
      if (nameA < nameB) return -1
      if (nameA > nameB) return 1
      // default return localeCompare
      return nameA.localeCompare(nameB)
    })
    return result_arr
  },
  /**
   *版本排序
   *
   * @param {array} arr
   * @param {string} arg
   * @param {string} order
   * @returns
   */
  sortVersion (data, arg, order) {
    const isNumber = (v) => {
      return (+v).toString() === v
    }

    const sort = {
      asc: (a, b) => {
        let i = 0
        const l = Math.min(a.value.length, b.value.length)

        while (i < l && a.value[i] === b.value[i]) {
          i++
        }
        if (i === l) {
          return a.value.length - b.value.length
        }
        if (isNumber(a.value[i]) && isNumber(b.value[i])) {
          return a.value[i] - b.value[i]
        }
        return a.value[i].localeCompare(b.value[i])
      },
      desc: (a, b) => {
        return sort.asc(b, a)
      }
    }
    const mapped = data.map((el, i) => {
      return { index: i, value: el[arg].split('.') }
    })

    mapped.sort(sort[order] || sort.asc)
    return mapped.map((el) => {
      return data[el.index]
    })
  },
  /**
   *获取窗口宽*高
   *
   * @returns
   */
  getViewPort () {
    let win = window
    let a = 'inner'
    if (!('innerWidth' in window)) {
      a = 'client'
      win = document.documentElement || document.body
    }
    return { width: win[a + 'Width'], height: win[a + 'Height'] }
  },
  /**
   *日期格式化
   *
   * @param {*} fmt
   * @returns
   */
  dateFormater (fmt) {
    const time = new Date()
    const o = {
      'y+': time.getFullYear(),
      'M+': time.getMonth() + 1,
      'd+': time.getDate(),
      'h+': time.getHours(),
      'm+': time.getMinutes(),
      's+': time.getSeconds(),
      'q+': Math.floor((time.getMonth() + 3) / 3),
      'S+': time.getMilliseconds()
    }
    for (const k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        if (k === 'y+') {
          fmt = fmt.replace(RegExp.$1, ('' + o[k]).substr(4 - RegExp.$1.length))
        } else if (k === 'S+') {
          let lens = RegExp.$1.length
          lens = lens === 1 ? 3 : lens
          fmt = fmt.replace(RegExp.$1, ('00' + o[k]).substr(('' + o[k]).length - 1, lens))
        } else {
          fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
        }
      }
    }
    return fmt
  },
  /**
   * 尾截断，
   * @param text
   * @param showLen 总共展示的长度，包括尾部省略符的长度
   * @param ellipsis 尾部省略符，默认值为'...'
   */
  tailCut (text, showLen, ellipsis) {
    ellipsis = ellipsis || '...'

    if (text.length <= showLen) {
      return text
    } else if (showLen > ellipsis.length) {
      return text.slice(0, showLen - ellipsis.length) + ellipsis
    } else {
      return text.slice(0, showLen) + ellipsis
    }
  },
  /**
   * 头截断，
   * @param text
   * @param showLen 总共展示的长度，包括尾部省略符的长度
   * @param ellipsis 尾部省略符，默认值为''
   */
  headCut (text, showLen, ellipsis) {
    ellipsis = ellipsis || ''
    if (text.length <= showLen) {
      return text
    } else if (showLen > ellipsis.length) {
      return text.slice(text.length - (showLen - ellipsis.length), text.length) + ellipsis
    } else {
      return text.slice(0, showLen) + ellipsis
    }
  },

  /**
   *
   *角色检查
   * @returns {boolean}
   */
  roleCheck (role) {
    if (store.get('role')) {
      return store.get('role').includes(role)
    } else {
      return false
    }
  },
  getUserName () {
    const userinfo = store.get('userInfo')
    if (userinfo && userinfo.name) {
      return userinfo.name
    }
  },
  /**
   *协议检查
   *
   * @returns
   */
  protocolCheck () {
    let protocol = ''
    if (window.location.protocol === 'https:') {
      protocol = 'https'
    } else if (window.location.protocol === 'http:') {
      protocol = 'http'
    }
    return protocol
  },
  /**
   *域名+协议
   *
   * @returns
   */
  getOrigin () {
    return window.location.origin
  },
  /**
   *
   *是否包含大写字母
   * @param {*} str
   * @returns
   */
  includeUppercase (str) {
    let i = 0
    let character = ''
    let included = false
    while (i <= str.length) {
      character = str.charAt(i)
      if (!isNaN(character * 1)) {
        break
      } else {
        if (character === character.toUpperCase()) {
          included = true
          break
        }
        if (character === character.toLowerCase()) {
          included = false
          break
        }
      }
      i++
    }
    return included
  },
  /**
   *byte 格式化
   *
   * @param {*} bytes 原始大小 bytes
   * @param {*} decimals 保留位数
   * @returns
   */
  formatBytes (bytes, decimals) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals || 2
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  },
  scrollToBottom () {
    // https://stackoverflow.com/a/33193668/4788022
    const scrollingElement = document.scrollingElement || document.body
    scrollingElement.scrollTop = scrollingElement.scrollHeight
  },
  calcOverallBuildStatus (buildv2Obj, dockerBuildObj) {
    if (utils.isEmpty(dockerBuildObj)) {
      return buildv2Obj.status
    }
    if (buildv2Obj.status === 'passed') {
      return dockerBuildObj.status
    } else {
      return buildv2Obj.status
    }
  },
  uniqueObjArray (arr, prop) {
    if (arr.length === 0) {
      return arr
    } else {
      if (prop) {
        const obj = {}
        const newArr = arr.reduce((cur, next) => {
          if (!obj[next[prop]]) {
            obj[next[prop]] = true
            cur.push(next)
          }
          return cur
        }, [])
        return newArr
      }
    }
  },
  validatePipelineName (pipeline_names, new_name) {
    if (!new_name || new_name === '') {
      return '请输入工作流名称'
    } else if (pipeline_names.includes(new_name)) {
      return '工作流名称重复'
    } else if (!/^[a-zA-Z0-9-]+$/.test(new_name)) {
      return '名称只支持字母大小写和数字，特殊字符只支持中划线'
    } else {
      return true
    }
  },
  encodeHTMLEntities (str) {
    return str.replace(entitiesRegexp, (match) => {
      return entityMap[match] || match
    })
  },
  /**
   * 根据指定关键字匹配对象数组里的值
   *
   * @param {string} prop 指定的对象字段
   * @param {string} key  要查找的值
   * @param {array} arr  对象数组
   * @returns 过滤结果
   */
  filterObjectArrayByKey (prop, key, arr) {
    if (!key) {
      return arr
    }
    arr = arr.filter((item) => {
      return item[prop].toString().toLowerCase().indexOf(key.toLowerCase()) !== -1
    })
    return arr
  },
  stringifyStrToJson (str) {
    const obj = JSON.parse(str)
    return obj
  },
  statusColor (type, value) {
    switch (type) {
      case 'security':
        if (value === 0) {
          return 'status-good'
        } else if (value > 0) {
          return 'status-bad'
        }
        break
      case 'ut':
        break
      case 'passrate':
        break
      case 'defact':
        if (value === 0) {
          return 'status-good'
        } else if (value > 0) {
          return 'status-bad'
        }
        break
      default:
        break
    }
  },
  applyTransform (item, transform) {
    if (!transform) {
      return item
    }
    if (typeof transform === 'function') {
      return transform(item)
    }
    if (typeof transform === 'string') {
      return item[transform]
    }
    console.error('utilities.js: trying to apply unknown transformation.')
  },
  arrayToMap (arr, transform) {
    const map = {}
    for (const item of arr) {
      map[utils.applyTransform(item, transform)] = item
    }
    return map
  },
  arrayToMapOfArrays (arr, transform) {
    const map = {}
    for (const item of arr) {
      const key = utils.applyTransform(item, transform)
      if (key in map) {
        map[key].push(item)
      } else {
        map[key] = [item]
      }
    }
    return map
  },
  mapToArray (map, insertKeyAsProp) {
    const arr = []
    for (const key in map) {
      const val = map[key]
      if (typeof val === 'object' && insertKeyAsProp) {
        val[insertKeyAsProp] = key
      }
      arr.push(val)
    }
    return arr
  },
  deduplicateArray (arr, transform) {
    const map = new Map(arr.map((item) => [utils.applyTransform(item, transform), item]))
    return Array.from(map.values())
  },
  flattenArray (twoDArr) {
    return twoDArr.reduce((carrier, arr) => {
      return carrier.concat(arr)
    }, [])
  },
  taskElTagType (status) {
    if (status === 'created') {
      return ''
    } else if (status === 'running') {
      return 'primary'
    } else if (status === 'timeout' || status === 'pending-approval') {
      return 'warning'
    } else if (status === 'cancelled' || status === 'skipped') {
      return 'info'
    } else if (status === 'passed') {
      return 'success'
    } else if (status === 'failed') {
      return 'danger'
    } else if (status === 'reject') {
      return 'danger'
    }
  },
  mobileVantTagType (status) {
    if (status === 'created') {
      return 'primary'
    } else if (status === 'running') {
      return 'primary'
    } else if (status === 'timeout' || status === 'pending-approval') {
      return 'warning'
    } else if (status === 'cancelled' || status === 'skipped') {
      return 'warning'
    } else if (status === 'passed') {
      return 'success'
    } else if (status === 'failed') {
      return 'danger'
    }
  },
  /**
   * 返回根据 key 排序好的 object
   *
   * @param {object} object 需要排序的对象
   * @param {array||funtion} sortWith 排序的方式，支持 function 和传入 key 的数组
   * @returns 排序好的 object
   */
  sortObjectKeys (object, sortWith) {
    let keys
    let sortFn

    if (typeof sortWith === 'function') {
      sortFn = sortWith
    } else {
      keys = sortWith
    }

    const objectKeys = Object.keys(object)
    return (keys || []).concat(objectKeys.sort(sortFn)).reduce(function (total, key) {
      if (objectKeys.indexOf(key) !== -1) {
        total[key] = object[key]
      }
      return total
    }, Object.create(null))
  },
  /**
   * 判断 IP 为内网
   *
   * @param {string} addr 需要判断的 IP 地址
   * @returns bool
   */ isPrivateIP (addr) {
    return (
      /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
      /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
      /^(::f{4}:)?172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
      /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
      /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
      /^f[cd][0-9a-f]{2}:/i.test(addr) ||
      /^fe80:/i.test(addr) ||
      /^::1$/.test(addr) ||
      /^::$/.test(addr) ||
      /^localhost$/.test(addr)
    )
  },
  /**
   * 对象数组根据 namePropName 将同一个 namePropName 的数组映射到 map 里
   *
   * @param {array} arr 需要处理的对象数组
   * @param {string} 对象数组的 排序的方式，支持 function 和传入 key 的数组
   * @returns 处理后的 map
   */
  makeMapOfArray (arr, namePropName) {
    const map = {}
    for (const obj of arr) {
      if (!map[obj[namePropName]]) {
        map[obj[namePropName]] = [obj]
      } else {
        map[obj[namePropName]].push(obj)
      }
    }
    return map
  },
  /**
   * 获取 Hostname
   *
   * @param
   * @returns string hostname
   */
  getHostname () {
    return window.location.hostname
  },
  showClusterName (cluster) {
    if (cluster.local) {
      return '本地集群'
    } else {
      return `${cluster.name}`
    }
  },
  showServiceName (unionString, serviceName = '') {
    // The serviceName parameter is split by '_servicename' if present, otherwise it is split by '_'
    if (serviceName) {
      const serviceComponent = unionString.split('_' + serviceName)[0]
      return `${serviceName} (${serviceComponent})`
    } else {
      if (unionString.includes('_')) {
        return `${unionString.split('_')[0]} (${unionString.split('_')[1]})`
      } else {
        return unionString
      }
    }
  },
  // 随机生成32位aesKey
  generateAesKey (len = 16) {
    const arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'a', 'b', 'c', 'd', 'e', 'f', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    let num = ''
    for (let i = 0; i < len; i++) {
      num += arr[parseInt(Math.random() * len)]
    }
    return num
  },
  /**
 * aes加密方法
 * @param {string} text 待加密的字符串
 * @param {array} key 加密key
 */
  rsaEncrypt () {
    const aesKey = this.generateAesKey(32)
    store.set('aesKey', aesKey)
    const localPublicKey = store.get('publicKey') // 取出本地publicKey
    const publicKey = forge.pki.publicKeyFromPem(localPublicKey)
    const buffer = forge.util.createBuffer(aesKey)
    const bytes = buffer.getBytes()
    const encrypted = publicKey.encrypt(bytes, 'RSAES-PKCS1-V1_5')
    const b64Encoded = forge.util.encode64(encrypted) // 转base64
    const res = encodeURIComponent(b64Encoded) // base64有空格问题 再编码一下
    return res
  },

  /**
 * aes解密方法
 * @param {string} encryptedHex 加密的字符串
 * @param {array} key 加密key
 */
  aesDecrypt (data) {
    const aesKey = store.get('aesKey')
    const encryptedBytes = aesjs.utils.hex.toBytes(data)
    const iv = aesjs.utils.utf8.toBytes(aesKey.substr(0, 16))
    const text = aesjs.utils.utf8.toBytes(aesKey)
    // eslint-disable-next-line new-cap
    const aesCfb = new aesjs.ModeOfOperation.cfb(text, iv, 16)
    const decryptedBytes = aesCfb.decrypt(encryptedBytes)
    const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes.slice(16)) // 截取后16位
    // base64
    return decryptedText
  }
}

export default utils
