// Define the schema for the data structure of the connector
const schema = [
  { name: 'SKU', label: 'SKU', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'quantity', label: 'Quantidade', dataType: 'NUMBER', semantics: { conceptType: 'DIMENSION' } },
  { name: 'paid_amount', label: 'Montante pago', dataType: 'NUMBER', semantics: { conceptType: 'DIMENSION' } },
  { name: 'avg_price', label: 'Preço médio', dataType: 'NUMBER', semantics: { conceptType: 'DIMENSION' } },
];

// Return the defined schema to Data Studio
function getSchema(request) {
  return { schema: schema }
}

const cc = DataStudioApp.createCommunityConnector()
// Base API endpoint
const BASE_URL = 'https://api.e-com.plus/v1'

function md5(inputString) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, inputString)
    .reduce((output, byte) => output + (byte & 255).toString(16).padStart(2, '0'), '')
}

function getAuthType() {
  return cc.newAuthTypeResponse()
    .setAuthType(cc.AuthType.USER_PASS)
    .build()
}

// Check if the current user has administrative privileges
function isAdminUser() {
  return true
}

function resetAuth() {
  var userProperties = PropertiesService.getUserProperties()
  // userProperties.deleteProperty('dscc.key')
  userProperties.deleteProperty('ecom.authenticationId')
  userProperties.deleteProperty('ecom.apiKey')
  userProperties.deleteProperty('ecom.storeId')
  userProperties.deleteProperty('ecom.accessToken')
  userProperties.deleteProperty('ecom.expires')
}

async function requestAuthEcomplus(authenticationId, apiKey, storeId) {
  const body = {
    _id: authenticationId,
    api_key: apiKey
  }

  const options = {
    payload: JSON.stringify(body),
    headers: {
      'x-store-id': storeId
    }
  }
  return UrlFetchApp.fetch(`${BASE_URL}/_authenticate.json`, options)
}

function getUser() {
  const userProperties = PropertiesService.getUserProperties()
  const authenticationId = userProperties.getProperty('ecom.authenticationId')
  const apiKey = userProperties.getProperty('ecom.apiKey')
  const storeId = userProperties.getProperty('ecom.storeId')
  const accessToken = userProperties.getProperty('ecom.accessToken')
  return {
    userProperties,
    authenticationId,
    apiKey,
    storeId,
    accessToken
  }
}

async function isAuthValid() {
  const {
    userProperties,
    authenticationId,
    apiKey,
    storeId
  } = getUser()

  let accessToken = userProperties.getProperty('ecom.accessToken')
  const expires = userProperties.getProperty('ecom.expires')
  if (expires) {
    const dateExpires = new Date(expires).getTime()
    const now = new Date().getTime()
    if (now > (dateExpires - 1 * 60 * 60 * 1000)) {
      const resAuth = await requestAuthEcomplus(authenticationId, apiKey, storeId)
      if (resAuth.getResponseCode() !== 200) {
        return false
      }
      const responseAuth = JSON.parse(resAuth)
      userProperties.setProperty('ecom.accessToken', responseAuth.access_token)
      userProperties.setProperty('ecom.expires', responseAuth.expires)
      accessToken = responseAuth.access_token
    }
    const headers = {
      'x-store-id': storeId,
      'x-my-id': authenticationId,
      'x-access-token': accessToken
    }
    var res = UrlFetchApp.fetch(`${BASE_URL}/authentications/me.json`, { headers,  'muteHttpExceptions': true })
    return res.getResponseCode() === 200
  } else {
    return false
  }
}

async function setCredentials(request) {
  const rawUserParts = request.userPass.username.split(':')
  let storeId = 0
  let authUsername = ''
  let authId = ''
  if (rawUserParts.length === 2) {
    storeId = Number(rawUserParts[0])
    authId = rawUserParts[1]
  } else {
    authUsername = rawUserParts[0]
  }
  const rawPass = request.userPass.password
  let authApiKey = storeId && rawPass.length === 128 ? rawPass : ''
  const authPassMd5 = authApiKey ? '' : md5(rawPass);
  let loginData
  if (!authApiKey) {
    const resp = UrlFetchApp.fetch(`${BASE_URL}/_login.json`, {
      payload: JSON.stringify({
        username: authUsername,
        pass_md5_hash: authPassMd5,
      }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-store-id': storeId
      },
    });
    if (resp.getResponseCode() !== 200) {
      return cc.newSetCredentialsResponse()
        .setIsValid(false)
        .build()
    }
    loginData = JSON.parse(resp)
  }
  if (loginData) {
    storeId = loginData.store_id
    authId = loginData._id
    authApiKey = loginData.api_key
  }

  var userProperties = PropertiesService.getUserProperties()
  userProperties.setProperty('ecom.authenticationId', authId)
  userProperties.setProperty('ecom.apiKey', authApiKey)
  userProperties.setProperty('ecom.storeId', `${storeId}`)
  
  const resAuth = await requestAuthEcomplus(authId, authApiKey, `${storeId}`)
  if (resAuth.getResponseCode() !== 200) {
    return cc.newSetCredentialsResponse()
      .setIsValid(false)
      .build()
  }
  const responseAuth = JSON.parse(resAuth)
  userProperties.setProperty('ecom.accessToken', responseAuth.access_token)
  userProperties.setProperty('ecom.expires', responseAuth.expires)

  return cc.newSetCredentialsResponse()
    .setIsValid(true)
    .build()
}

