
// Define the schema for the data structure of the connector
const schema = [
  { name: '_id', label: 'Product Id', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'name', label: 'Name', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'sku', label: 'Sku', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'categories._id', label: 'Category ID', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'categories.name', label: 'Category Name', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'quantity', label: 'Quantity', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
]

// Return the defined schema to Data Studio
function getSchema(request) {
  console.log('>> schema ', request)
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
  const body = {
    username: request.userPass.username,
    pass_md5_hash: md5(request.userPass.password)
  }
  const options = {
    payload: JSON.stringify(body),
    headers: {
      'x-store-id': 1173
    }
  }
  var res = UrlFetchApp.fetch(`${BASE_URL}/_login.json`, options)
  if (res.getResponseCode() !== 200) {
    return cc.newSetCredentialsResponse()
      .setIsValid(false)
      .build()
  } else {
    const response = JSON.parse(res)
    var userProperties = PropertiesService.getUserProperties()
    userProperties.setProperty('ecom.authenticationId', response._id)
    userProperties.setProperty('ecom.apiKey', response.api_key)
    userProperties.setProperty('ecom.storeId', `${response.store_id}`)

    const resAuth = await requestAuthEcomplus(response._id, response.api_key, `${response.store_id}`)
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
}

function getConfig(request) {

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

    const listProductsUrl = BASE_URL + '/$aggregate.json'
    const headers = {
      'X-Access-Token': accessToken,
      'X-Store-ID': storeId,
      'X-My-ID': authenticationId
    }

    const body= {
     "resource": "products",
      "pipeline": [
        {
            "$project": {
                "categories": 1,
                "name": 1,
                "sku": 1,
                "quantity": 1
            }
        },
        {
            "$unwind": {
                "path": "$categories",
                "preserveNullAndEmptyArrays": true
            }
        }
      ]
    }

    const options = {
      headers,
      payload: JSON.stringify(body),
      method: 'POST'
    }

    const resAggregation = UrlFetchApp.fetch(listProductsUrl, options)
    const parseAggregation = JSON.parse(resAggregation)
    const aggregation = parseAggregation.result
   
    const rows = aggregation.map(product => {
      const values = dataSchema.map(field => {
        if(field.name.startsWith('categories')){
          const fields = field.name.split('.')
          const category = product[fields[0]] && product[fields[0]][fields[1]]
          return category || ''
        }
        return product[field.name] || typeof product[field.name] === 'number' ? product[field.name] : ''
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
