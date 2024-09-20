// Define the schema for the data structure of the connector
const schema = [
  { name: '_id', label: 'ID do pedido', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'number', label: 'Número do pedido', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'financial_status.current', label: 'Status de pagamento', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'buyers._id', label: 'ID do cliente', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'buyers.main_email', label: 'E-mail do cliente', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'buyers.doc_number', label: 'CPF/CNPJ do cliente', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'amount.total', label: 'Total do pedido', dataType: 'NUMBER', semantics: { conceptType: 'DIMENSION' } },
  { name: 'amount.subtotal', label: 'Subtotal do pedido', dataType: 'NUMBER', semantics: { conceptType: 'DIMENSION' } },
  { name: 'amount.discount', label: 'Desconto do pedido', dataType: 'NUMBER', semantics: { conceptType: 'DIMENSION' } },
  { name: 'amount.freight', label: 'Frete do pedido', dataType: 'NUMBER', semantics: { conceptType: 'DIMENSION' } },
  { name: 'loyalty_points.name', label: 'Nome dos pontos de fidelidade', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'loyalty_points.value', label: 'Valor dos pontos de fidelidade', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'created_at', label: 'Data de criação', dataType: 'STRING', semantics: { conceptType: 'DIMENSION', semanticType: 'YEAR_MONTH_DAY_SECOND'} },
  { name: 'items.0.sku', label: 'SKU 1', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'items.0.quantity', label: 'Quantidade SKU 1', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.0.final_price', label: 'Preço SKU 1', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.1.sku', label: 'SKU 2', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'items.1.quantity', label: 'Quantidade SKU 2', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.1.final_price', label: 'Preço SKU 2', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.2.sku', label: 'SKU 3', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'items.2.quantity', label: 'Quantidade SKU 3', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.2.final_price', label: 'Preço SKU 3', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.3.sku', label: 'SKU 4', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'items.3.quantity', label: 'Quantidade SKU 4', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.3.final_price', label: 'Preço SKU 4', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.4.sku', label: 'SKU 5', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'items.4.quantity', label: 'Quantidade SKU 5', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.4.final_price', label: 'Preço SKU 5', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.5.sku', label: 'SKU 6', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'items.5.quantity', label: 'Quantidade SKU 6', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.5.final_price', label: 'Preço SKU 6', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.6.sku', label: 'SKU 7', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'items.6.quantity', label: 'Quantidade SKU 7', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.6.final_price', label: 'Preço SKU 7', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.7.sku', label: 'SKU 8', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'items.7.quantity', label: 'Quantidade SKU 8', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.7.final_price', label: 'Preço SKU 8', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.8.sku', label: 'SKU 9', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'items.8.quantity', label: 'Quantidade SKU 9', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'items.8.final_price', label: 'Preço SKU 9', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
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
            }
          }
        },
        {
          "$project": {
            "number": 1,
            "financial_status.current": 1,
            "buyers.doc_number": 1,
            "buyers.main_email": 1,
            "buyers._id": 1,
            "amount": 1,
            "loyalty_points": 1,
            "items.sku": 1,
            "items.quantity": 1,
            "items.price": 1,
            "items.final_price": 1,
            "created_at": 1
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
    const aggregation = parseAggregation.result
   
    const rows = aggregation.map(order => {
      const values = dataSchema.map(field => {
        if(field.name.startsWith('buyers')){
          const fields = field.name.split('.')
          const customer = order[fields[0]] && order[fields[0]].length && order[fields[0]][0][fields[1]]
          return customer ? customer : (field.dataType === 'NUMBER' ? 0 : '') 
        }
        if(field.name.startsWith('loyalty_points')){
          const fields = field.name.split('.')
          const loyaltyPoints = order[fields[0]]
          const keys = Object.keys(loyaltyPoints)
          category[keys[0]][fields[1]]

          return loyaltyPoints && keys && keys.length
            ? loyaltyPoints[keys[0]][fields[1]]
            : field.dataType === 'NUMBER' ? 0 : ''
        }
        if(field.name.startsWith('amount')){
          const fields = field.name.split('.')
          const amount = order[fields[0]] && order[fields[0]][fields[1]]
          return amount || 0
        }
        if(field.name.startsWith('items')){
          const fields = field.name.split('.')
          const item = order.items && order.items[Number(fields[1])]
          let value = item && item[fields[2]]
          if (!value && item && field.name.endsWith('final_price')) {
            value = item.price
          }
          return value || (field.dataType === 'NUMBER' ? 0 : '')
        }
        if(field.name.startsWith('created_at')){
          const dateString = order[field.name].split('T')
          let date = dateString[0].replaceAll('-','')
          date += dateString[1].split('.')[0].replaceAll(':','')
          return date
        }
        if(field.name.startsWith('financial_status')){
          const fields = field.name.split('.')
          const financial_status = order[fields[0]] && order[fields[0]][fields[1]]
          return financial_status
        }
        if(field.name === 'number'){
          return order[field.name] ? `${order[field.name]}` : ''
        }
        return order[field.name] || typeof order[field.name] === 'number' ? order[field.name] : ''
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