function getConfig(request) {
  const config = cc.getConfig()
  config.newTextInput()
    .setId('dateInit')
    .setName('dateInit')
    .setHelpText('Enter a start date:')
    .setPlaceholder('DD/MM/AAAA')

  config.newTextInput()
    .setId('dateEnd')
    .setName('dateEnd')
    .setHelpText('Enter a end date:')
    .setPlaceholder('DD/MM/AAAA')

  return config.build()
}

function parseDate(params) {

 const dateInit = new Date();
  dateInit.setDate(1)
  dateInit.setMonth(0)
  dateInit.setHours(0)
  dateInit.setMinutes(0)
  dateInit.setSeconds(0)
  dateInit.setMilliseconds(0)
  const dateEnd = new Date()
  dateEnd.setMonth(11)
  dateEnd.setDate(31)
  dateEnd.setHours(-1)
  dateEnd.setMinutes(59)
  dateEnd.setSeconds(59)
  dateEnd.setMilliseconds(999)

  if(params){
    const endStr = params['dateEnd']
    const end = endStr && endStr.split('/')
    if(end.length) {
      if(end[0] && parseInt(end[0]) <= 31) {
        dateEnd.setDate(parseInt(end[0]))
      }
      if(end[1] && parseInt(end[1]) <= 12) {
        dateEnd.setMonth(parseInt(end[1]) - 1)
      }

      if(end[2] && parseInt(end[2]) > 999) {
        dateEnd.setFullYear(parseInt(end[2]))
      }
    }

    const initStr = params['dateInit']
    const init = initStr && initStr.split('/')

    if(init.length) {
      if(init[0] && parseInt(init[0]) <= 31) {
        dateInit.setDate(parseInt(init[0]))
      }
      if(init[1] && parseInt(init[1]) <= 12) {
        dateInit.setMonth(parseInt(init[1]) - 1)
      }

      if(init[2] && parseInt(init[2]) > 999) {
        dateInit.setFullYear(parseInt(init[2]))
      }
    }
  }

  return{
    dateInit: dateInit.toISOString(),
    dateEnd: dateEnd.toISOString()
  }
}

function getData(request) {
  if (isAuthValid()) {
    const {
      userProperties,
      authenticationId,
      storeId,
      accessToken
    } = getUser()

    const dataSchema = schema.reduce((init, current) => {
      const isExist = request.fields.find(field => field.name === current.name)
      if (isExist) {
        init.push(current)
      }
      return init
    }, [])

    const listOrdersUrl = BASE_URL + '/$aggregate.json'
    const headers = {
      'X-Access-Token': accessToken,
      'X-Store-ID': storeId,
      'X-My-ID': authenticationId
    }
    const {
      dateInit,
      dateEnd
    } = parseDate(request.configParams)

    const body= {
     "resource": "orders",
      "pipeline": [
        {
          "$match" : {
            "created_at": {
              "$gte" : dateInit, 
              "$lte" : dateEnd
            },
            "financial_status.current": "paid"
          }
        },
        {
          "$project": {
            "items.sku": 1,
            "items.quantity": 1,
            "items.price": 1,
            "items.final_price": 1,
          }
        }
      ]
    }

    const options = {
      headers,
      payload: JSON.stringify(body),
      method: 'POST'
    }

    const resAggregation = UrlFetchApp.fetch(listOrdersUrl, options)
    const parseAggregation = JSON.parse(resAggregation)
    const aggregation = parseAggregation.result.reduce((items, order) => {
      order.items.forEach((item) => {
        const price = item.final_price || item.price
        const amount = (item.quantity * price)
        const listedItem = items.find(({ sku }) => sku === item.sku)
        if (listedItem) {
          listedItem.quantity += item.quantity
          listedItem.paid_amount += amount
        } else {
          items.push({
            sku: item.sku,
            quantity: item.quantity,
            paid_amount: amount
          })
        }
      })
      return items
    }, [])
   
    const rows = aggregation.map(item => {
      const values = dataSchema.map(field => {
        if (field.name === 'sku') {
          return item.sku
        }
        if (field.name === 'quantity') {
          return item.quantity
        }
        if (field.name === 'paid_amount') {
          return item.paid_amount
        }
        if (field.name === 'avg_price') {
          return Math.round((item.paid_amount / item.quantity) * 100) / 100
        }
        return field.dataType === 'NUMBER' ? 0 : ''
      })
      return { values }
    })

    return {
      schema: dataSchema,
      rows
    }
  }
  return {
    schema: [],
    rows: []
  }
}
